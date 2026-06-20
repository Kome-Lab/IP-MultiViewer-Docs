# 構成要素

IP MultiViewer は Windows Desktop App を中心に、必要に応じて Server と Agent を組み合わせます。最初は Desktop 単体で使い、複数端末や通知集約が必要になったら Server / Agent を追加します。

## 役割

| 要素 | 役割 |
| --- | --- |
| Desktop App | 映像表示、レイアウト、アラート表示、日常確認 |
| Server | 設定同期、alert 集約、通知、client heartbeat |
| Agent | headless reachability probe、簡易監視 |
| Contracts | API や alert の形式 |

## 最初のおすすめ構成

1. Desktop App を 1 台に入れます。
2. 1 つの映像を追加します。
3. レイアウトと音声を確認します。
4. アラート条件をゆるめに設定します。
5. 必要になったら Server と Agent を追加します。

## Server / Agentを追加する場面

- 複数 PC で同じ映像一覧を使いたい
- 通知履歴をまとめたい
- Desktop を開いていない時間も疎通確認したい
- 複数拠点の状態をまとめて見たい

Server は大量の映像変換や録画を担当するものではありません。重い media 処理は Desktop 側の表示や外部機器側の責務として考えてください。
