# 設定ファイルとenvリファレンス

このページは、IP MultiViewer の設定保存場所、Desktop設定項目、Server / Agent のenvをまとめたリファレンスです。通常の操作手順は [Settings画面の使い方](/app/settings-window) を先に読んでください。

## Desktopの設定・ログ保存場所

正式Windows appは設定とログを次の1組へ保存します。

| 種類 | path |
| --- | --- |
| local config | `C:\ProgramData\IPMultiViewer\config\local-config.json` |
| desktop log | `C:\ProgramData\IPMultiViewer\logs\desktop.log` |

preview版の移行元として、同じconfig directoryに`local-config.next.json`が残っている場合があります。preview configが正式configより新しい、または正式configがまだない場合、起動時にpreview内容を読み込み、`local-config.json`へ昇格します。移行元の`local-config.next.json`は変更・削除しません。以後の通常保存は`local-config.json`だけを更新します。

configには、stream URL、server URL、client token、alert履歴が含まれることがあります。外部に渡す前に実値を消してください。

Desktopはconfig保存をcoalescing付きbackground writerへ渡し、映像描画のUI threadでfile置換を待たないようにします。alert履歴は`open` / `acknowledged` / `snoozed`を全件保持し、`resolved` / `ignored`は更新時刻が新しい1,000件をconfigへ保持します。既存configがこの上限を超える初回読込時は、整理前の全configを同じdirectoryへ次の名前で1回だけcopyします。

```text
local-config.history-before-retention.json
```

この退避fileにもcredentialやtokenが含まれる可能性があります。不要になったかを確認するまでは削除せず、config本体と同じアクセス制御で保管してください。

### 保存先をenvで変える

| env | 用途 |
| --- | --- |
| `IPMV_DATA_DIR` / `IPMULTIVIEWER_DATA_DIR` | `config`と`logs`の親directory |
| `IPMV_CONFIG_DIR` / `IPMULTIVIEWER_CONFIG_DIR` | config directoryだけを上書き |
| `IPMV_LOG_DIR` / `IPMULTIVIEWER_LOG_DIR` | log directoryだけを上書き |

envを指定した場合も、正式configは`local-config.json`、logは`desktop.log`です。preview移行元の探索も指定後のconfig directory内で行います。

## local configの主な項目

| 項目 | 内容 |
| --- | --- |
| `streams` | 映像ソース一覧 |
| `layouts` | 2x2 / 3x3 / 4x4 などのタイル割り当て |
| `alert_profiles` | 黒画面、フリーズ、無音などの閾値 |
| `alert_history` | local alert履歴。activeは全件、terminalは新しい1,000件を保持 |
| `active_layout_id` | 現在選択中のlayout |
| `global_mute` | 全体mute |
| `alert_sound_enabled` | alert音の有効/無効 |
| `server_sync_enabled` | Server syncの有効/無効 |
| `client_id` | Serverから見えるDesktop識別子 |
| `client_name` | 端末名 |
| `client_token` | Server接続token |
| `server_url` | Server sync先URL |
| `audio_meter_mode` | メーター表示。`vu`または`peak`。不明値は`vu`に正規化 |

Import / Export でこの設定を移動できます。複数端末で共有する場合は、credentialを含むURLやtokenの扱いを先に決めてください。

## stream設定

| 項目 | 内容 |
| --- | --- |
| `id` | stream識別子 |
| `name` | 表示名 |
| `enabled` | Start対象にするか |
| `input_url` | 映像URL |
| `input_protocol` | protocol |
| `group` | 拠点や用途の分類 |
| `tags` | 任意ラベル |
| `audio_monitor_enabled` | 音声監視 |
| `analysis_enabled` | 映像解析 |
| `alert_muted` | stream単位のalert音mute |
| `alert_profile_id` | 閾値profile |

## alert profile設定

| 項目 | 既定値の目安 | 内容 |
| --- | --- | --- |
| `black_threshold` | `0.04` | 平均輝度の黒判定 |
| `black_pixel_threshold` | `0.04` | 暗いpixelの判定 |
| `black_pixel_ratio_threshold` | `0.85` | 暗いpixelの割合 |
| `min_black_duration_sec` | `0` | 互換用。Desktopは黒味を初回検知でalertし、この値は0として扱います |
| `freeze_difference_threshold` | `0.015` | フレーム差分の停止判定 |
| `min_freeze_duration_sec` | `5` | freeze alertまでの秒数 |
| `min_freeze_frames` | `30` | freeze候補フレーム数 |
| `input_timeout_sec` | `5` | 入力停止判定 |
| `low_fps_threshold` | `15` | 低FPS判定 |
| `min_low_fps_duration_sec` | `5` | 低FPSalertまでの秒数 |
| `silence_threshold_db` | `-50` | 無音判定 |
| `min_silence_duration_sec` | `5` | 無音alertまでの秒数 |
| `clipping_threshold_db` | `-1` | クリッピング判定 |
| `clipping_count_threshold` | `10` | クリッピング候補数 |

## Server env

| env | 必須 | 内容 |
| --- | --- | --- |
| `MULTIVIEWER_BIND_ADDR` | 任意 | Serverの待ち受け。未指定時は `127.0.0.1:8080` |
| `MULTIVIEWER_DATA_DIR` | 任意 | JSON snapshot保存先。指定時は `server-state.json` を使います |
| `DATABASE_URL` | 任意 | `sqlite:///...` のSQLite保存先 |
| `MULTIVIEWER_CLIENT_TOKEN` | 任意 | 単一の共有client token |
| `MULTIVIEWER_CLIENT_TOKENS` | 任意 | `client-id:token` 形式の複数client token |
| `MULTIVIEWER_CLIENT_OFFLINE_AFTER_SEC` | 任意 | heartbeatが古いclientをofflineにする秒数 |
| `MULTIVIEWER_SECRET_ENCRYPTION_KEY` | 通知先を使う場合は必要 | Webhook URLなどの通知secretを暗号化する32byte key |

Serverは、重い映像変換や録画を担当しません。設定同期、alert集約、通知、client heartbeatを扱う軽量サービスです。

## Agent env

| env | 必須 | 内容 |
| --- | --- | --- |
| `MULTIVIEWER_SERVER_URL` | 必須 | Server URL |
| `MULTIVIEWER_AGENT_CLIENT_ID` | 任意 | Agentのclient ID。未指定時はhost名から作成 |
| `MULTIVIEWER_AGENT_NAME` | 任意 | Server上に表示する名前 |
| `MULTIVIEWER_CLIENT_TOKEN` | Serverがtokenを要求する場合は必要 | Server接続token |
| `MULTIVIEWER_AGENT_INTERVAL_SEC` | 任意 | probe間隔。既定は30秒 |
| `MULTIVIEWER_AGENT_PROBE_TIMEOUT_SEC` | 任意 | probe timeout。既定は5秒 |
| `MULTIVIEWER_AGENT_RUN_ONCE` | 任意 | 1回だけ実行して終了 |
| `MULTIVIEWER_AGENT_DISABLE_PROBING` | 任意 | stream probeを行わずheartbeatだけ送る |
| `MULTIVIEWER_AGENT_DISABLE_AUTO_RESOLVE` | 任意 | probe復旧時の自動resolveを無効化 |

Agentは映像を表示しません。Serverに登録し、stream URLの簡易疎通確認とheartbeatを送ります。

## 通知secret

通知channelでWebhook URLを保存するには、Server側に `MULTIVIEWER_SECRET_ENCRYPTION_KEY` が必要です。未設定の場合、通知先URLを安全に保存できないため、通知channel作成や更新が失敗します。

公開ドキュメント、Issue、PR、ログ、スクリーンショットには、実token、実Webhook URL、実カメラURLを書かないでください。
