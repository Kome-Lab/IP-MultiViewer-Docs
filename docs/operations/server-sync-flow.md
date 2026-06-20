# 同期運用

Server sync を有効にすると、複数端末で設定や alert を共有できます。便利ですが、stream URL や Webhook URL などの秘密情報も扱うため、利用範囲を決めてから使ってください。

## 同期されるもの

- stream 一覧
- layout
- alert profile
- notification channel
- alert 状態
- client heartbeat

## 基本の流れ

1. Server を起動します。
2. Desktop に Server URL と client token を設定します。
3. 接続テストを行います。
4. Desktop で設定を保存します。
5. 別端末で pull できることを確認します。
6. alert が Server に集約されるか確認します。

## 衝突したとき

同じ alert ID は更新日時が新しいものを優先します。設定変更を複数人で同時に行う場合は、どの端末を正とするか運用で決めてください。

## 使わない方がよい場面

- 1 台だけで使う
- ネットワークが不安定
- 設定を共有する必要がない
- secret をサーバーに置きたくない

単体利用で十分な場合は、Server sync を無効のままで問題ありません。
