# Alert履歴

Alert 履歴では、過去に起きた映像停止、黒画面、無音、通知結果などを確認します。日常監視では、現在の画面だけでなく履歴も見ると原因を追いやすくなります。

画面上部にはactive / open / acknowledged / snoozed / totalの件数を表示します。中央の一覧にはstream、type、message、severity、status、時刻が並び、選択したalertの詳細と操作は右側paneで確認できます。

## 検索とfilter

- Searchはstream ID、type、message、status、severity、alert IDを横断検索します。
- StatusとSeverityは組み合わせて絞り込めます。
- Clear filtersで検索とfilterをまとめて解除します。
- 大量履歴でも画面を固めないため、一覧は一致結果の新しい500件までをvirtualizeして表示します。上部KPIとtotal件数は保持対象全体を集計します。

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

local configでは、open / acknowledged / snoozedをすべて保持し、resolved / ignoredは新しい1,000件を保持します。既存configが上限を超えていた場合は、初回整理前のconfigを同じdirectoryの`*.history-before-retention.json`へ1回だけ退避します。このbackupにもstream URLやtokenが含まれる可能性があるため、安全に管理してください。

## Server同期時

Server sync を使う場合、Desktop は local unsynced alert を upload し、その後 Server 側の alert を pull します。同じ alert ID は `updated_at` が新しい方を採用します。

## 運用のコツ

同じ stream で別 type の alert が出ることがあります。例えば `video.decode_error` と `audio.silence` は別問題として扱い、片方だけで全体を解決済みにしないでください。
