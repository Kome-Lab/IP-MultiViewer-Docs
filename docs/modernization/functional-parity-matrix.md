# UI全面改修 機能互換性マトリクス・統合結果

最終更新: 2026-07-17

この表は、旧UIに存在した機能を新UIから暗黙的に落とさないために作成した移行台帳です。2026-07-15時点の旧新比較を履歴として残し、その後の正式統合結果を先頭へ追記します。表内の`Legacy` / `Next`は比較当時の名称であり、現在のsource treeや利用者向けEXEが分離していることを意味しません。

## 2026-07-17の正式統合結果

- 正式UIを`apps/desktop-windows/IPMultiViewer.csproj`へ統合し、比較用のLegacy/Next別projectを廃止。
- 正式configを`local-config.json`、logを`desktop.log`へ統一。より新しいpreview版`local-config.next.json`は起動時に正式configへ昇格し、移行元原本を保持。
- runtime smokeを`apps/desktop-windows/runtime-smoke`、UI / live meter / AV sync QAを`apps/desktop-windows/qa`へ統合。
- QA成功markerを`windows_ui_qa_ok`と`windows_av_sync_ok`へ正式化。
- 未採用state/playback scaffoldと`desktop-api-client`を削除。`desktop-core`は正式UIが利用する`AudioMeterScale`だけを保持。
- Settings / Alert History刷新、3x3/VU visual QA、config昇格QAは正式projectへ引継ぎ済み。全state、16stream性能、長時間、実カメラ、実Serverは未完了。

| 統合対象 | 正式状態 |
|---|---|
| Build / EXE | `apps/desktop-windows/IPMultiViewer.csproj` → `IPMultiViewer.exe` |
| Config / log | `local-config.json` / `desktop.log` |
| Runtime smoke | `apps/desktop-windows/runtime-smoke` |
| UI QA | `apps/desktop-windows/qa` |
| Core package | `packages/desktop-core/Audio/AudioMeterScale.cs` |
| 削除済み | Legacy/Next別project、typed API client、未採用state/playback scaffold |

## ステータス規則

- `調査済み`: コード、ドキュメント、実画面、または実WPF smokeの根拠を確認済み。
- `未調査`: 不要という意味ではなく、追加の実機・運用環境・外部利用者確認が必要。
- `実装済み（共有）`: 2026-07-15の比較時点で、比較EXEが旧実装と同じcode pathを利用していた状態。
- `限定QA済み`: 記載したfixture・状態だけを自動確認済み。
- `未テスト`: 比較時点で新UIに対する該当機能の専用テストがなかった状態。
- `未比較`: 旧UIと新UIの同条件比較をまだ行っていない。
- `互換性未確認`: 移行完了を主張できない状態。

## 互換性マトリクス（2026-07-15比較snapshot）

次の表は移行判断の根拠を残す履歴です。現在のbuild/config/test pathは上の「正式統合結果」を正とします。

| ID | 画面 | 現行機能・操作 | 入力 → 出力 | API・イベント | 現行権限 | 現行調査 | 新UI設計 | 新UI実装 | 新UIテスト | 旧新比較 | 互換性 | 必須移行条件 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NAV-001 | 全体 | 単一起動 | 二重起動 → 後発プロセス終了 | なし | Windows利用者 | 調査済み | 同一familyで1本だけ | 実装済み | code確認 | 対象外 | 限定確認 | Legacy/Next切替前に起動中EXEを終了する |
| MV-001 | Main | 初期表示 | local config → mode、tile、alert、layout | local JSON | Windows利用者 | 調査済み・実画面確認 | Direct Matrix | 実装済み | Next QA・config copy確認 | 3x3/VU同一viewport比較済み | 限定確認 | 初回copy後はLegacy/Next configを分離する |
| MV-002 | Main | 起動時自動再生 | 起動500ms後 → active layoutの有効streamを開始 | なし | Windows利用者 | 調査済み・smoke確認 | 現行維持 | 実装済み（共有） | Legacy smoke・Next build | 未比較 | 未確認 | Next専用assertを追加する |
| MV-003 | Main | 手動Start | active layout → receiver開始、summary/footer更新 | なし | Windows利用者 | 調査済み・実画面確認 | Direct Matrix command bar | 実装済み（共有） | 4-stream live QA | 未比較 | 限定確認 | 部分失敗状態は追加fixtureで確認する |
| MV-004 | Main | Stop | 全loaded playback → player/monitor停止 | なし | Windows利用者 | 調査済み・実画面確認 | Direct Matrix command bar | 実装済み（共有） | Legacy smoke・Next close cleanup | 未比較 | 未確認 | Stop単独のsession/process/handle解放assertを追加する |
| MV-005 | Main | Layout切替 | 2x2/3x3/4x4 → grid再構築、active layout保存 | heartbeatにlayout ID | Windows利用者＋sync token | 調査済み・smoke確認 | Direct Matrix grid | 実装済み（共有） | Next QAで4/9/16 tile確認 | Legacy smokeと限定比較 | 限定確認 | 実Server heartbeat値と性能を追加確認する |
| MV-006 | Main | タイル割当・解除・swap | tile index＋stream ID → layout即時保存 | local JSON | Windows利用者 | 調査済み・実画面確認 | Next tileにAssign/Change | 実装済み（共有） | Next buildのみ | 未比較 | 未確認 | assign/unassign/swapのNext E2Eを追加する |
| MV-007 | Main/Settings | 新規stream自動配置 | Add stream → active layout最初の空きtile | local JSON | Windows利用者 | 調査済み | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | Next configで追加・空きなしをE2E確認する |
| MV-008 | Main | Layout外stream停止 | layout切替 → receiver停止、監視alertをresolved | local alert、client-alerts | Windows利用者＋sync token | 調査済み・smoke確認 | 現行維持 | 実装済み（共有） | Legacy smoke・Next layout QA | 未比較 | 未確認 | Nextでreceiver停止とalert resolveを直接assertする |
| MV-009 | Main | VideoTile表示 | frame、name、status、overlay、meter、Change | playback state | Windows利用者 | 調査済み・実画面確認 | Direct Matrix tile | 実装済み | Next QA・capture | 3x3/VU同一viewport比較済み | 限定確認 | 実カメラと全state captureを追加する |
| MV-010 | Main | tile状態表示 | unassigned/disabled/stopped/starting/rendering/playing/stale/error/alert | playback state | Windows利用者 | 調査済み | label＋色frame | 実装済み（共有） | playing/standby/alert fixture | fixture state比較済み | 限定確認 | stale/error/reconnectingの全state fixtureを追加する |
| MV-011 | Main | 映像placeholder | 未割当、No signal、開始中、停止中 → 明示表示 | playback state | Windows利用者 | 調査済み・実画面確認 | Direct Matrix surface | 実装済み（共有） | standby fixture | standby比較済み | 未確認 | No signal/stale/loadingの全state fixtureを追加する |
| MV-012 | Main | 状態強調 | alert/pending → severity色frameと点滅 | alert state | Windows利用者 | 調査済み・実画面確認 | status text＋色frame、viewport非変更の透明overlay Window | 実装済み（共有＋Next overlay） | alert解消・再open、inactive、他アプリforeground、最小化時のsurface/session・z-order確認 | alert state比較済み | 限定確認 | 点滅抑制と非色依存表現は未実装 |
| MV-013 | Main | Playback summary | active/loaded/layout/error/backend → header summary | playback state | Windows利用者 | 調査済み・実画面確認 | compact command bar＋DECODE / OUTPUT | 実装済み（共有＋Next indicator） | runtime evidence/frame提示/REQUESTED/UNKNOWN QA・capture | 同一viewport比較済み | 限定確認 | LibVLCはruntime GPU activeを確定せず、実入力性能は未確認 |
| MV-014 | Main | playback自動再接続 | recoverable/error/stale → 5～60秒backoff再起動 | なし | Windows利用者 | 調査済み | 現行維持 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | attempt、次回試行、最終frame表示は未実装 |
| AUD-001 | Main | Audio meter | 直近3秒のsnapshot → channel別RMS/peak表示 | playback telemetry | Windows利用者 | 調査済み・smoke確認 | 左右meter bank | 実装済み | 4stream×4channel live QA、16channel fit | VU/PEAK capture確認 | 限定確認 | 実入力・4x4同時表示・長時間を追加確認する |
| AUD-002 | Settings/Main | Audio監視 | stream設定 → silence/no-track/clipping監視 | local alert/client-alerts | Windows利用者＋sync token | 調査済み | 現行維持 | 実装済み（共有） | live meter入力のみ | 未比較 | 未確認 | silence/no-track/clipping alertのNext専用E2Eを追加する |
| AUD-003 | Settings | Global mute | checkbox → config更新、playerへmute適用 | local JSON | Windows利用者 | 調査済み・コード上の不整合あり | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | 現行実効挙動を実音声で確定するまで仕様変更しない |
| AUD-004 | Settings/Main | Alert sound | global ON/OFF＋stream mute → severity別loop音 | local alert | Windows利用者 | 調査済み | 現行維持 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | 再生音声とalert音の責務を分離する |
| AUD-005 | Main | Meter mode | global VU/PEAK → 全表示channelのscale・元値・目盛りを切替 | local JSON/playback telemetry | Windows利用者 | 新規 | segmented VU/PEAK | 実装済み | scale self-test、live差分、persist、marker QA | VU/PEAK capture確認 | 限定確認 | VUはRMS/`0 VU=-18 dBFS`、PEAKはpeak/`0 dBFS`を維持する |
| ALR-001 | Main | 自動検知 | decode/no-signal/black/freeze/low-FPS/audio異常 → AlertRecord | client-alerts | Windows利用者＋sync token | 調査済み・一部smoke確認 | 現行維持 | 実装済み（共有） | Legacy smokeのみ | 未比較 | 未確認 | 24種のalert typeをNext fixtureで確認する |
| ALR-002 | Main | tile overlay | active alert → 最大5件とA/S/R/I操作 | local alert/client-alerts | Windows利用者＋sync token | 調査済み・実画面確認 | video surface上部を予約 | 実装済み（共有） | live alert reserve QA | alert fixture比較済み | 限定確認 | 各操作と複数alertのNext E2Eを追加する |
| ALR-003 | Alert History | 履歴一覧 | 全alert → active優先、更新日時降順 | GET /alerts | sync token | 調査済み・実画面確認 | Legacy window継続 | 実装済み（共有） | Next buildのみ | 未比較 | 未確認 | Next専用E2E後に再設計へ進む |
| ALR-004 | Alert History/Main | 状態変更 | selected alert → acknowledged/snoozed/resolved/ignored | POST /client-alerts | Windows利用者＋sync token | 調査済み・選択状態実画面確認 | Legacy経路継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | local-first更新とsync dirtyをNext E2Eで確認する |
| ALR-005 | Alert History | Snooze | 操作 → 既定10分snooze、期限後openへ復帰 | client-alerts | Windows利用者＋sync token | 調査済み | Legacy window継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | 10分既定と期限復帰をNext E2Eで確認する |
| ALR-006 | Main | 自動Resolve | 異常復旧またはlayout監視外 → resolved | client-alerts/resolve API | Windows利用者＋sync token | 調査済み | 現行維持 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | 手動Resolveと自動Resolveの由来記録は未実装 |
| CFG-001 | Settings | 設定永続化 | streams/layouts/profiles/history/audio/sync/token → snake_case JSON | local JSON | Windows利用者 | 調査済み | Legacy/Next分離 | 実装済み（共有） | 初回copy・原本不変・meter persist QA | byte比較済み | 限定確認 | 逆同期なしを運用手順へ明記し、rollback exportを追加する |
| CFG-002 | Settings | Stream編集 | name/URL/protocol/group/tags/profile/switches → stream更新 | local JSON | Windows利用者 | 調査済み・実画面確認 | Legacy Settings継続 | 実装済み（共有） | Next buildのみ | 未比較 | 未確認 | mask済みURLを含むNext config E2Eを追加する |
| CFG-003 | Settings | Stream追加・削除 | Add/Delete → config、layout、関連alert更新 | local JSON | Windows利用者 | 調査済み | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | 削除確認は未実装。現行結果をNext E2Eで固定する |
| CFG-004 | Settings | URL secret mask | credential/query secret → `****`/`<REDACTED>` | なし | Windows利用者 | 調査済み | 現行維持 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | Next log/UI/API traceのsecret回帰を追加する |
| CFG-005 | Settings | Profile CRUD | New/Duplicate/Delete/Apply → profile保存、参照付替え | local JSON | Windows利用者 | 調査済み | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | Desktop-only閾値をNext config/sync E2Eで確認する |
| CFG-006 | Settings | ApplyとSaveの分離 | Apply stream/profile、上部Save → 異なる保存対象 | local JSON | Windows利用者 | 調査済み・実画面確認 | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | UI再設計時にdirty範囲と結果を完全定義する |
| CFG-007 | Settings | Import/Export/Reload | OS dialog/default path → config置換、書出し、再読込 | local JSON | Windows利用者 | 調査済み・OS dialog実操作未確認 | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | Nextはnext configへ保存。preview/confirm/backupは未実装 |
| SYNC-001 | Settings | Server sync設定 | URL/token/enable → 保存、即時sync | REST | sync token | 調査済み・実画面確認 | Legacy Settings継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | token非露出とNext実Server接続を確認する |
| SYNC-002 | Main/Settings | 定期同期 | 15秒poll → register、heartbeat、config、clients、alerts | REST polling | sync token | 調査済み | 現行poll継続 | 実装済み（共有） | typed client smokeのみ、UI未採用 | 未比較 | 未確認 | Next実Server E2E後にtyped clientへ移行する |
| SYNC-003 | Main/Settings | sync失敗・再試行 | HTTP失敗 → 約1秒ごと再試行、旧dataを保持 | REST polling | sync token | 調査済み・実Server未確認 | 現行維持 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | stale/再接続中/最終成功時刻は未実装 |
| SYNC-004 | Main/Settings | Server config merge | streams/layouts/profiles → local collection更新 | GET APIs | sync token | 調査済み | 現行維持 | 実装済み（共有） | typed client smokeのみ、UI未採用 | 未比較 | 未確認 | 空配列・masked URL・Desktop-only fieldをNext実Serverで確認する |
| AUTH-001 | Server sync | client token認証 | Bearer/X-Client-Token → 200/401/403 | REST | 同一token、role差なし | 調査済み | 現行維持 | 実装済み（共有） | typed client smoke、UI未採用 | 未比較 | 未確認 | Next実行経路の401/403 E2Eを追加する |
| EXT-001 | Server | Webhook通知 | active alert/severity上昇/test → provider payload | outbound webhook | server token | 調査済み | 対象外・契約維持 | UI変更なし | Server testのみ | 対象外 | 維持 | Nextは通知設定APIを追加利用しない |
| OPS-001 | 全体 | キーボード | WPF標準Tab/Enterのみ、明示shortcutなし | なし | Windows利用者 | 調査済み・focus順未確認 | WPF標準継続 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | Tab順・focus・Narrator・200%を追加確認する |
| OPS-002 | Main | 高度マウス操作 | double-click/right-click/drag-dropなし | なし | Windows利用者 | 調査済み | 既存Click維持 | 実装済み（共有） | 未テスト | 未比較 | 未確認 | Assign/Change clickをE2E確認する |
| OPS-003 | Main | Fullscreen | 現行実装なし | なし | Windows利用者 | 調査済み | 対象外 | 追加なし | 対象外 | 対象外 | 現行維持 | 追加する場合は独立enhancementとして扱う |
| OPS-004 | Main/History | 検索・filter・大量履歴 | 全文検索＋status/severity filter、表示最大500件、terminal保持1,000件 | GET /alertsは全件 | Windows利用者 | 8,000件超を実測 | shared History刷新 | 実装済み（共有） | virtualization/retention smoke追加 | 画面比較中 | 状態遷移維持 | Server側pagingとbulk操作は別管理する |
| OPS-005 | 全体 | Routing/戻る進む/URL状態 | WPF補助Window方式、browser routeなし | なし | Windows利用者 | 調査済み | WPF補助Window継続 | 実装済み（共有） | Next buildのみ | 対象外 | 現行維持 | desktop workflowをWeb routing前提へ変えない |

## 未調査・追加証拠待ち

以下は互換対象から除外しません。証拠が揃うまで `未調査` のまま残します。

| ID | 未確認事項 | 必要な証拠 |
|---|---|---|
| UNK-001 | 実カメラ、実RTSP/RTMP/HLS/SRTでの映像・音声 | 代表入力ごとの旧UI実測、screen/video、receiver log |
| UNK-002 | 4/9/16同時streamのCPU/GPU/RAM/handleと長時間安定性 | 同一PC・同一input・同一時間の正式runtime baseline |
| UNK-003 | 実Serverでの401/403、停止、復旧、stale表示 | Desktop＋Server統合試験とpacket/API trace |
| UNK-004 | Import/Export OSダイアログのkeyboard・cancel・上書き挙動 | Windows UI Automation実行記録 |
| UNK-005 | keyboard focus順、screen reader、高contrast、200% DPI | Accessibility Insights/Narrator/実画面証拠 |
| UNK-006 | 複数monitor、表示scale混在、最小window、4K | viewport別screen captureと操作試験 |
| UNK-007 | 外部admin toolや独自clientによる34 REST routeの利用 | 運用者・連携システム確認とaccess log |
| UNK-008 | リポジトリ外のWebSocket/SSE gateway | 配備構成、reverse proxy、network diagram |
| UNK-009 | 複数Desktop同時編集、時計ずれ、イベント順序逆転 | concurrency/clock-skew test |
| UNK-010 | disk full、snapshot破損、SQLite lock時の復旧 | fault-injection testと運用runbook |

## 根拠

- 画面: `apps/desktop-windows/MainWindow.xaml:181`、`SettingsWindow.xaml:323`、`AlertHistoryWindow.xaml:127`
- 主な操作: `MainWindow.xaml.cs:539`、`:1749`、`:1885`、`:2623`、`:3528`、`:4106`
- 同期: `MainWindow.xaml.cs:4530`、`:4899`
- 設定: `LocalConfig.cs:12`、`:116`、`:184`
- Server認証: `apps/server/cmd/server/main.go:1227`
- 実WPF smoke: `apps/desktop-windows/runtime-smoke/Program.cs`
- UI / AV sync QA: `apps/desktop-windows/qa/Program.cs`
- 音声meter scale: `packages/desktop-core/Audio/AudioMeterScale.cs`

すべて `C:\Users\yhika\Documents\IPMultiViewer\ip-multiviewer` を基準とするパスです。
