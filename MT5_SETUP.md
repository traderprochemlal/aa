# CHEMLAL PRO — MT5 live bridge setup

The website code now includes a private MT5 ingestion endpoint and an Expert Advisor source file. Live broker data will appear only after the hosting environment and MT5 terminal are configured.

## 1. Configure private Redis storage

Create a free Upstash Redis database and copy its REST URL and REST token. In Vercel → Project → Settings → Environment Variables, add:

- `KV_REST_API_URL` = Upstash REST URL
- `KV_REST_API_TOKEN` = Upstash REST token
- `CHEMLAL_BRIDGE_SECRET` = a long random secret (at least 32 characters)

Add them to Production (and Preview if you use Preview deployments), save, then redeploy. Do not put these values in frontend code or commit them to GitHub.

## 2. Install the MT5 Expert Advisor

1. Download `mt5/ChemlalProBridge.mq5` from this repository.
2. Open MetaTrader 5 → File → Open Data Folder → MQL5 → Experts and copy the file there.
3. Open it in MetaEditor and compile it.
4. In MT5 → Tools → Options → Expert Advisors, enable WebRequest for:
   `https://traderprochemlalv2.vercel.app`
5. Attach **CHEMLAL PRO - MT5 Live Bridge** to the chart/symbol you want to stream.
6. Set `BridgeSecret` to the exact same value as Vercel's `CHEMLAL_BRIDGE_SECRET`.
7. Enable Algo Trading and keep MT5 running with the chart open.

The EA publishes the chart symbol's Bid/Ask and M5, M15, H1 and H4 candles every two seconds. The endpoint expires data after 25 seconds; the dashboard marks the feed offline if it becomes older than 15 seconds.

## 3. Verify

Sign in to the website and open Settings. MT5 / ChemlalBridge should turn green after the first accepted POST. The dashboard polls the authenticated GET endpoint every 2.5 seconds.

## Important limitations

- The bridge currently streams the symbol of the chart where the EA is attached. To stream another instrument, attach the EA to that instrument's chart too; the latest active publisher is displayed.
- The first SMC pass reports recent range breakouts and three-candle FVG candidates. It is rule-based, not an AI model, and is not a complete BOS/CHoCH/Order Block engine.
- TradingView's embedded ticker is a separate provider feed and is not the broker's executable Bid/Ask.
- Never share your bridge secret or broker credentials. No order placement is performed by this bridge.
