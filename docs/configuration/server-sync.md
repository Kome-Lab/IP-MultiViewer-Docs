# サーバー同期

サーバー同期は、複数の Windows 端末で同じ設定を使いたい場合に使います。1 台だけで使う場合は、最初から有効にする必要はありません。

## 使う場面

- 複数の監視端末で同じ映像一覧を使いたい
- レイアウトやアラート設定を共有したい
- 担当者ごとに同じ設定を配りたい
- 端末を入れ替えても設定を引き継ぎたい

## 始める前に

- 同期先サーバーにアクセスできる
- サーバーの URL が分かる
- 認証が必要な場合はアカウントを用意している
- 映像 URL や Webhook URL の扱い方を決めている

## 手順

1. Server を起動します。
2. Desktop の Settings を開きます。
3. Server URL を入力します。
4. Client Token を入力します。
5. Server sync を有効にします。
6. Apply を押します。
7. `server sync: ok` が表示されるか確認します。
8. 別端末でも同じ stream / layout / alert profile が見えるか確認します。

同期を使う場合でも、映像 URL や Webhook URL は秘密情報として扱ってください。

## 同期されるもの

- streams
- layouts
- alert profiles
- alerts
- client heartbeat

Desktop は local alert をServerへ送り、その後Server側のalertを取得します。同じalert IDは更新時刻が新しい方を採用します。

## Server / Agentのenv

ServerとAgentのenv一覧は [設定ファイルとenvリファレンス](/reference/config-and-env) にまとめています。
