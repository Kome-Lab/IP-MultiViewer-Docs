# 再生と検知機能

IP MultiViewer は、映像を表示するだけでなく、映像停止、黒画面、フリーズ、低FPS、無音、クリッピングなどを検知します。誤検知を減らすため、未再生状態と本当に異常な状態を分けて扱います。

## 再生backend

| 入力 | 基本動作 |
| --- | --- |
| RTSP / RTMP / RTMPS / HLS | 通常はLibVLCで再生します |
| SRT | FFmpegが使える場合はFFmpeg再生を使います |
| UDP MPEG-TS / RTP | プロトコルに応じて疎通と再生可否を確認します |

SRTは接続モードの違いで失敗しやすいため、FFmpeg再生では `mode=listener` と `mode=caller` の候補も試します。FFmpegが見つからない場合、SRTの再生や解析で期待通りに動かないことがあります。

## FFmpegの見つけ方

アプリは次の順でFFmpegを探します。

1. 環境変数 `FFMPEG_BIN` に指定されたパス
2. `FFMPEG_BIN=ffmpeg` の指定
3. Windowsの `PATH` にある `ffmpeg.exe`

SRTや解析を安定させたい端末では、FFmpegをインストールし、`ffmpeg -version` が通る状態にしてください。

## 検知するalert

| alert | 出る条件の例 |
| --- | --- |
| `video.no_signal` | 再生中に入力が止まった、進行が止まった |
| `video.decode_error` | decoderや入力形式でエラーが起きた |
| `video.black` | 画面の輝度が低く、暗いpixelの割合が高い状態が続いた |
| `video.freeze` | フレーム差分が小さい状態が続いた |
| `video.low_fps` | FPSが閾値を下回る状態が続いた |
| `audio.channel_missing` | 音声trackを検出できない |
| `audio.silence` | 音量が閾値以下の状態が続いた |
| `audio.clipping` | peakが高く、クリッピング候補が多い |

複数のalertは同時に出ることがあります。たとえば、映像が止まっていて音もない場合、`video.freeze` と `audio.silence` を別々に見ます。

## AnalysisとAudio monitor

| 設定 | 有効にする場面 | 無効にする場面 |
| --- | --- | --- |
| Analysis | 黒画面、フリーズ、低FPSに気づきたい | 映像解析が重い、頻繁に誤検知する |
| Audio monitor | 音声が必要なstream | 映像だけ確認するstream、無音が正常なstream |
| Mute alert sound | 特定streamのalert音を止めたい | 重要streamで音も必要 |
| Global mute | 全体の再生音を止めたい | 音声確認も目的の場合 |
| Alert sound | alert音で気づきたい | 通知や目視だけで運用する場合 |

音声がないカメラにAudio monitorを有効にすると、無音alertが出続けることがあります。用途に合わせてstreamごとに切り替えてください。

## standbyと異常の違い

アプリ起動直後、手動Stop後、未割り当てタイルは異常ではありません。この状態で `video.no_signal` を出すと、監視開始前からalertが溜まってしまうため、standby / playback stopped として表示します。

alertは、再生を開始したstreamが一定時間以上問題を示したときに出ます。

## 誤検知を減らす調整

| 症状 | 調整 |
| --- | --- |
| 暗いシーンで黒画面alertが出る | Black durationを長くする、Dark pixel ratioを上げる |
| 静止画に近い映像でfreeze alertが出る | Freeze durationを長くする、Freeze diffを少し上げる |
| 一時的なネットワーク揺れでno signalが出る | Input timeoutを長くする |
| 音が小さいだけで無音になる | Silence dBFSを下げる |
| alertが遅い | durationを短くする。ただし誤検知は増えます |

## 復旧時の扱い

Desktopは、問題が回復したと判断できる場合にactive alertを閉じます。Server sync使用時は、local alertをServerへ送った後、Server側のalertをpullし、同じalert IDなら更新時刻が新しい方を採用します。

## 次に読むページ

- [検知ルール](/configuration/detection-rules)
- [Alert履歴](/operations/alert-history)
- [対応プロトコル](/protocols/protocol-support-matrix)
