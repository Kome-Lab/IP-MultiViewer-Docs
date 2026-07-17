# UI全面改修 API・イベント契約調査

最終更新: 2026-07-14

## 結論

現行IP MultiViewerにはWebSocketとServer-Sent Eventsの実装がありません。DesktopとServerのリアルタイム相当連携は、成功時おおむね15秒間隔のREST全量pollです。Agentは既定30秒周期です。

新UIのPoCでは、この契約を変更せず型付きREST clientとpolling coordinatorで包みます。WebSocketへの置換はAPI変更を伴う別提案として扱い、今回の前提にはしません。

## Wire model

| 型 | 主なJSON field |
|---|---|
| `StreamConfig` | `id`, `name`, `enabled`, `input_url`, `input_protocol`, `group`, `tags`, `audio_monitor_enabled`, `analysis_enabled`, `alert_profile_id`, timestamps |
| `Layout` | `id`, `name`, `kind`, `tiles[]`, timestamps。tileは `index`, `stream_id`, `row`, `column`, `row_span`, `col_span` |
| `AlertProfile` | black/freeze/input-timeout/silence/clipping閾値、timestamps |
| `Alert` | `id`, `stream_id`, `type`, `severity`, `status`, `message`, `started_at`, `updated_at`, `snoozed_until`, `source_client_id` |
| `ClientRegistration` | `client_id`, `name`, `version`, `mode`, `capabilities` |
| `ClientHeartbeat` | `client_id`, `active_layout_id`, `status`, `active_alerts`, `timestamp` |
| `ClientStatus` | registration＋heartbeat、`heartbeat_age_sec`, `online`, `registered` |
| `NotificationChannel` | `id`, `name`, `type`, masked target、severity/event filter、enabled、timestamps |
| `NotificationDelivery` | `id`, `channel_id`, `event_type`, `status`, `target_masked`, `attempts`, `last_error`, timestamps |
| `ErrorResponse` | `request_id`, `code`, `message` |

主なenumは、layout=`2x2|3x3|4x4|custom`、severity=`info|warning|error|critical`、alert status=`open|acknowledged|snoozed|resolved|ignored`です。alert typeは映像、音声、transport、system系24種です。

根拠: `packages/contracts/contracts.go:17-204`

## REST route一覧

`T` はclient token必須です。ただしServerにtokenが1件も設定されていない場合は認証なしで通ります。

| Method / path | 認証 | Request | 正常Response | UI移行上の注意 |
|---|---:|---|---|---|
| `GET /health` | 公開 | なし | service health | process healthのみ |
| `GET /streams` | T | なし | `StreamConfig[]` | URLはmask、順序未規定 |
| `POST /streams` | T | `StreamConfig` | `201 StreamConfig` | Desktop現行UIは未使用 |
| `GET /streams/{id}` | T | なし | `StreamConfig` | Desktop現行UIは未使用 |
| `PUT /streams/{id}` | T | full object | `StreamConfig` | Desktop現行UIは未使用 |
| `DELETE /streams/{id}` | T | なし | deleted status | Desktop現行UIは未使用 |
| `GET /layouts` | T | なし | `Layout[]` | 順序未規定 |
| `POST /layouts` | T | `Layout` | `201 Layout` | Desktop現行UIは未使用 |
| `GET /layouts/{id}` | T | なし | `Layout` | Desktop現行UIは未使用 |
| `PUT /layouts/{id}` | T | full object | `Layout` | validationが弱い |
| `DELETE /layouts/{id}` | T | なし | deleted object | Desktop現行UIは未使用 |
| `GET /alert-profiles` | T | なし | `AlertProfile[]` | Desktop-only閾値を含まない |
| `POST /alert-profiles` | T | profile | `201 AlertProfile` | Desktop現行UIは未使用 |
| `GET /alert-profiles/{id}` | T | なし | profile | Desktop現行UIは未使用 |
| `PUT /alert-profiles/{id}` | T | full profile | profile | threshold validationなし |
| `DELETE /alert-profiles/{id}` | T | なし | deleted object | Desktop現行UIは未使用 |
| `GET /clients` | T | なし | `ClientStatus[]` | Settings summaryへ反映 |
| `GET /clients/{id}` | T | なし | `ClientStatus` | Desktop現行UIは未使用 |
| `POST /clients/register` | T | registration | `202` registration | Desktop/Agentが使用 |
| `POST /clients/{id}/revoke-token` | T | なし | revoked count | Desktop現行UIは未使用 |
| `POST /clients/heartbeat` | T | heartbeat | `202` heartbeat | Desktop/Agentが使用 |
| `POST /client-alerts` | T | alert | `202`実効alert | Desktop/Agentが使用、dedupeあり |
| `GET /alerts` | T | なし | `Alert[]` | filter/pagination/sort指定なし |
| `GET /alerts/{id}` | T | なし | alert | Desktop現行UIは未使用 |
| `POST /alerts/{id}/acknowledge` | T | なし | alert | Desktopは専用routeを使わない |
| `POST /alerts/{id}/snooze` | T | optional timestamp | alert | body省略時は10分 |
| `POST /alerts/{id}/resolve` | T | なし | alert | Agentが復旧時に使用 |
| `GET /notification-channels` | T | なし | channels | Desktop model/UIなし |
| `POST /notification-channels` | T | channel | `201` channel | Desktop model/UIなし |
| `PUT /notification-channels/{id}` | T | full channel | channel | validation失敗時deadlock候補あり |
| `DELETE /notification-channels/{id}` | T | なし | deleted object | Desktop model/UIなし |
| `POST /notification-channels/{id}/test` | T | なし | delivery | Desktop model/UIなし |
| `GET /notification-deliveries` | T | なし | deliveries | filter/paginationなし |
| `GET /system/status` | T | なし | count/status map | Desktop現行UIは未使用 |

route根拠: `apps/server/cmd/server/main.go:112-951`

## 認証・認可

- `/health`以外のread/writeは同じ認証関数を使います。
- `Authorization: Bearer <token>` と `X-Client-Token` をServerは受理します。
- DesktopとAgentはBearerだけを送ります。
- user、role、session、cookie、read/write scope差はありません。
- per-client tokenのclient ID所有者検査はregister/heartbeatに限られます。
- CORS middleware、静的Web UI、Server内TLS終端はありません。

根拠: `apps/server/cmd/server/main.go:1227-1284`、`apps/desktop-windows/MainWindow.xaml.cs:4899-4925`

## Desktop 1回分の同期順序

1. `POST /clients/register`
2. `POST /clients/heartbeat`
3. `GET /streams`
4. `GET /layouts`
5. `GET /alert-profiles`
6. `GET /clients`
7. `SyncedAt == null` のlocal alertを1件ずつ `POST /client-alerts`
8. `GET /alerts`
9. local JSON保存、status表示更新

通常は直近成功から15秒以内のpollを抑止します。失敗すると最終成功時刻が更新されないため、slow refreshごと、実質約1秒間隔で再試行します。exponential backoff、jitter、最大試行、cancellation、再接続中stateはありません。

根拠: `apps/desktop-windows/MainWindow.xaml.cs:4530-4897`

## 画面更新への対応

| Server情報 | Desktop側の反映 |
|---|---|
| streams | Settings一覧、tile割当、再生・監視対象 |
| layouts | Main/Settings selector、tile grid再構築 |
| alert profiles | Settings profile editor、監視閾値 |
| clients | Settingsのonline/offline、agent/desktop数、active alert数 |
| alerts | Alert History、tile overlay、status frame、alert sound |
| sync成功・失敗 | Settingsのstatus textとclient summary |

## WebSocket・SSEイベント調査

| 項目 | 結果 | 新UI方針 |
|---|---|---|
| WebSocket route | 0件 | 実装済みと仮定しない |
| Desktop `ClientWebSocket` | 0件 | REST pollingを維持する |
| SSE `EventSource` / `text/event-stream` | 0件 | REST pollingを維持する |
| OpenAPI / AsyncAPI | 0件 | PoCで現行DTOのcontract testを追加する |
| push sequence/revision | なし | freshnessとreconciliationをclient側で表現する |

## 現行の状態伝播

```text
Desktop local detector/status action
  -> POST /client-alerts
  -> Server alert aggregation + optional Webhook
  -> Desktop GET /alerts
  -> Alert History / tile overlay / sound

Agent probe failure
  -> POST /client-alerts
  -> Server + optional Webhook
  -> Desktopの次回pollで反映

Agent recovery
  -> GET /alerts
  -> POST /alerts/{id}/resolve
  -> Desktopの次回pollで復旧表示

External config CRUD
  -> Server snapshot
  -> Desktopの次回poll
  -> stream/layout/profile UI再構築
```

Webhookは新規active alert、severity上昇、notification testを外部へ送ります。acknowledge、snooze、resolveそのものではWebhookを送りません。

## 契約上の移行リスク

1. Desktopの設定同期はpullのみで、Settings保存はServer CRUDへ送られません。
2. Serverのstreams/layouts/profilesが空配列の場合、Desktopはlocal collectionをclearしません。
3. Serverはstream URLをmaskするため、新clientにlocal secretがなければ該当streamをdisabled化します。
4. Desktop-onlyのprofile fieldと`alert_muted`はGo contractへ保存されません。
5. 通信断中も旧dataを現在値として表示し、stale/last-successを表示しません。
6. ETag、revision、sequence、idempotency keyがなく、同時編集と順序逆転に弱いです。
7. notification channel PUTはlock取得後のvalidation失敗時にunlockせずreturnする経路があり、新UIから利用する前に別途修正・回帰試験が必要です。
8. Server snapshot内のstream `input_url` とDesktop local token/URLは平文です。

## 未確認

- 実運用で34 routeを利用する外部tool/client
- reverse proxy、TLS、CORS付与、network ACL
- shared token/per-client tokenの実運用
- 複数Desktop同時編集、clock skew、poll負荷
- Server snapshot破損、disk full、DB lockからの復旧
- リポジトリ外のWS/SSE gateway

これらは対応不要ではなく、運用環境の証拠待ちです。
