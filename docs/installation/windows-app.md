# Windowsアプリ

IP MultiViewerのWindows packageは、ZIP直下の`IPMultiViewer.exe`を通常起動する構成です。最初はサーバー同期や通知を入れず、映像が安定して見えるところまで確認します。

## インストール前に確認すること

- Windows 10またはWindows 11の端末
- カメラや配信機器にアクセスできるネットワーク
- 追加したい映像のURLと、必要な認証情報
- 通知を使う場合はWebhook URL

## release packageの名前と内容

`<version>`は`v1.2.3`や`v2.3.0-rc.1`のような既存Git tagです。このtagを唯一のversion sourceとして、先頭`v`を除いた`1.2.3`や`2.3.0-rc.1`をアプリのProductVersion、サーバーへ報告するclient version、画面左上のversion表示へ使います。WindowsのFileVersionは数値4要素のため、それぞれ`1.2.3.0`、`2.3.0.0`になります。

| package | ZIP名 | 用途 |
| --- | --- | --- |
| standard | `IPMultiViewer-<version>-windows-x64.zip` | 通常のCPU環境、またはdecode backendを自動選択する端末 |
| GPU | `IPMultiViewer-<version>-windows-x64-gpu.zip` | GPU decodeを要求する端末。実使用は画面の`DECODE / OUTPUT`で確認 |

どちらのZIPも展開後の構成は同じです。GPU版でもEXE名へ`GPU`は付きません。

```text
IPMultiViewer.exe
README-WINDOWS.md
VERSION.txt
```

通常利用する実行ファイルは`IPMultiViewer.exe`だけです。`README-WINDOWS.md`にはオフラインで読める起動・更新手順、`VERSION.txt`にはGit tag、software version、FileVersion、flavorが入ります。

## インストールと初回起動

1. GitHub ReleaseからWindows版ZIPと対応する`.sha256`をダウンロードします。
2. `Get-FileHash .\IPMultiViewer-<version>-windows-x64.zip -Algorithm SHA256`などでhashを確認します。GPU版ではZIP名を`-gpu.zip`へ読み替えます。
3. 管理しやすいアプリ用folderへZIPを展開し、直下の`IPMultiViewer.exe`を起動します。
4. Windowsの確認画面が出た場合は、発行元と保存場所を確認してから実行します。
5. 最初の画面が開いたら、[最初の設定](/operations/first-setup)に進みます。

## 設定とログ

| 種別 | path |
| --- | --- |
| config | `C:\ProgramData\IPMultiViewer\config\local-config.json` |
| log | `C:\ProgramData\IPMultiViewer\logs\desktop.log` |

preview版の`local-config.next.json`が正式configより新しい場合、正式版の初回起動時に内容を`local-config.json`へ自動昇格します。preview原本は変更・削除せず保持します。

昇格後の変更は`local-config.json`へ保存されます。設定と映像を確認できるまでは`local-config.next.json`もbackupとして保持してください。

- Settingsで変更したstream、layout、meter modeは現行configへ保存されます。
- ExportしたJSONにはtokenやcredential付きURLが含まれる可能性があります。秘密情報として扱ってください。

## 置き場所と更新

ZIPは`Downloads`ではなく管理しやすいアプリ用folderへ展開します。configは既定では`C:\ProgramData`にあり、EXEと同じfolderには保存されません。

更新するときは次の順序で作業します。

1. 起動中の`IPMultiViewer.exe`を終了します。
2. 現在の展開先と`local-config.json`をbackupします。
3. 新しいZIPのhashを確認し、旧versionとは別のfolderへ展開します。
4. 新しいfolder直下の`IPMultiViewer.exe`を起動します。
5. 映像、音声meter、alert、設定を確認してからショートカットを切り替えます。

更新後に問題がある場合は新しいアプリを終了し、backupしておいた直前versionの`IPMultiViewer.exe`へ戻します。異なるversionのファイルを同じfolderへ上書き混在させないでください。

## 起動後に確認すること

- ZIP直下の`IPMultiViewer.exe`からメイン画面が開いている
- 映像が表示される
- 表示中streamのchannel別meterが動き、VU/PEAKを切り替えられる
- `DECODE / OUTPUT`でdecodeの確認状態と表示経路が読める。`REQUESTED`や`UNKNOWN`をGPU確認済みと扱わない
- FFmpeg出力がreceiver開始時のlayout/viewportに合う（基準: 2x2=`960x540`、3x3=`640x360`、4x4=`480x270`。高DPIではindicator tooltipの次回start targetも確認）
- alertを発生・解消しても、監視映像の幅と高さが変わらない
- 画面サイズや2x2/3x3/4x4を変えてもlayoutが崩れない
- アプリを閉じて開き直しても、設定が残る

## サーバー同期について

最初は使わなくても問題ありません。複数端末で同じ設定を使いたい場合や、履歴を共有したい場合に追加してください。現行UIは`apps/desktop-windows/IPMultiViewer.csproj`の同期code pathを直接使います。
