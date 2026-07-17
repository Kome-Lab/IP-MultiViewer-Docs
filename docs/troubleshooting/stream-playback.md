# 映像が出ない

映像が黒い、止まる、読み込み中のままになる場合の確認手順です。

## 確認する順番

1. 映像 URL に入力ミスがないか確認します。
2. 同じ URL を別のプレイヤーで開けるか確認します。
3. Windows PC から映像元へネットワーク接続できるか確認します。
4. 認証が必要な映像では、ユーザー名とパスワードを確認します。
5. VPN や社内ネットワークが必要な場合は接続状態を確認します。
6. ほかの映像も同時に止まっていないか確認します。

## status表示で見ること

`starting` や `rendering` が続く場合は、入力を開けていても最初の映像フレームが画面に提示されていない状態です。SRTや高遅延の入力では、URL、接続mode、FFmpegの有無を確認してください。

`video age` が増える場合は、過去に表示したフレームから新しい表示フレームへ進んでいません。`render` の値が大きい場合は、FFmpeg再生でフレーム取得から画面反映までが遅れています。複数streamで同時に増える場合は、端末負荷やネットワークの揺れも確認します。

## 画質が低く見える

現行UIのFFmpeg再生はreceiver開始時に、layoutとDPI込みviewportから表示用frameを選びます。基準は2x2で`960x540`、3x3で`640x360`、4x4で`480x270`です。広い高DPI画面では最大でそれぞれ`1280x720`、`960x540`、`640x360`になります。まず`DECODE / OUTPUT`の`OUTPUT`側を確認してください。再生中のlayout切替ではSRT接続を維持するためsessionを再接続せず、tooltipに表示される新しいtargetは次のStop/Startで適用します。

適応解像度はbicubicで縦横比を保ちますが、元映像の解像度やbitrateが低い場合、細部は増えません。別playerで同じURLを開き、入力側でも粗い場合はカメラやencoderの出力解像度、bitrate、sub streamを確認してください。

## GPUで処理されているか確認する

現行UIヘッダーの`DECODE / OUTPUT`を確認します。`GPU · D3D11VA`などの`GPU · <backend>`は、FFmpegのruntime evidenceと実際のframe提示を両方確認した状態です。

`REQUESTED`はhardware decodeを要求しただけ、`DETECTING`は確認中、`UNKNOWN`はbackendを確認できるevidenceがない状態です。いずれもGPU動作の確認には使えません。`WPF 640x360`などの`OUTPUT`は画面への出力経路であり、GPU decodeを示す表示ではありません。`MIXED`の場合はindicatorのtooltipでstreamごとの内訳を確認します。

## よくある原因

- URL が古い
- 認証情報が変わった
- カメラや配信元が停止している
- ネットワークが届いていない
- 対応していない形式を指定している
- SRTのcaller / listener modeが合っていない
- FFmpegが見つからず、低遅延再生やSRT再生が使えていない
- 画質確認時に、カメラの低解像度sub streamを指定している
- GPU packageを使っているためGPU動作済みだと思い、`DECODE`のruntime確認結果を見ていない

## 次に読むページ

対応形式は [対応プロトコル](/protocols/protocol-support-matrix) も確認してください。
