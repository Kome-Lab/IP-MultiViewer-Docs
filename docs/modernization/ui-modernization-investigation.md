# IP MultiViewer UI全面改修 調査・正式統合記録

最終更新: 2026-07-17

## 結論

実装・検証段階では **.NET 10 / WPFを継続し、現行EXEを残したまま別EXEの新WPFシェルを段階構築する方式**を採用しました。Direct Matrixデザインの`IPMultiViewer.Next`を別project・別EXEとして実装し、Legacyと比較できる構成にしました。

2026-07-17にDirect Matrix UIを`apps/desktop-windows/IPMultiViewer.csproj`へ正式統合しました。比較用だったLegacy/Next別projectは廃止し、通常releaseはZIP直下の`IPMultiViewer.exe`だけを配布します。standard/GPUの違いはZIP名で示します。以下の`Legacy` / `Next`表記は、2026-07-15〜16の比較・移行経緯を示す過去記録です。

技術的な最大課題はWPF自体ではなく、7,000行を超える`MainWindow.xaml.cs`へUI、LibVLC/FFmpeg、音声、検知、REST polling、設定保存が集中していることです。正式統合では、実行経路を1projectへ戻し、実際に採用していなかったstate/playback scaffoldとtyped API clientを削除しました。`packages/desktop-core`に残す抽出境界は音声meter scaleだけです。

代表PoCは **メインMultiviewer画面**です。2x2/3x3/4x4、layout切替、tile割当、再生状態、音声meter、alert overlay、REST同期、session解放を1画面で継続検証します。

調査・実装成果物:

- [機能互換性マトリクス](./functional-parity-matrix.md)
- [API・イベント契約調査](./api-and-event-inventory.md)
- 現行UIの実画面証拠: `/public/images/ui-modernization/2026-07-14/`
- 承認済み移行時UI参照画像: `design-reference/main-multiviewer-direct-matrix-vu-peak.png`
- 正式Windows app: `apps/desktop-windows/IPMultiViewer.csproj`
- runtime smoke: `apps/desktop-windows/runtime-smoke/`
- UI / live meter / AV sync QA: `apps/desktop-windows/qa/`
- 音声meter scale: `packages/desktop-core/Audio/AudioMeterScale.cs`

## 現在の実装範囲

| 領域 | 2026-07-17時点 |
| --- | --- |
| Project / EXE | `apps/desktop-windows/IPMultiViewer.csproj`と`IPMultiViewer.exe`へ単一化。比較用別projectは削除 |
| Main UI | Direct Matrix XAML/theme/tile、2x2/3x3/4x4、viewportを変えないhybrid alert overlay、DECODE / OUTPUT表示を正式採用 |
| 再生・検知・同期 | 正式project内の`MainWindow.xaml.cs`からLibVLC/FFmpeg、検知、直接`HttpClient`経路を使用 |
| 音声 | `AudioMeterScale`によるchannel別VU/PEAK切替、最大16channel、stale非表示を実装 |
| 設定 | 正式保存先は`local-config.json`。より新しいpreview版`local-config.next.json`を起動時に昇格し、移行元原本を保持 |
| ログ | 正式保存先は`desktop.log` |
| Settings / Alert History | 3タブSettings、検索/filter/KPI/詳細pane付きAlert Historyを正式projectから利用 |
| 抽出package | `desktop-core`は音声meter scaleだけを保持。未採用state/playback scaffoldと`desktop-api-client`は削除 |

project・実行ファイル・設定・ログの正式統合は完了しています。実運用の16stream性能、長時間、実カメラ、実Serverの確認は引き続き残ります。

## 調査範囲と証拠

- Desktop: XAML、code-behind、local config、publish、release workflow
- Server/Agent: route、DTO、認証、polling、alert、notification、永続化
- Docs: 画面、運用、設定、server sync、security
- 実行証拠: WPF build、Go test、実WPF smoke、現行EXEの実画面
- 技術比較: WPF、WinUI 3、Avalonia、WPF+WebView2/React、Tauri、Electron

開始前から存在した次の無関係な未コミット変更は保持しました。

- `ip-multiviewer`: `release-server.yml`、Dockerfile、`go.mod`、`go.sum`
- `ip-multiviewer-docs`: CI workflow、`docs/installation/server-and-agent.md`

`release-windows.yml`は単一の正式EXEをstandard/GPU packageへ収録します。

## 現行画面・操作監査

### Step 1: Main監視画面 — 要改善

![現行Main監視画面](/images/ui-modernization/2026-07-14/01-main-window.jpg)

確認済み:

- 3x3、9stream、Start/Stop、layout selector、Settings、Alert History。
- `No signal`、alert type、stream名、status、A/S/R/I、footer log path。
- 起動500ms後にactive layoutを自動再生するため、手動Startだけが起点ではありません。
- layoutは2x2/3x3/4x4の等分gridで、layout外streamは停止・監視対象外になります。

強み:

- dark monitoring surface、明示的な`No signal`、永続的なalert overlayがあり、toastだけに依存していません。
- 色に加えてtypeとmessageを表示しています。
- Start/Stopと現在modeが常時見えます。

主なUXリスク:

- 9 tileすべてが同じ赤で埋まり、severity・継続時間・新規性の優先順位が消えます。
- A/S/R/Iは小さく、略号だけでは操作と結果が分かりにくいです。
- Server dataの最終成功時刻、stale、再接続中が見えません。
- header summaryが1行に密集し、狭い幅では重要値が省略されます。
- 選択tile、詳細panel、操作履歴がなく、監視と対処が同じ面へ詰め込まれています。

### Step 2: tile割当 — 動作するが拡張性が低い

![現行tile割当メニュー](/images/ui-modernization/2026-07-14/05-tile-assignment-base.jpg)

確認済み:

- `Change`の左clickでContextMenuを開きます。
- `Unassigned`とstream名順の候補を表示し、現在割当へcheckを付けます。
- 別tileにあるstreamを選ぶとswapし、即時保存します。

リスク:

- nativeの白いContextMenuがdark UIから視覚的に分断されています。
- search/group/filterがなく、stream数増加時に長いmenuになります。
- drag/dropやright-clickは現行機能ではありません。新UIで追加しても、既存Click経路は残す必要があります。

### Step 3: Settings上部 — 要再構成

![現行Settings上部](/images/ui-modernization/2026-07-14/02-settings-window.jpg)

確認済み:

- stream list、name/protocol/URL/group/tags、profile、Enabled/Analysis/Audio/Mute。
- Import、Export、Reload、Save、Apply stream。
- profile New/Duplicate/Deleteとthreshold編集。

リスク:

- Stream、profile、sync、layout、audioが1つの長いscroll surfaceに混在します。
- `Apply stream`、`Apply profile`、上部`Save`は保存対象が異なり、変更の取りこぼしが起こりやすいです。
- stream/profileのDelete、Reloadは確認なしで即時実行します。
- 左stream listと右formが別scrollになり、keyboard/focus位置を把握しにくいです。
- UI Automation上、stream list itemが実名ではなく型名`IPMultiViewer.Desktop.StreamConfig`として読まれます。

### Step 4: Settings下部 — 状態はあるが鮮度がない

![現行Settings同期・layout・audio](/images/ui-modernization/2026-07-14/06-settings-sync-layout.jpg)

確認済み:

- profileのblack/freeze/FPS/audio threshold。
- Server URL、client token、Server sync、Apply sync。
- Layout、Global mute、Alert sound、client summary。

リスク:

- Server syncは`disabled`または結果textだけで、最終成功時刻、再試行、stale、partial failureを区別しません。
- tokenとstream URLをlocal JSONへ平文保存します。
- `Global mute`はUI上存在しますが、LibVLC playback audioを常時muteするコード経路があり、実音声で現行実効仕様を確定する必要があります。

### Step 5: Alert History未選択 — 要改善

![現行Alert History](/images/ui-modernization/2026-07-14/03-alert-history.jpg)

確認済み:

- severity、status、type、message、startedを表示します。
- 実データは`9 active / 7667 total`でした。
- 未選択時はAcknowledge/Snooze/Resolve/Ignoreをdisabledにします。

リスク:

- stream名/ID列がなく、どの映像へ対処するalertか画面だけでは判別できません。
- 7,667件に対してsearch、filter、pagination、virtualizationの証拠がありません。
- UTC offsetは見えますがtimezone方針、発生からの継続時間、最終更新時刻がありません。
- severity/status/typeの優先順位が弱く、同じ見た目のrowが大量に並びます。

### Step 6: Alert History選択 — 操作可能だが確認がない

![現行Alert History選択](/images/ui-modernization/2026-07-14/04-alert-selected.jpg)

確認済み:

- row選択後、4操作がenabledになります。
- 操作はまずlocal alertを更新し、次回syncで`POST /client-alerts`します。
- Snoozeは時間選択dialogを持たず既定10分です。
- Resolve/Ignoreを含め確認dialogはありません。

リスク:

- 誤操作防止、undo、影響説明、理由記録がありません。
- `Resolve`の青い主操作表現は、異常が復旧したという意味と手動で閉じる意味を混同しやすいです。

## 現行アクセシビリティの証拠と限界

確認できた強み:

- 主要Button、ComboBox、CheckBoxにはUI Automation上の名前があります。
- alertは色だけでなくtype/message/statusを表示します。
- disabled操作はUI Automationでもdisabledとして取得できます。

確認できたリスク:

- stream list itemのaccessible nameが実データではなく型名です。
- A/S/R/Iのtargetが小さく、略号だけです。
- focus indicator、Tab順、modal focus、Narrator読み上げ、高contrast、200% zoomは未確認です。
- alert frameのseverity識別は色への依存が残ります。
- 点滅を抑制する設定は確認できません。

スクリーンショットとUI AutomationだけではWCAG適合を主張しません。

## 現行フロントエンド技術構成

| 項目 | 現行 |
|---|---|
| Runtime | .NET 10、C#、`net10.0-windows` |
| UI | WPF、WinForms interop |
| Playback | LibVLCSharp.WPF + Windows LibVLC、FFmpeg sidecar/D3D11VA、WriteableBitmap |
| UI設計 | XAML 3 Window＋大規模code-behind、MVVMなし |
| 状態管理 | `MainWindow`のfield/dictionary/timerとlocal config object |
| 通信 | 標準`HttpClient`、REST全量poll。WebSocket/SSEなし |
| 永続化 | `local-config.json`へsnake_case JSON、temp→moveでatomic write |
| Server | Go、SQLiteまたはJSON snapshot、Bearer client token |
| Build | `dotnet build/publish`、win-x64 self-contained single-file |
| Test | Go test/build、正式runtime smoke、音声scale self-test、Windows UI / live meter / AV sync QA。一般的なunit frameworkは未導入 |
| Release | standard/GPU各ZIPには正式`IPMultiViewer.exe`、`README-WINDOWS.md`、`VERSION.txt`だけを同梱し、SHA256はreleaseのsidecar assetとして配布。共通Windows gateをPR/releaseへ接続 |

この表は正式統合後の実行経路を示します。別projectによる旧新比較は後述の段階移行記録にだけ残します。

主な根拠:

- `apps/desktop-windows/IPMultiViewer.csproj`
- `MainWindow.xaml.cs:63-228`、`:539-719`、`:2156`、`:4530-4925`
- `SettingsWindow.xaml.cs:11-50`
- `LocalConfig.cs:12-248`
- `apps/desktop-windows/runtime-smoke/Program.cs`
- `apps/desktop-windows/qa/Program.cs`

## 現行構成の問題点

1. **責務集中**: `MainWindow.xaml.cs` 7,000行超へUI、再生、API、検知、音声、保存が同居。
2. **動的UI生成**: VideoTileをXAML templateではなくコードから生成し、差分変更とtestが難しい。
3. **Window間直接参照**: Settings/HistoryがownerのMainWindow methodを直接呼びます。
4. **状態の混在**: Server state、realtime state、UI state、永続化stateが分離されていません。
5. **通信鮮度不足**: polling失敗中も旧dataを現在値のように表示します。
6. **契約差**: Server DTOとDesktop local-only fieldが一致しません。
7. **design system不在**: Windowごとに色/styleが重複し、共有token/componentがありません。
8. **accessibility基盤不足**: automation name、focus、high contrast、localizationの体系がありません。
9. **回帰範囲不足**: Windows composite gateはPR/releaseへ接続済みですが、全alert state、実Server、実カメラ、長時間は未収録。
10. **運用上の破壊操作**: Delete/Reload/Resolve/Ignoreに確認・undoがありません。

## コードと既存docsの差異

| 項目 | コードで確認した挙動 | docsとの差 |
|---|---|---|
| 起動 | 500ms後に自動Start | docsは日常手順で手動Startを案内 |
| layout | 等分2x2/3x3/4x4。spanは描画未使用 | docsはtileサイズ調整を案内 |
| Group/Tags | 保存・編集のみ | docsは検索・整理用途を示唆 |
| Alert profile | threshold CRUDのみ | docsはtype選択、通知先、test通知を案内 |
| Global mute | LibVLC経路は常時muteのコード | docsは全stream再生音muteとして説明 |
| Alert History | stream列なし | docsは対象stream確認を案内 |
| Save | stream/profileは個別Apply必須 | docsは変更をSaveと広く説明 |
| Server permission | client tokenのみ、account/roleなし | docsは「アカウント」を準備と記載 |

差異は新UI側の都合でどちらかへ寄せません。まず現行実効挙動を互換基準としてtestへ固定し、docs誤記は別変更で解消します。

## 技術候補比較

| 候補 | 既存再生資産 | 16 tile・低遅延 | 型/test/design system | 段階移行・rollback | 結論 |
|---|---|---|---|---|---|
| **WPF継続** | 非常に高い | 現行baselineを維持しやすい | MVVM/ResourceDictionaryで改善可能 | 非常に高い | **採用** |
| WinUI 3 | WinFormsHost/WriteableBitmapを再実装 | 4x4 presenterを要実測 | 新しいWindows UI資産 | 中 | 将来候補 |
| Avalonia | LibVLC packageあり、FFmpeg経路は移植 | native interopを要再測定 | test資産は良好 | 中 | cross-platform必須時 |
| WPF + WebView2/React | 非動画画面だけ再利用しやすい | video/native bridgeと二重stateが課題 | Web test資産は豊富 | 中～高 | 限定実験のみ |
| Tauri | C#/WPF再生資産を直接再利用しにくい | sidecar/bridge再設計 | Rust/JS/C#境界が増える | 低 | 不採用 |
| Electron | C#表示面を再利用できない | Chromium/Node/IPC負荷 | Web資産は豊富 | 低 | 不採用 |

選定根拠:

- WPFは.NET 10でもWindows desktop、XAML、binding、style/template、hardware accelerationを提供します。[WPF overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/overview/)、[WPF .NET 10](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/whats-new/net100/)
- WinUI 3移行ではTrigger、MultiBinding、window lifecycle等に差があります。[WPF to WinUI 3](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/migrate-to-windows-app-sdk/wpf-patterns-winui3)
- `SwapChainPanel`は同時更新swap chainを4個以下にする公式推奨があり、4x4の各tileへ単純適用できません。[SwapChainPanel](https://learn.microsoft.com/en-us/windows/windows-app-sdk/api/winrt/microsoft.ui.xaml.controls.swapchainpanel?view=windows-app-sdk-1.8)
- AvaloniaにはWPF移行とheadless testの公式guideがありますが、Windows-only製品では移植利益が小さいです。[Avalonia WPF migration](https://docs.avaloniaui.net/docs/migration/wpf)、[Avalonia testing](https://docs.avaloniaui.net/docs/testing/)
- WebView2は非動画画面の段階移行には使えますが、runtime配布とnative/web通信境界が増えます。[WebView2 WPF](https://learn.microsoft.com/en-us/microsoft-edge/webview2/platforms/wpf)、[Native/web communication](https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/communicate-btwn-web-native)
- Tauri/Electronはprocess・sidecar・IPCを追加します。[Tauri process model](https://v2.tauri.app/concept/process-model/)、[Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model)

## 現行採用構成と今後の判断

| 領域 | 推奨 |
|---|---|
| Runtime/UI | .NET 10、C#、WPF |
| Architecture | 現行code-behindを維持。実行経路へ採用する作業とtestを伴う場合だけservice境界を追加 |
| Design system | `ResourceDictionary`のtoken、ControlTemplate、VideoTile/VideoGrid/Status/Alarm component |
| State | 現行`MainWindow` stateを使用。未採用だった抽象scaffoldは保持しない |
| REST | 現行の直接`HttpClient`経路を使用。未採用typed client scaffoldは保持しない |
| Realtime | 現行15秒REST pollを維持し、backoff/freshness/reconciliationをclient側へ追加 |
| Playback | 正式project内のLibVLC/FFmpeg経路を使用。未採用playback abstractionは保持しない |
| Persistence | `local-config.json`へのatomic write、preview config昇格、backup/export |
| Test | `apps/desktop-windows/runtime-smoke`、`apps/desktop-windows/qa`、音声scale self-test、visual/performance/soak |
| Packaging | `IPMultiViewer-<version>-windows-x64[-gpu].zip`の直下へ正式`IPMultiViewer.exe`を配置 |

正式統合後のdesktop境界:

```text
apps/
  desktop-windows/
    IPMultiViewer.csproj
    runtime-smoke/
    qa/
packages/
  desktop-core/
    Audio/AudioMeterScale.cs
    self-test/
```

比較移行中に作成した別WPF project、typed API client、未採用state/playback scaffoldは2026-07-17に削除しました。音声meter scaleだけは正式UIから実利用しているため`packages/desktop-core`へ残します。

最終目標では責務を次のように分離します。

```text
REST response -> Contract DTO -> domain mapper -> ServerSnapshot
                                             -> alert/playback policy
poll result   -> freshness coordinator       -> UI state
user action   -> ViewModel command -> use case -> playback/config/API adapter
```

この図は将来の検討材料であり、現在のsource treeに未採用scaffoldとして先置きしません。現時点で分離済みかつ正式UIから利用する境界は`AudioMeterScale`です。

## 段階移行・正式統合の記録

### Phase 0: baseline固定

**状態: 比較移行時に実施。** 旧実装buildとreal-window smokeを比較baselineとして保存しました。16stream性能、長時間、実カメラbaselineは未完了です。

- 現行EXE、standard/GPU package、config sample、API response、screen、performanceを保存。
- 互換性マトリクスの未調査項目を実機証拠で埋める。
- 正式runtime smokeをCI必須gateへ接続する。

### Phase 1: 境界抽出

**状態: 評価完了。** 比較中にstate/playback/config/API abstractionを試作しましたが、正式実行経路が採用したのは音声scaleだけでした。2026-07-17に未採用scaffoldを削除しました。

- 見た目を変えず、REST client、DTO mapper、persistence、playback interfaceを抽出。
- legacyのgolden behavior testを先に追加する。
- API routeとJSON fieldは変更しない。

### Phase 2: 新WPF shellとdesign system

**状態: 比較projectで実装後、正式projectへ統合済み。** 比較用WPF shell、ResourceDictionary、window chrome、command bar、Direct Matrix tileを作り、2026-07-17に`apps/desktop-windows`へ正式統合しました。

- 別EXE`IPMultiViewer.Next`を作成。
- token、typography、spacing、focus、severity、motion原則を定義。
- PoCはlegacy configのcopyを読込み、原本へ書き戻さない。

### Phase 3: Main Multiviewer PoC

**状態: 限定実装・限定QA済み。** 2x2/3x3/4x4、既存の再生・割当・alert経路、チャンネル別VU/PEAK、適応FFmpeg表示解像度、DECODE / OUTPUT表示を接続しました。4本×4channelのlive SRT fixtureと16channelのfitをQA対象にしています。16stream performanceと2時間soakは未完了です。

- 2x2を最初に通し、同じcomponentで3x3/4x4へ拡張。
- Start/Stop、layout、tile割当、placeholder、audio meter、viewport/sessionを変えないalert overlay、poll freshnessを実装。SRT/FFmpegはタイル内描画、LibVLCだけactive時のowned Windowを使う。
- 正式UIのFFmpeg表示はreceiver開始時に、2x2=`960x540`、3x3=`640x360`、4x4=`480x270`を基準としてDPI込みviewportに応じた上位tierも選び、bicubic scaleとaspect比維持のpadを適用。再生中layout切替ではSRT sessionを維持し、次回開始時に新tierを使う。
- GPU activeはFFmpeg runtime evidenceとframe提示が揃ったsessionだけに限定し、`REQUESTED`/`UNKNOWN`とWPF outputを別表示。
- 4/9/16streamと2時間soakをlegacyと比較する。

### Phase 4: Alert History、Settings移行

**状態: 正式統合済み。** Settingsは3タブ、Alert HistoryはKPI、検索、status/severity filter、stream列、詳細paneへ再編し、正式projectから直接利用します。

- Alert Historyはstream識別、180ms検索debounce、最大500行、Recycling virtualizationを追加し、状態遷移結果を維持。
- SettingsはStreams / Alert profiles / Sync and audioへ分割し、既存control名とApply/Save対象を維持。
- Import/Export/Reload/Deleteはpreview、backup、confirmを追加する。

### Phase 5: release/pilot

**状態: 単一projectへの正式統合、package、CIまで実装済み。** standard/GPUの各ZIPは直下の`IPMultiViewer.exe`だけを実行対象として配布し、共通Windows検証scriptをPR CIとrelease gateから実行します。

- packageへ現行`IPMultiViewer.exe`、`README-WINDOWS.md`、`VERSION.txt`を同梱。
- standardは`IPMultiViewer-<version>-windows-x64.zip`、GPUは`IPMultiViewer-<version>-windows-x64-gpu.zip`として公開。
- 正式保存先は`local-config.json`と`desktop.log`。より新しい`local-config.next.json`は起動時に正式configへ昇格し、preview原本を保持。
- rollback drillはbackup済みの直前version packageへ戻す手順で実施。

### Phase 6: 比較project廃止

**状態: 2026-07-17完了。** Legacy/Next別projectを削除し、`apps/desktop-windows/IPMultiViewer.csproj`へ正式UIを統合しました。

比較結果とQA contractは単一project配下のruntime smoke / UI QAへ引き継ぎます。8時間soak、現場受入れ、version rollback drillは別のrelease gateとして継続します。

## PoC対象: Main Multiviewer

PoCに含めるもの:

- 2x2/3x3/4x4、4/9/16 tile
- auto start、Start/Stop
- tile assign/unassign/swap
- LibVLC/FFmpegの既存2再生経路
- loading/no-signal/stopped/reconnecting/stale/error
- audio meter、alert sound state
- alert overlayとAcknowledge/Snooze/Resolve/Ignore
- REST poll、last-success、freshness、全量reconcile
- config copy読込とsession/resource解放

PoCに含めないもの:

- Server API変更
- WebSocket追加
- notification channel UI
- legacy config原本への書込み
- legacy EXEの削除

## 旧UIと新UIの比較方法

### 1. 同一fixture

- 同一PC、同一GPU driver、同一standard/GPU mode。
- 同一config copy、同一4/9/16 input、同一Server fixture、同一network condition。
- legacyとnextは同時実行せず順番に測定し、resource競合を避けます。

### 2. 行動互換

機能マトリクスの各IDをE2E scenario化し、user action、API request、local JSON差分、playback/alert stateを比較します。API method/path/header/bodyとDTO fieldはgolden contractへ正規化し、timestamp/request ID以外の差分を失敗にします。

### 3. visual比較

- 同じwindow size、DPI、data、stateでlegacy/nextをcapture。
- 参照画像と新UI画像を同じ比較inputに並べ、crop、padding、文字切れ、overlay、focus、状態欠落を判定。
- pixel一致は要求せず、情報・状態・操作の欠落ゼロを必須にします。
- normal、loading、empty、API error、poll disconnect/reconnect、alert open/resolved、long name、4x4、dialog、focusを保存します。

### 4. performance比較

| 指標 | 初期合格案 |
|---|---|
| presented FPS | legacy比5%以内の低下 |
| p95 frame age/render delay | legacy比10%以内の悪化 |
| 4x4操作応答p95 | 100ms未満 |
| warm-up後2時間RAM増加 | 5%未満 |
| layout反復後の孤児session/process/handle | 0 |
| first frame | legacy baseline確定後に閾値固定 |
| 8時間soak | crash、deadlock、継続memory増加なし |

CPU、GPU、RAM、GC、handle、FFmpeg/LibVLC process数、read/presented FPS、dropped/coalesced frame、frame ageを同時記録します。

### 5. accessibility比較

- keyboard-onlyで全主要操作へ到達。
- 明確なfocus、logical Tab順、Esc/close、accessible name、live state通知。
- 200% DPI、高contrast、Narrator、色覚に依存しないstatus。
- 動き・点滅を抑制可能。

### 6. rollback gate

preview版の`local-config.next.json`が正式configより新しい、または正式configがない場合、起動時に内容を`local-config.json`へ昇格します。preview原本はbyte単位で保持し、以後の通常保存は正式configだけを書き換えます。packageの切り戻しは現行アプリを終了し、backup済みの直前version packageを別folderから起動する手順です。自動QAはpreview昇格と原本不変を確認済みですが、現場端末でのversion rollback drillは未完了です。

## 実行済み検証

```text
./scripts/verify-windows.ps1
  -> go test ./... / go build ./... 成功
  -> apps/desktop-windows/IPMultiViewer.csproj build成功
  -> desktop_core_self_test_ok（AudioMeterScale）
  -> apps/desktop-windows/runtime-smoke 成功
  -> windows_ui_qa_ok live_meter=enabled
  -> windows_av_sync_ok
  -> windows_verification_ok
```

2026-07-15〜16の比較段階ではLegacy/Next両publishとvisual comparisonを実施しました。そのcontractを引き継いだ正式Windows UI QAは、同じ1642x958 viewportで次を確認します。

- 4本のlive SRT test stream × 4channel、全16meterの時間変化
- 同一PTSの白flash/audio pulseを使った表示同期。立ち上がり4回・下降4回の計8edgeで、最終全Windows検証のvideoとmeterの差は中央値80.7ms、最大100.4ms
- VU/PEAKで実channel ratio、目盛り、marker、選択状態、persistが変わること
- 2x2/3x3/4x4のtile数とlayout更新
- receiver開始時のlayout/viewport別FFmpeg表示解像度と、bicubic・aspect比維持filter
- 16channelを左右8本ずつに分け、4x4相当幅でもvideo領域を35%以上残すこと
- alertの解消・再openでもvideo surface寸法と再生sessionが安定すること。SRT/FFmpegではtop-level overlayを作らず、LibVLCのowned overlayはMainWindow非active・最小化・alert解消時に非表示となり、他アプリのforegroundを変更しないこと
- 黒フレーム継続中の即時callbackを立上がり1回へ抑え、非黒frame後の再検知だけを新しい通知として扱うこと
- terminal履歴を1,000件へ保持し、config file lock中でもQueueSave呼出しがUI threadをblockしないこと
- DECODE / OUTPUTが`REQUESTED`/`UNKNOWN`をGPU activeとして扱わず、WPF出力解像度を明示すること
- preview config昇格後も`local-config.next.json`がbyte単位で不変であり、正式保存先が`local-config.json`になること

`scripts/verify-windows.ps1`は、ローカル確認用に`artifacts/windows-qa/ip-multiviewer-ui-vu.png`と派生captureを一時生成し、成功時に`windows_ui_qa_ok`と`windows_av_sync_ok`を出力します。画像とpublish dry-runは再生成可能な検証物としてsource treeへ保存せず、`scripts/clean-generated.ps1`の通常実行で削除します。

この検証は決定的なtest fixtureによる限定証拠です。runtime smokeや合成16channel fitは、実運用の16 stream性能、8時間soak、実カメラ、実Serverを証明しません。

## 残存リスク・未確認

- 実カメラ・実運用protocolでの映像と再生音声
- 16 stream、4K、高DPI、複数monitor、8時間soak
- 実Serverでの401/403、停止、復旧、stale
- Import/Export OS dialogのkeyboard/cancel/overwrite
- 複数端末からの同時編集、clock skew、poll順序逆転
- 外部clientによる34 REST route利用
- Server snapshot破損、disk full、SQLite lock
- リポジトリ外のWS/SSE gateway

これらは対応不要ではなく、[互換性マトリクス](./functional-parity-matrix.md)の未調査項目として管理します。
