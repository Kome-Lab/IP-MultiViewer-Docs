# ServerとAgentを使う

IP MultiViewer は Desktop App 単体で使えます。Server と Agent は、設定同期や通知集約、headless 監視が必要な場合だけ追加します。

## Serverの役割

- 設定同期
- alert 集約
- 通知送信
- client heartbeat
- 複数端末の状態共有

## Agentの役割

- Desktop を開いていない環境での reachability probe
- 定期的な stream URL 確認
- Server への状態送信

## envで設定するもの

| 項目 | 目的 |
| --- | --- |
| `MULTIVIEWER_BIND_ADDR` | Server の待ち受け |
| `MULTIVIEWER_DATA_DIR` | JSON snapshot 保存先 |
| `DATABASE_URL` | SQLite 保存先 |
| `MULTIVIEWER_CLIENT_TOKEN` | 単一 token 運用 |
| `MULTIVIEWER_CLIENT_TOKENS` | clientごとの token 運用 |
| `MULTIVIEWER_CLIENT_OFFLINE_AFTER_SEC` | heartbeat offline 判定 |
| `MULTIVIEWER_SECRET_ENCRYPTION_KEY` | secret 暗号化 |
| `MULTIVIEWER_SERVER_URL` | Agent が接続する Server URL |
| `MULTIVIEWER_AGENT_CLIENT_ID` | Agent の識別子 |
| `MULTIVIEWER_AGENT_INTERVAL_SEC` | Agent の確認間隔 |

## 導入手順

1. Server を動かす host を用意します。
2. env ファイルを作ります。
3. Server を起動します。
4. Desktop から Server URL と client token を設定します。
5. 同期テストを行います。
6. Agent を使う場合は Agent 用 client ID と token を用意します。
7. Agent を起動し、Server 側で heartbeat を確認します。

## 注意

client token、stream URL、Webhook URL は公開しないでください。Server を公開する場合は HTTPS を使い、不要な port を閉じます。

詳しいenv一覧は [設定ファイルとenvリファレンス](/reference/config-and-env) を確認してください。
