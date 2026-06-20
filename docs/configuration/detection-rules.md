# 検知ルール

IP MultiViewer は、映像や音声の状態から alert を出します。最初は厳しすぎない条件で始め、実際の映像に合わせて調整してください。

## 主なalert

| 種類 | 意味 |
| --- | --- |
| `video.no_signal` | 映像信号がない |
| `video.decode_error` | 映像の decode に失敗 |
| `video.black` | 黒画面が続いている |
| `video.freeze` | 画面変化が止まっている |
| `video.low_fps` | FPS が低い |
| `audio.silence` | 無音が続いている |
| `audio.clipping` | 音割れの可能性 |

## 調整する値

| 項目 | 何を変えるか |
| --- | --- |
| Black luma / Dark pixel | どれくらい暗いと黒画面候補にするか |
| Black duration sec | 黒画面候補が何秒続いたらalertにするか |
| Freeze diff / Freeze frames | どれくらい画面変化が少ないとフリーズ候補にするか |
| Freeze duration sec | フリーズ候補が何秒続いたらalertにするか |
| Input timeout sec | 入力停止を疑うまでの秒数 |
| Low FPS threshold / duration | FPS低下の値と継続秒数 |
| Silence dBFS / duration | 無音と見る音量と継続秒数 |
| Clipping count | 音割れ候補の数 |

## 設定手順

1. 重要な映像から profile を作ります。
2. 黒画面、フリーズ、無音など必要な項目だけ有効にします。
3. 最初は検知までの秒数を長めにします。
4. テストで alert が出るか確認します。
5. 通知が多ければ条件をゆるめます。
6. 見逃しが多ければ条件を少し厳しくします。

## 運用のコツ

音声がない映像に無音 alert を設定すると、常に通知が出ることがあります。映像ごとの用途に合わせて profile を分けてください。

## 仕組みを確認する

再生backend、FFmpeg、Analysis、Audio monitor、standbyと異常の違いは [再生と検知機能](/app/playback-and-analysis) にまとめています。
