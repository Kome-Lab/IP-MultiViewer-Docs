# Settings画面の使い方

Settings は、映像、alert profile、server sync、layout、音声、設定ファイルを扱う画面です。変更した内容は `Save` で保存します。項目によっては `Apply` を押した時点で一部反映されますが、運用では最後に `Save` しておくと安全です。

## 上部ボタン

| ボタン | 使い方 |
| --- | --- |
| Import | 外部の設定JSONを読み込みます |
| Export | 現在の設定をJSONとして書き出します |
| Save | 現在の設定を既定の設定ファイルに保存します |
| Reload | 既定の設定ファイルを読み直します |

Import / Export した設定には映像URLやclient tokenが含まれる場合があります。共有する前に実値を消すか、別途安全な方法で渡してください。

## Streams

左側のStreams一覧でstreamを選ぶと、下部のSelected Streamで編集できます。

| 項目 | 説明 |
| --- | --- |
| Name | タイルに出る表示名です。場所や用途で付けます |
| Input URL | RTSP、SRT、RTMP、HLSなどの入力URLです |
| Protocol | `rtsp`、`srt`、`rtmp`、`rtmps`、`hls`、`udp_mpegts`、`rtp` など |
| Group | 場所、拠点、用途などの分類です |
| Tags | 検索や整理用の短いラベルです |
| Alert Profile | このstreamに適用する検知閾値です |
| Enabled | Start時に再生対象にするかを決めます |
| Analysis | 黒画面、フリーズ、低FPSなどの映像解析を有効にします |
| Audio monitor | 無音やクリッピングなどの音声監視を有効にします |
| Mute alert sound | このstreamだけalert音を鳴らさないようにします |

`Apply Stream` は選択中のstreamに編集内容を反映します。`Add` は新しいstreamを作り、空きタイルがあれば自動で割り当てます。`Delete` はstream、タイル割り当て、関連するlocal alertを削除します。

## Input URLの注意

認証付きURLを使う場合は、スクリーンショットや画面共有に注意してください。アプリは表示時やログ出力時にcredentialをmaskしますが、入力欄に実値を入れている最中は見えます。

placeholder のままでは再生されません。

```text
rtsp://user:<PASSWORD>@camera.example.com/live
```

実運用では、カメラや配信元から発行された正しいURLへ置き換えます。

## Alert Profile Thresholds

右上のAlert Profile Thresholdsでは、検知条件を調整します。

| 項目 | 目安 |
| --- | --- |
| Black luma | 画面の平均輝度がどれくらい低いと黒画面候補にするか |
| Dark pixel luma | 暗いpixelと見なす明るさ |
| Dark pixel ratio | 画面の何割が暗いと黒画面候補にするか |
| Black duration sec | 黒画面候補が何秒続いたらalertにするか |
| Freeze diff | フレーム差分がどれくらい小さいと停止候補にするか |
| Freeze duration sec | 停止候補が何秒続いたらalertにするか |
| Freeze frames | 何フレーム以上安定したら停止候補にするか |
| Input timeout sec | 入力やサンプルが途切れたと見る秒数 |
| Low FPS threshold | FPS低下と見る値 |
| Low FPS duration sec | FPS低下が何秒続いたらalertにするか |
| Silence dBFS | 無音と見る音量 |
| Silence duration sec | 無音が何秒続いたらalertにするか |
| Clipping count | クリッピング検知のサンプル数 |

まずは既定値で始めて、通知が多すぎる場合は duration を長くする、見逃しが多い場合は threshold を少し厳しくする、という順で調整します。

## Status / Server sync

右下のStatusでは、設定ファイル、alert summary、server sync、layout、音声設定を扱います。

| 項目 | 説明 |
| --- | --- |
| Config path | 現在使っている設定ファイルの場所です |
| Alert summary | active alert数とstream数です |
| Server URL | Server sync先のURLです |
| Client Token | Serverへ接続するためのtokenです |
| Server sync | Serverとの同期を有効にします |
| Apply | Server URL、Client Token、Server syncの変更を反映します |
| Layout | 現在使うLayoutを選びます |
| Global mute | 全streamの再生音をmuteします |
| Alert sound | alert音を鳴らすかどうかを切り替えます |

Server sync を有効にする場合は、Server URL が `http://` または `https://` の絶対URLである必要があります。本番や共有環境ではHTTPSを使ってください。

## 設定ファイルの場所

既定の設定ファイルは次の場所です。

```text
C:\ProgramData\IPMultiViewer\config\local-config.json
```

このファイルにはstream URL、server URL、client token、alert履歴が含まれることがあります。バックアップや共有時は秘密情報の扱いに注意してください。

## 変更後の確認

1. `Apply Stream` または `Apply Alert Profile` を押します。
2. 必要なら `Save` を押します。
3. メイン画面でStartします。
4. タイル表示、alert、音声、Playback summaryを確認します。
5. アプリを再起動し、設定が残っているか確認します。

## 次に読むページ

- [映像ソース設定](/configuration/stream-sources)
- [検知ルール](/configuration/detection-rules)
- [設定ファイルとenvリファレンス](/reference/config-and-env)
