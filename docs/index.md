<div class="doc-hero">

# IP MultiViewer ドキュメント

IP MultiViewer は、複数のカメラや配信映像を Windows PC 上でまとめて確認するためのアプリです。映像が止まった、黒画面になった、音が出ていない、といった状態に気づきやすくすることを目的にしています。

</div>

## まず読むページ

<div class="doc-grid">
  <a class="doc-card" href="/overview/what-is-ip-multiviewer"><strong>1. 全体像を知る</strong><span>IP MultiViewer でできることと、最初の使い方を確認します。</span></a>
  <a class="doc-card" href="/overview/components"><strong>2. 構成要素</strong><span>Desktop、Server、Agent の使い分けを確認します。</span></a>
  <a class="doc-card" href="/installation/windows-app"><strong>3. Windowsに入れる</strong><span>ダウンロード、起動、更新時の流れを確認します。</span></a>
  <a class="doc-card" href="/app/main-window"><strong>4. メイン画面を使う</strong><span>Layout、Start、Stop、タイル、Alert History の見方を確認します。</span></a>
  <a class="doc-card" href="/app/settings-window"><strong>5. Settingsを使う</strong><span>Streams、Alert Profile、Server sync、音声、設定保存を確認します。</span></a>
  <a class="doc-card" href="/operations/server-sync-flow"><strong>6. 同期運用</strong><span>複数端末で設定や alert を共有する流れを確認します。</span></a>
  <a class="doc-card" href="/troubleshooting/"><strong>7. 困ったとき</strong><span>映像、音声、通知、Server/Agent の問題を順番に切り分けます。</span></a>
</div>

## できること

- 複数の映像を一つの画面で見る
- 映像停止、黒画面、無音などに気づきやすくする
- アラート音や通知を使う
- 必要に応じてサーバー同期を使う
- Desktop を開いていない場所では Agent で疎通確認する

## 基本方針

まずは Windows アプリ単体で使い始めるのがおすすめです。複数端末で設定を共有したい場合だけ、サーバー同期を追加します。

<div class="tip-box">
カメラ URL、認証情報、Webhook URL はスクリーンショットやログに写りやすい情報です。公開前に必ず隠してください。
</div>

## 機能別に読む

- 映像 URL と認証を設定する: [映像ソース設定](/configuration/stream-sources)
- メイン画面のボタンやタイルを見る: [メイン画面の使い方](/app/main-window)
- Settings の各項目を確認する: [Settings画面の使い方](/app/settings-window)
- 再生backendと検知の仕組みを見る: [再生と検知機能](/app/playback-and-analysis)
- タイルの割り当てを整える: [タイルとウィンドウ](/configuration/tile-layouts)
- 検知条件を調整する: [検知ルール](/configuration/detection-rules)
- Alert 履歴を見る: [Alert履歴](/operations/alert-history)
- Server と Agent を使う: [ServerとAgentを使う](/installation/server-and-agent)
- 設定ファイルやenvを確認する: [設定ファイルとenvリファレンス](/reference/config-and-env)
