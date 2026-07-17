# メイン画面の使い方

メイン画面は、映像を見るための常用画面です。設定作業は Settings、過去の異常確認は Alert History に分け、メイン画面では映像、状態、アラートをすぐ見られることを優先します。

通常releaseの`IPMultiViewer-<version>-windows-x64.zip`または`IPMultiViewer-<version>-windows-x64-gpu.zip`を展開し、直下の`IPMultiViewer.exe`を起動します。これがDirect Matrixデザインの現行UIです。監視グリッド、縦長のチャンネル別メーターに加え、SettingsとAlert Historyの情報設計も更新しています。導入と更新は[Windowsアプリ](/installation/windows-app)を参照してください。

## 上部バー

| 項目 | 使い方 |
| --- | --- |
| Layout | `Default 2x2`、`Default 3x3`、`Default 4x4` などの表示レイアウトを切り替えます |
| Start | 現在のレイアウトに割り当てられた有効な映像を再生します |
| Stop | 再生中の映像を停止します |
| Alert History | 過去と現在のalertを一覧で確認します |
| Settings | 映像、閾値、同期、音声、レイアウトを設定します |
| Version | 左上の`v2.3.0`形式の表示。releaseを作成したGit tagと一致します |
| Mode表示 | Standalone local mode か Server sync 中かを表示します |
| Playback summary | active、loaded、layout streams、errors の概要を表示します |
| DECODE / OUTPUT | decode backendの確認状態と、WPFなどの表示経路・解像度を表示します |
| Meter: VU / PEAK | すべての表示中streamのメーター方式を一括切替します |

Start は、現在選んでいるレイアウトに入っている stream だけを対象にします。登録済みでもレイアウトに割り当てていない stream は、そのレイアウトでは再生されません。

## タイルの表示

各タイルには、次の情報が表示されます。

| 表示 | 意味 |
| --- | --- |
| stream名 | Settings の `Name` |
| status badge | standby、starting、playing、error など |
| alert overlay | open / acknowledged / snoozed のalertを表示。現行UIのSRT/FFmpeg映像ではタイル内へ直接描画し、映像viewportと再生sessionは変えません |
| status frame | severity に応じて黄色または赤系で表示 |
| audio meter | Audio monitorが有効なstreamのチャンネル別音量。映像の左右に独立meter bankを表示 |
| placeholder | stream未割り当て、停止中、再生不可の理由 |

未再生のタイルは正常映像ではなく、standby や playback stopped として扱います。手動Stop直後や起動直後の未再生状態だけで `video.no_signal` を出さないためです。

status badge は、入力を読んでいるかだけでなく、映像フレームが実際に表示されたかも反映します。最初のフレームがまだ出ていない場合は `rendering`、表示済み映像が古い場合は `video age`、FFmpeg描画が遅れている場合は `render` の値を確認します。

## DECODE / OUTPUTの見方

現行UIのヘッダーは、decode処理と画面への出力経路を`DECODE / OUTPUT`として分けて表示します。たとえば`GPU · D3D11VA / WPF 640x360`は、FFmpegがD3D11VAを使ったruntime evidenceを検出し、そのsessionのframeがWPF画面へ提示された状態です。

| 表示例 | 意味 |
| --- | --- |
| `GPU · D3D11VA / WPF 640x360` | runtime evidenceとframe提示の両方が揃った、確認済みのFFmpeg GPU decode |
| `D3D11VA · REQUESTED / WPF 640x360` | D3D11VAを要求済み。実際にGPU decodeできたことは未確認 |
| `AUTO · DETECTING / WPF 640x360` | backendのruntime evidenceを確認中 |
| `AUTO · UNKNOWN / WPF 640x360` | backendを特定できるevidenceがない。GPU動作の確認には使えません |
| `DXVA2 · REQUESTED / D3D9` | GPU packageのLibVLC経路でDXVA2を要求済み。runtime確認済みを意味しません |
| `MIXED / MIXED` | 表示中stream間でdecode状態またはoutput経路が異なります。tooltipでstreamごとの内訳を確認します |
| `IDLE / —` | 再生sessionがありません |

`REQUESTED`と`UNKNOWN`は、GPU動作の確認ではありません。また、`WPF 640x360`は画面へ出す経路と解像度を示すもので、GPU decodeの証拠ではありません。FFmpegで`GPU · <backend>`が確認できてもGPU対象はdecodeであり、scale、BGR変換、analysis、WPF bitmap転送はCPU/memory経路です。複数streamの内訳と次回receiver開始時のtargetは、表示へpointerを合わせたtooltipで確認できます。

## Audio meterの見方

Audio monitorが有効で、直近3秒以内の音声sampleがあるstreamだけにメーターを表示します。複数channelは`CH1`、`CH2`のように別々に動き、最大16channelまでを左右のbankに分けます。meter trackは152 DIPを基準に上下の映像余白を使い、狭いタイルでは自動縮小します。メーター値が古くなると非表示になります。

上部の`METER`から次の2方式を切り替えます。選択は正式configの`local-config.json`に保存されます。

| モード | 表示の元値 | 目盛り | 使い方 |
| --- | --- | --- | --- |
| VU | channelごとのRMS相当値 | `-60`〜`+3 VU`、`0 VU = -18 dBFS` | 聴感上の平均的な大きさのバランス確認 |
| PEAK | channelごとのpeak値 | `-60`〜`0 dBFS` | 瞬間的な過大入力、clip余裕の確認 |

VUではpeak markerを非表示、PEAKではpeak markerを表示します。緑は通常域、黄は大きめの入力、赤は過大入力の目安です。`PLAYING`の横に小さな水平メーターは表示しません。音声値は映像の左右にあるチャンネル別meter bankで確認してください。

SRT/FFmpegでは、画面へ提示したvideo frameのPTSを基準に、同じPTS以下の最新audio levelを選んで表示します。受信済みの音声だけが映像より先へ進まないようにし、PTS同期済みの立ち上がり・下降を即時に反映します。映像より150msを超えて古い値は表示しません。

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

タイル上のalertは、現行UIのSRT/FFmpeg映像ではWPFタイル内へ直接描画されます。LibVLCのnative映像面だけはairspace対策としてMainWindow所有の透明overlay Windowを使いますが、MainWindowが非アクティブまたは最小化中は必ず非表示にします。このため、別アプリを操作中に警告だけが上へ浮いたり、alert発生でMainWindowがforegroundへ移動したりしません。MainWindowへ明示的に戻るとactive alertを再表示します。alertが新しく出る、複数になる、解消される、再び開く、のいずれでも映像viewportの幅と高さ、再生sessionは変わりません。overlayには次の操作があります。

| 操作 | 用途 |
| --- | --- |
| acknowledge | 見たことを記録します |
| snooze | 一時的に通知や強調を止めます |
| resolve | 復旧したものとして閉じます |
| ignore | 対応不要として閉じます |

同じstreamでも、`video.black` と `audio.silence` は別のalertです。映像が復旧しても音声の問題が残っている場合は、別々に確認してください。

## Footerとログ

画面下部には、保存、同期、エラーなどの短いメッセージとログ保存先が表示されます。現行UIのログは次の場所に保存されます。

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
