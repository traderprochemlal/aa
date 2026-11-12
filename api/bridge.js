import { hasValidSession } from '../lib/auth.js';

const json = (res, status, body) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(status).json(body);
};

function analyze(candles = []) {
  if (!Array.isArray(candles) || candles.length < 12) return { status: 'WAIT', reason: 'Insufficient candle history' };
  const bars = candles.slice(-80);
  const last = bars[bars.length - 1];
  const prior = bars.slice(0, -1);
  const highs = prior.map(x => Number(x.high)).filter(Number.isFinite);
  const lows = prior.map(x => Number(x.low)).filter(Number.isFinite);
  const swingHigh = Math.max(...highs);
  const swingLow = Math.min(...lows);
  const bullishBos = Number(last.close) > swingHigh;
  const bearishBos = Number(last.close) < swingLow;
  const a = bars[bars.length - 3];
  const bullishFvg = Number(a.high) < Number(last.low);
  const bearishFvg = Number(a.low) > Number(last.high);
  const direction = bullishBos ? 'BULLISH' : bearishBos ? 'BEARISH' : 'RANGE';
  const setup = bullishBos || bearishBos;
  return {
    status: setup ? (bullishBos ? 'BUY' : 'SELL') : 'WAIT',
    direction,
    bos: bullishBos ? 'Bullish BOS' : bearishBos ? 'Bearish BOS' : 'Not confirmed',
    choch: 'Requires confirmed swing sequence',
    liquidity: { rangeHigh: swingHigh, rangeLow: swingLow },
    fvg: bullishFvg ? 'Bullish FVG candidate' : bearishFvg ? 'Bearish FVG candidate' : 'No recent FVG',
    entry: null, stopLoss: null, takeProfit: [],
    confidence: setup ? 55 : 0,
    reason: setup ? 'Close broke the recent 79-candle range. Confirm displacement, retest and risk before trading.' : 'No confirmed close beyond the recent range. WAIT.',
    lastCandleTime: last.time ?? null
  };
}

async function redis(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || ! token) throw new Error('Redis storage is not configured');
  const response = await fetch(url.replace(/\/$/, '') + '/' + command, {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('Redis request failed');
  return response.json();
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const secret = process.env.CHEMLAL_BRIDGE_SECRET;
    const supplied = req.headers['x-bridge-secret'];
    if (!secret || typeof supplied !== 'string' || supplied !== secret) return json(res, 401, { error: 'Invalid bridge secret' });
    const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return null; } })() : req.body;
    if (!body || typeof body.symbol !== 'string' || !Number.isFinite(Number(body.bid)) || !Number.isFinite(Number(body.ask))) return json(res, 400, { error: 'Invalid quote payload' });
    try {
      await redis('set/chemlal:mt5:latest/' + encodeURIComponent(JSON.stringify({ ...body, receivedAt: Date.now() })) + '/EX/25');
      return json(res, 200, { ok: true, receivedAt: Date.now() });
    } catch (error) { return json(res, 503, { error: error.message }); }
  }
  if (req.method === 'GET') {
    if (!hasValidSession(req)) return json(res, 401, { error: 'Authentication required' });
    try {
      const result = await redis('get/chemlal:mt5:latest');
      const data = result.result ? JSON.parse(result.result) : null;
      if (!data) return json(res, 200, { connected: false, reason: 'Waiting for MT5 Expert Advisor' });
      const ageMs = Date.now() - Number(data.receivedAt || 0);
      const tf = data.candles || {};
      const analysis = Object.fromEntries(Object.entries(tf).map(([name, bars]) => [name, analyze(bars)]));
      return json(res, 200, { connected: ageMs < 15000, stale: ageMs >= 15000, ageMs, quote: { symbol: data.symbol, bid: data.bid, ask: data.ask, spread: Number(data.ask) - Number(data.bid), time: data.time }, candles: tf, analysis });
    } catch (error) { return json(res, 503, { connected: false, reason: error.message }); }
  }
  return json(res, 405, { error: 'Method not allowed' });
}
