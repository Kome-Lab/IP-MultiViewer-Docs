# メイン画面の使い方

メイン画面は、映像を見るための常用画面です。設定作業は Settings、過去の異常確認は Alert History に分け、メイン画面では映像、状態、アラートをすぐ見られることを優先します。

## 上部バー

| 項目 | 使い方 |
| --- | --- |
| Layout | `Default 2x2`、`Default 3x3`、`Default 4x4` などの表示レイアウトを切り替えます |
| Start | 現在のレイアウトに割り当てられた有効な映像を再生します |
| Stop | 再生中の映像を停止します |
| Alert History | 過去と現在のalertを一覧で確認します |
| Settings | 映像、閾値、同期、音声、レイアウトを設定します |
| Mode表示 | Standalone local mode か Server sync 中かを表示します |
| Playback summary | active、loaded、layout streams、errors の概要を表示します |

Start は、現在選んでいるレイアウトに入っている stream だけを対象にします。登録済みでもレイアウトに割り当てていない stream は、そのレイアウトでは再生されません。

## タイルの表示

各タイルには、次の情報が表示されます。

| 表示 | 意味 |
| --- | --- |
| stream名 | Settings の `Name` |
| status badge | standby、starting、playing、error など |
| alert overlay | open / acknowledged / snoozed のalertを上部に表示 |
| status frame | severity に応じて黄色または赤系で表示 |
| placeholder | stream未割り当て、停止中、再生不可の理由 |

未再生のタイルは正常映像ではなく、standby や playback stopped として扱います。手動Stop直後や起動直後の未再生状態だけで `video.no_signal` を出さないためです。

## タイルの割り当て

タイル上の Assign / Change から、その場所に表示する stream を選びます。

1. Settings で stream を登録します。
2. メイン画面に戻ります。
3. 変更したいタイルの Assign / Change を押します。
4. stream を選びます。
5. 必要なら Layout を切り替えて、2x2 / 3x3 / 4x4 それぞれの割り当てを調整します。

新しい stream を追加すると、空いているタイルがあれば自動で割り当てられます。見せたい順番がある場合は、あとから手動で入れ替えてください。

## Start前に確認すること

- URL に `<PASSWORD>` や `<PASSPHRASE>` のようなplaceholderが残っていない
- stream が `Enabled` になっている
- 現在のLayoutに対象streamが割り当てられている
- Windows PC からカメラや配信元に到達できる
- SRTを使う場合、FFmpegが利用できる

再生できないstreamは、タイル上に理由が表示されます。URLがmasked表示のまま、placeholderのまま、またはURL形式が不正な場合は再生対象になりません。

## Stopの扱い

Stopは、再生処理と解析monitorを止めます。Stopしただけでは異常復旧とは限らないため、未対応のalertがある場合は Alert History で状態を確認してください。

## Alert overlayの操作

タイル上のalertには、次の操作があります。

| 操作 | 用途 |
| --- | --- |
| acknowledge | 見たことを記録します |
| snooze | 一時的に通知や強調を止めます |
| resolve | 復旧したものとして閉じます |
| ignore | 対応不要として閉じます |

同じstreamでも、`video.black` と `audio.silence` は別のalertです。映像が復旧しても音声の問題が残っている場合は、別々に確認してください。

## Footerとログ

画面下部には、保存、同期、エラーなどの短いメッセージとログ保存先が表示されます。Desktopのログは次の場所に保存されます。

```text
C:\ProgramData\IPMultiViewer\logs\desktop.log
```

ログを共有する場合は、映像URL、認証情報、Webhook URL、client tokenが含まれていないか確認してください。アプリ側はURLをmaskしますが、外部ツールのログや手動メモには実値が残ることがあります。

## 日常確認の順番

1. Layout が目的のものになっているか確認します。
2. Start を押します。
3. Playback summary の errors が増えていないか見ます。
4. 各タイルに黒画面、停止、無音がないか見ます。
5. alert overlay が出たら、対象streamとtypeを確認します。
6. 必要に応じて Alert History で過去履歴を確認します。
7. 作業後に Stop するか、監視を継続します。

## 次に読むページ

- [Settings画面の使い方](/app/settings-window)
- [再生と検知機能](/app/playback-and-analysis)
- [Alert履歴](/operations/alert-history)
