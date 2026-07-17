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

## 低遅延再生と表示状態

Desktop は監視画面での遅れを減らすため、再生backendに低遅延向けのcache設定を使います。LibVLC は network / live / file cache を短くし、FFmpeg再生は入力解析を短くして最新フレームを優先します。

FFmpegで再生できるstreamは、再生用のフレームと解析用の値を同じ処理から受け取ります。これにより、SRTなどで再生と解析が別々に接続して負荷や遅延が増えることを避けます。

タイルのstatusは、入力を読み始めたかだけでなく、実際に映像フレームが画面へ提示されたかも見ます。最初のフレームがまだ出ていない間は `rendering` として扱い、表示済み映像が古くなると `video age` や `render` の遅れをstatusに出します。

## FFmpeg表示品質

現行UIはreceiver開始時に、タイル数とDPI込みviewportに合わせてFFmpegの表示用frameを選びます。少ないタイルでは1画面あたりの細部を増やし、4x4では16streamを同時更新するときの処理量を抑えます。

| Layout | 基準frame | 広い高DPI viewportでの上限 |
| --- | --- | --- |
| 2x2 | `960x540` | `1280x720` |
| 3x3 | `640x360` | `960x540` |
| 4x4 | `480x270` | `640x360` |

変換はbicubic scaleを使い、入力映像の縦横比を保持します。出力枠と比率が合わない部分は黒で補い、映像を引き伸ばしません。再生中のlayout変更ではSRTを切断しないため既存sessionを維持し、新しいtargetは次のreceiver開始（Stop/Start）で適用します。targetは`DECODE / OUTPUT`のtooltipで確認できます。

この適応解像度は現行UIのFFmpeg再生に適用します。元映像にない細部を生成する機能ではないため、入力自体が低解像度または低bitrateの場合は配信元の設定も確認してください。

## GPU decodeの確認

GPU packageはhardware decodeを要求しますが、要求したことと実際にGPUでdecodeできたことは別です。現行UIは、FFmpegのruntime logからhardware backendを示すevidenceを検出し、かつそのsessionのframeが画面へ提示された場合だけ、ヘッダーへ`GPU · D3D11VA`などと表示します。

`D3D11VA · REQUESTED`、`DXVA2 · REQUESTED`、`AUTO · DETECTING`、`AUTO · UNKNOWN`、`LIBVLC · UNKNOWN`はGPU動作の確認済み表示ではありません。`WPF 960x540`などの`OUTPUT`は表示経路と表示用frameサイズであり、GPU decodeの証拠ではありません。表示中streamの状態が異なる場合は`MIXED`になり、tooltipでstreamごとのdecode/outputを確認できます。

## 検知するalert

| alert | 出る条件の例 |
| --- | --- |
| `video.no_signal` | 再生中に入力が止まった、進行が止まった |
| `video.decode_error` | decoderや入力形式でエラーが起きた |
| `video.black` | 画面の輝度が低く、暗いpixelの割合が高いフレームを検知した |
| `video.freeze` | フレーム差分が小さい状態が続いた |
| `video.low_fps` | FPSが閾値を下回る状態が続いた |
| `audio.channel_missing` | 音声trackを検出できない |
| `audio.silence` | 音量が閾値以下の状態が続いた |
| `audio.clipping` | peakが高く、クリッピング候補が多い |

複数のalertは同時に出ることがあります。たとえば、映像が止まっていて音もない場合、`video.freeze` と `audio.silence` を別々に見ます。

黒味検知は、継続秒数を待たず、黒味フレームを検知した時点で `video.black` を出します。誤検知を減らす場合は、黒味のdurationではなく、平均輝度、暗いpixelの明るさ、暗いpixelの割合を調整します。

## AnalysisとAudio monitor

| 設定 | 有効にする場面 | 無効にする場面 |
| --- | --- | --- |
| Analysis | 黒画面、フリーズ、低FPSに気づきたい | 映像解析が重い、頻繁に誤検知する |
| Audio monitor | 音声が必要なstream | 映像だけ確認するstream、無音が正常なstream |
| Mute alert sound | 特定streamのalert音を止めたい | 重要streamで音も必要 |
| Global mute | 全体の再生音を止めたい | 音声確認も目的の場合 |
| Alert sound | alert音で気づきたい | 通知や目視だけで運用する場合 |

音声がないカメラにAudio monitorを有効にすると、無音alertが出続けることがあります。用途に合わせてstreamごとに切り替えてください。

## 音声レベルメーター

Audio monitorが有効なstreamでは、タイル上にchannel別の音声レベルを表示します。上部`METER`で、RMS相当値を`-60`〜`+3 VU`へ写像するVU（`0 VU = -18 dBFS`）と、peak値を`-60`〜`0 dBFS`で見るPEAKを切り替えます。

複数channelは別々に動き、片側だけ無音、片側だけclipに近い、といった状態を見分けられます。VUではpeak markerを隠し、PEAKでは表示します。

SRT/FFmpegでは、videoとaudioのPTSを別々に保持し、画面へ提示済みのvideo PTSを超えず、かつ150ms以内のaudio levelだけをmeterへ渡します。Peak/VUの立ち上がり・下降はPTS切替時に即時反映します。FFmpegから取り込むaudio metadataはchannel別RMS/Peakだけに限定し、複数stream時のCPU負荷と解析待ちを抑えます。video PTSが欠落した場合は最初の待機後に非待機へ切り替え、直近PTSから最大2秒を補間して映像fpsとmeterを維持します。`stats_enc_pre`非対応の旧FFmpegでは`showinfo`を使います。

メーターが動かない場合は、streamに音声trackがない、Audio monitorが無効、または入力側が無音の可能性があります。

## standbyと異常の違い

アプリ起動直後、手動Stop後、未割り当てタイルは異常ではありません。この状態で `video.no_signal` を出すと、監視開始前からalertが溜まってしまうため、standby / playback stopped として表示します。

alertは、再生を開始したstreamが一定時間以上問題を示したときに出ます。

## 誤検知を減らす調整

| 症状 | 調整 |
| --- | --- |
| 暗いシーンで黒画面alertが出る | Black lumaを下げる、Dark pixel lumaを下げる、Dark pixel ratioを上げる |
| 静止画に近い映像でfreeze alertが出る | Freeze durationを長くする、Freeze diffを少し上げる |
| 一時的なネットワーク揺れでno signalが出る | Input timeoutを長くする |
| 音が小さいだけで無音になる | Silence dBFSを下げる |
| freeze、低FPS、無音alertが遅い | 対象のdurationを短くする。ただし誤検知は増えます |

## 復旧時の扱い

Desktopは、問題が回復したと判断できる場合にactive alertを閉じます。Server sync使用時は、local alertをServerへ送った後、Server側のalertをpullし、同じalert IDなら更新時刻が新しい方を採用します。

## 次に読むページ

- [検知ルール](/configuration/detection-rules)
- [Alert履歴](/operations/alert-history)
- [対応プロトコル](/protocols/protocol-support-matrix)
