# ServerとAgentの問題

Server sync や Agent probe が動かない場合の確認手順です。

## Serverにつながらない

1. Server が起動しているか確認します。
2. `MULTIVIEWER_PUBLIC_URL` が正しいか確認します。
3. Desktop から URL に接続できるか確認します。
4. client token が一致しているか確認します。
5. HTTPS や firewall の設定を確認します。

## Agentがonlineにならない

1. Agent の `MULTIVIEWER_SERVER_URL` を確認します。
2. `MULTIVIEWER_AGENT_CLIENT_ID` が重複していないか確認します。
3. Agent 用 token が Server 側に登録されているか確認します。
4. probe interval と timeout が短すぎないか確認します。
5. Server 側で heartbeat が届いているか確認します。

## 同期されない

- Desktop 側で sync が有効か確認します。
- Server 側の認証設定を確認します。
- 変更後に保存されているか確認します。
- 複数端末で同じ設定を上書きしていないか確認します。

ログを共有するときは、stream URL、client token、Webhook URL を隠してください。
