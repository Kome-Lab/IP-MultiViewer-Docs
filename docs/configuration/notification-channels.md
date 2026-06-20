# 通知先

アラートを受け取る場所を設定します。通知先には Webhook URL などの秘密情報が含まれることがあるため、扱いに注意してください。

## 設定手順

1. Server を起動します。
2. Server 側に `MULTIVIEWER_SECRET_ENCRYPTION_KEY` を設定します。
3. 通知先を作成します。
4. Name、type、Webhook URL、severity filter、event filter を設定します。
5. test notification を送ります。
6. 実際に通知が届いたことを確認します。
7. notification deliveries で結果を確認します。

## 通知名の付け方

- 送信先が分かる名前にします。
- テスト用と本番用を分けます。
- 使わなくなった通知先は削除します。
- 複数人が見る場合は、通知文で映像名が分かるようにします。

## 確認ポイント

- テスト通知が届く
- 通知文でどの映像の問題か分かる
- 通知が多すぎない
- 使っていない通知先が残っていない

## 秘密情報

Webhook URL や token は公開資料、ログ、スクリーンショットに出さないでください。漏れた可能性がある場合は、通知先側で URL や token を作り直してください。

## 対応channel

| type | 用途 |
| --- | --- |
| `discord` | Discord webhookへ通知 |
| `slack` | Slack webhookへ通知 |
| `generic` | 汎用Webhookへ通知 |

通知先URLは保存時に暗号化し、一覧や履歴ではmasked targetだけを扱います。暗号化keyがない場合、通知先secretを安全に保存できないため作成や更新が失敗します。
