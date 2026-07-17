# ServerとAgentを使う

IP MultiViewer は Desktop App 単体で使えます。Server と Agent は、設定同期や通知集約、headless 監視が必要な場合だけ追加します。

## Serverの役割

- 設定同期
- alert 集約
- 通知送信
- client heartbeat
- 複数端末の状態共有

## Agentの役割

- Desktop を開いていない環境での reachability probe
- 定期的な stream URL 確認
- Server への状態送信

## 導入方法を選ぶ

| 方法 | 向いている場面 |
| --- | --- |
| Release package | Linux server に systemd service として入れる |
| Docker Compose | 1 host で手早く起動し、reverse proxy の後ろに置く |
| Source build | まだRelease packageがない開発版を検証する |

Release package は `ip-multiviewer_<version>_server_linux_x64.zip` または `ip-multiviewer_<version>_server_linux_arm64.zip` を使います。中には `ip-multiviewer-server`、`ip-multiviewer-agent`、systemd unit例、env例、Docker Compose例が入っています。

## Release packageを取得して検証する

`ip-multiviewer` repository では、tag `v*` のpushまたは GitHub Actions の手動実行で Server / Agent package を作成します。workflow は `.github/workflows/release-server.yml`、手元で同じpackageを作るscriptは `scripts/package-server.ps1` です。

GitHub Release から取得する場合は、対象versionのassetから次をダウンロードします。

- `ip-multiviewer_<version>_server_linux_x64.zip`
- `ip-multiviewer_<version>_server_linux_x64.zip.sha256`
- ARM64 hostでは `linux_arm64` のzipとsha256

展開前にchecksumを確認します。

```bash
sha256sum -c ip-multiviewer_<version>_server_linux_x64.zip.sha256
```

GitHub Actions の手動実行で確認する場合は、`Server Release Packages` workflow を開き、`version` に `v1.2.3` のような値を入れて実行します。成功すると workflow artifact として `artifacts/server/*` 相当のzipとsha256が残ります。

手元でpackageだけ作る場合は、`ip-multiviewer` repository root で次を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-server.ps1 -Version v0.0.0-local -Runtime linux-x64,linux-arm64 -OutputDir artifacts/server
```

作成後、`artifacts/server` にzipと `.sha256` があることを確認します。

## envで設定するもの

| 項目 | 目的 |
| --- | --- |
| `MULTIVIEWER_BIND_ADDR` | Server の待ち受け |
| `MULTIVIEWER_DATA_DIR` | JSON snapshot 保存先 |
| `DATABASE_URL` | SQLite 保存先 |
| `MULTIVIEWER_CLIENT_TOKEN` | 単一 token 運用 |
| `MULTIVIEWER_CLIENT_TOKENS` | clientごとの token 運用 |
| `MULTIVIEWER_CLIENT_OFFLINE_AFTER_SEC` | heartbeat offline 判定 |
| `MULTIVIEWER_SECRET_ENCRYPTION_KEY` | secret 暗号化 |
| `MULTIVIEWER_SERVER_URL` | Agent が接続する Server URL |
| `MULTIVIEWER_AGENT_CLIENT_ID` | Agent の識別子 |
| `MULTIVIEWER_AGENT_INTERVAL_SEC` | Agent の確認間隔 |

## Release packageでServerを入れる

Linux host 上で、Release package を展開したディレクトリから実行します。`<version>` と `<runtime>` は取得したpackage名に合わせてください。

```bash
unzip ip-multiviewer_<version>_server_<runtime>.zip -d ip-multiviewer-server
cd ip-multiviewer-server
```

service user、データ保存先、env保存先を作ります。

```bash
sudo useradd --system --home /var/lib/ip-multiviewer --shell /usr/sbin/nologin ip-multiviewer
sudo install -d -o ip-multiviewer -g ip-multiviewer -m 0750 /var/lib/ip-multiviewer
sudo install -d -m 0750 /etc/ip-multiviewer
```

Server binary、env、systemd unitを配置します。

```bash
sudo install -m 0755 ip-multiviewer-server /usr/local/bin/ip-multiviewer-server
sudo install -m 0640 deploy/server.env.example /etc/ip-multiviewer/server.env
sudo install -m 0644 systemd/ip-multiviewer-server.service.example /etc/systemd/system/ip-multiviewer-server.service
```

`/etc/ip-multiviewer/server.env` を編集します。最低限、client token と secret encryption key はplaceholderのままにしません。

```text
MULTIVIEWER_BIND_ADDR=127.0.0.1:8080
MULTIVIEWER_DATA_DIR=/var/lib/ip-multiviewer
DATABASE_URL=sqlite:///var/lib/ip-multiviewer/ip-multiviewer.db
MULTIVIEWER_CLIENT_TOKEN=<LONG_RANDOM_TOKEN>
MULTIVIEWER_SECRET_ENCRYPTION_KEY=<64_HEX_CHARS_OR_BASE64_32_BYTES>
```

起動します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ip-multiviewer-server
sudo systemctl status ip-multiviewer-server
curl http://127.0.0.1:8080/health
```

`/health` が `status: ok` を返せば、Server process は起動しています。

## DesktopからServerへ接続する

1. Desktop の Settings を開きます。
2. `Server URL` に Server のURLを入れます。
3. `Client Token` に `/etc/ip-multiviewer/server.env` の `MULTIVIEWER_CLIENT_TOKEN` と同じ値を入れます。
4. `Server sync` を有効にします。
5. `Apply` を押します。
6. `server sync: ok` と heartbeat が更新されることを確認します。

Serverを同じhost内だけで使う場合は `127.0.0.1:8080` bind のまま、reverse proxy からだけ到達させます。LANやインターネットに出す場合は、HTTPS、firewall、token運用を先に決めてください。

## Agentを入れる

Agent は Desktop を開かないhostからServerへheartbeatや簡易probeを送るためのものです。Release packageを展開したディレクトリで、Agent binary、env、systemd unitを配置します。

```bash
sudo install -m 0755 ip-multiviewer-agent /usr/local/bin/ip-multiviewer-agent
sudo install -m 0640 deploy/agent.env.example /etc/ip-multiviewer/agent.env
sudo install -m 0644 systemd/ip-multiviewer-agent.service.example /etc/systemd/system/ip-multiviewer-agent.service
```

`/etc/ip-multiviewer/agent.env` を編集します。

```text
MULTIVIEWER_SERVER_URL=https://ip-multiviewer.example.com
MULTIVIEWER_AGENT_CLIENT_ID=agent-01
MULTIVIEWER_AGENT_NAME="IP MultiViewer Agent 01"
MULTIVIEWER_CLIENT_TOKEN=<SERVER_CLIENT_TOKEN>
MULTIVIEWER_AGENT_INTERVAL_SEC=30
MULTIVIEWER_AGENT_PROBE_TIMEOUT_SEC=5
```

起動前に1回だけ実行して接続を確認できます。

```bash
sudo sh -c 'set -a; . /etc/ip-multiviewer/agent.env; set +a; MULTIVIEWER_AGENT_RUN_ONCE=true /usr/local/bin/ip-multiviewer-agent'
```

問題なければserviceとして起動します。

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ip-multiviewer-agent
sudo systemctl status ip-multiviewer-agent
```

## Docker Composeで起動する

source checkout またはRelease packageに含まれる `docker-compose.prod.yml` を使います。imageをまだ作っていない場合は先にbuildします。

```bash
cp .env.example .env
docker build -t ip-multiviewer-server:latest .
docker compose -f docker-compose.prod.yml up -d
curl http://127.0.0.1:8080/health
```

`.env` では `MULTIVIEWER_CLIENT_TOKEN` と `MULTIVIEWER_SECRET_ENCRYPTION_KEY` を必ず変更します。`docker-compose.prod.yml` は host の `127.0.0.1:8080` にだけ公開する前提です。外部公開は reverse proxy 側でHTTPSを終端してください。

## Source buildで起動する

開発版を直接検証する場合だけ使います。

```bash
go test ./...
go build -o bin/ip-multiviewer-server ./apps/server/cmd/server
go build -o bin/ip-multiviewer-agent ./apps/agent/cmd/agent
MULTIVIEWER_BIND_ADDR=127.0.0.1:8080 MULTIVIEWER_DATA_DIR=./data ./bin/ip-multiviewer-server
```

配布用packageを手元で作る場合は次を使います。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package-server.ps1 -Version v0.0.0-local -Runtime linux-x64
```

## 起動後に確認すること

1. `curl http://127.0.0.1:8080/health` が成功する。
2. Desktop の Settings で `server sync: ok` になる。
3. `curl -H "Authorization: Bearer <CLIENT_TOKEN>" http://127.0.0.1:8080/system/status` で `state_persistence` が `sqlite` または `json_snapshot` になっている。
4. Agentを使う場合は、Server側のclient heartbeatにAgentが出る。
5. 通知channelを使う場合は、secret encryption keyが設定されている。

## 注意

client token、stream URL、Webhook URL は公開しないでください。Server を公開する場合は HTTPS を使い、不要な port を閉じます。packageやenv例をそのまま本番値として使わず、必ずtokenと暗号化keyを入れ替えてください。

詳しいenv一覧は [設定ファイルとenvリファレンス](/reference/config-and-env) を確認してください。
