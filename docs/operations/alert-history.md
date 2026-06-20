# Alert履歴

Alert 履歴では、過去に起きた映像停止、黒画面、無音、通知結果などを確認します。日常監視では、現在の画面だけでなく履歴も見ると原因を追いやすくなります。

## 状態の意味

| 状態 | 意味 |
| --- | --- |
| open | 未対応または継続中 |
| acknowledged | 確認済み |
| snoozed | 一時停止中 |
| resolved | 解決済み |
| ignored | 対応不要として終了 |

## 確認手順

1. Alert History を開きます。
2. open の alert を優先して確認します。
3. 対象 stream と alert type を見ます。
4. 必要なら acknowledged にします。
5. 一時的な問題なら snooze を使います。
6. 復旧後に resolved にします。

## Server同期時

Server sync を使う場合、Desktop は local unsynced alert を upload し、その後 Server 側の alert を pull します。同じ alert ID は `updated_at` が新しい方を採用します。

## 運用のコツ

同じ stream で別 type の alert が出ることがあります。例えば `video.decode_error` と `audio.silence` は別問題として扱い、片方だけで全体を解決済みにしないでください。
