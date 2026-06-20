export default {
  title: 'IP MultiViewer Docs',
  description: 'IP MultiViewerを初めて使う人向けの分かりやすい公開ドキュメントです。',
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  vite: {
    server: { host: '127.0.0.1', fs: { strict: true } },
    preview: { host: '127.0.0.1' },
  },
  themeConfig: {
    nav: [
      { text: 'はじめに', link: '/' },
      { text: 'インストール', link: '/installation/windows-app' },
      { text: '画面と機能', link: '/app/main-window' },
      { text: '構成要素', link: '/overview/components' },
      { text: '困ったとき', link: '/troubleshooting/' },
    ],
    sidebar: [
      {
        text: 'まず読む',
        items: [
          { text: 'IP MultiViewerとは', link: '/overview/what-is-ip-multiviewer' },
          { text: '構成要素', link: '/overview/components' },
          { text: 'Windowsアプリを入れる', link: '/installation/windows-app' },
          { text: 'ServerとAgentを使う', link: '/installation/server-and-agent' },
          { text: '最初の設定', link: '/operations/first-setup' },
          { text: '映像を追加する', link: '/operations/add-first-stream' },
        ],
      },
      {
        text: '画面と機能',
        items: [
          { text: 'メイン画面', link: '/app/main-window' },
          { text: 'Settings画面', link: '/app/settings-window' },
          { text: '再生と検知機能', link: '/app/playback-and-analysis' },
        ],
      },
      {
        text: '設定',
        items: [
          { text: '映像ソース設定', link: '/configuration/stream-sources' },
          { text: 'レイアウト', link: '/configuration/layouts' },
          { text: 'タイルとウィンドウ', link: '/configuration/tile-layouts' },
          { text: 'アラート設定', link: '/configuration/alert-profiles' },
          { text: '検知ルール', link: '/configuration/detection-rules' },
          { text: '通知先', link: '/configuration/notification-channels' },
          { text: 'サーバー同期', link: '/configuration/server-sync' },
          { text: '対応プロトコル', link: '/protocols/protocol-support-matrix' },
          { text: '設定ファイルとenv', link: '/reference/config-and-env' },
        ],
      },
      {
        text: '日常の使い方',
        items: [
          { text: '日常の見方', link: '/operations/daily-use' },
          { text: '通知を受けたとき', link: '/operations/respond-to-alerts' },
          { text: 'Alert履歴', link: '/operations/alert-history' },
          { text: '同期運用', link: '/operations/server-sync-flow' },
        ],
      },
      {
        text: '安全に使う',
        items: [
          { text: '安全に公開する', link: '/security/hardening' },
          { text: '映像URLの扱い', link: '/security/stream-url-secrets' },
          { text: 'Webhookの扱い', link: '/security/webhook-secrets' },
        ],
      },
      {
        text: '困ったとき',
        items: [
          { text: '困ったとき', link: '/troubleshooting/' },
          { text: '映像が出ない', link: '/troubleshooting/stream-playback' },
          { text: '音声の問題', link: '/troubleshooting/audio' },
          { text: '通知の問題', link: '/troubleshooting/webhooks' },
          { text: 'ServerとAgentの問題', link: '/troubleshooting/server-agent' },
        ],
      },
    ],
  },
};
