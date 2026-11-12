import { hasValidSession } from '../lib/auth.js';

const SYMBOLS = {
  'XAUUSD': 'XAUUSD=X',
  'OANDA:XAUUSD': 'XAUUSD=X',
  'EURUSD': 'EURUSD=X',
  'OANDA:EURUSD': 'EURUSD=X',
  'GBPUSD': 'GBPUSD=X',
  'OANDA:GBPUSD': 'GBPUSD=X',
  'BTCUSD': 'BTC-USD',
  'BITSTAMP:BTCUSD': 'BTC-USD',
  'ETHUSDT': 'ETH-USD',
  'BINANCE:ETHUSDT': 'ETH-USD'
};
const INTERVALS = {
  '1': { interval: '1m', range: '1d' },
  '5': { interval: '5m', range: '5d' },
  '15': { interval: '15m', range: '5d' },
  '60': { interval: '60m', range: '1mo' },
  '240': { interval: '60m', range: '3mo', aggregate: 4 },
  'D': { interval: '1d', range: '6mo' }
};
const send = (res, status, body) => {
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=5');
  return res.status(status).json(body);
};

function analyze(candles) {
  if (!Array.isArray(candles) || candles.length < 30) {
    return { status: 'WAIT', direction: 'UNAVAILABLE', confidence: 0, reason: 'Not enough valid candles yet.' };
  }
  const bars = candles.slice(-100);
  const last = bars[bars.length - 1];
  const prior = bars.slice(0, -1);
  const highs = prior.slice(-30).map(x => x.high);
  const lows = prior.slice(-30).map(x => x.low);
  const swingHigh = Math.max(...highs);
  const swingLow = Math.min(...lows);
  const bullishBos = last.close > swingHigh;
  const bearishBos = last.close < swingLow;
  const avgRange = prior.slice(-20).reduce((sum, x) => sum + (x.high - x.low), 0) / 20;
  const candleRange = last.high - last.low;
  const bullishDisplacement = last.close > last.open && candleRange > avgRange * 1.25;
  const bearishDisplacement = last.close < last.open && candleRange > avgRange * 1.25;
  const a = bars[bars.length - 3], b = bars[bars.length - 2];
  const bullishFvg = a.high < last.low;
  const bearishFvg = a.low > last.high;
  const bullishSweep = last.low < Math.min(...prior.slice(-10).map(x => x.low)) && last.close > last.open;
  const bearishSweep = last.high > Math.max(...prior.slice(-10).map(x => x.high)) && last.close < last.open;
  const bullish = bullishBos && bullishDisplacement && (bullishFvg || bullishSweep);
  const bearish = bearishBos && bearishDisplacement && (bearishFvg || bearishSweep);
  const direction = bullish ? 'BULLISH' : bearish ? 'BEARISH' : last.close >= last.open ? 'BULLISH BIAS' : 'BEARISH BIAS';
  const status = bullish ? 'BUY' : bearish ? 'SELL' : 'WAIT';
  const entry = bullish ? last.close : bearish ? last.close : null;
  const stopLoss = bullish ? Math.min(last.low, swingHigh) : bearish ? Math.max(last.high, swingLow) : null;
  const risk = entry !== null ? Math.abs(entry - stopLoss) : 0;
  const takeProfit = risk > 0 ? [1, 2, 3].map(r => Number((entry + (bullish ? 1 : -1) * risk * r).toFixed(8))) : [];
  const zoneLow = bullishFvg ? a.high : bearishFvg ? last.high : null;
  const zoneHigh = bullishFvg ? last.low : bearishFvg ? a.low : null;
  return {
    status, direction,
    bos: bullishBos ? 'Bullish BOS' : bearishBos ? 'Bearish BOS' : 'No range break',
    choch: bullishBos ? 'Bullish structure break candidate' : bearishBos ? 'Bearish structure break candidate' : 'No confirmed CHoCH',
    liquidity: { rangeHigh: swingHigh, rangeLow: swingLow, sweep: bullishSweep ? 'Sell-side sweep candidate' : bearishSweep ? 'Buy-side sweep candidate' : 'No sweep detected' },
    fvg: bullishFvg ? 'Bullish FVG candidate' : bearishFvg ? 'Bearish FVG candidate' : 'No recent FVG',
    orderBlock: bullish ? 'Last bearish candle before bullish displacement (candidate)' : bearish ? 'Last bullish candle before bearish displacement (candidate)' : 'No confirmed order block',
    entry, entryZone: zoneLow !== null ? [Math.min(zoneLow, zoneHigh), Math.max(zoneLow, zoneHigh)] : null,
    stopLoss, takeProfit,
    confidence: bullish || bearish ? Math.min(82, 58 + (bullishFvg || bearishFvg ? 8 : 0) + (bullishSweep || bearishSweep ? 8 : 0)) : 0,
    reason: bullish ? 'Bullish range break with displacement and an FVG/sweep confluence. Wait for a retest; this is a rule-based candidate.' : bearish ? 'Bearish range break with displacement and an FVG/sweep confluence. Wait for a retest; this is a rule-based candidate.' : 'No complete BOS + displacement + FVG/sweep confluence. WAIT.',
    lastCandleTime: last.time
  };
}

function aggregateFourHours(candles) {
  const groups = [];
  for (let i = 0; i < candles.length; i += 4) {
    const part = candles.slice(i, i + 4);
    if (part.length !== 4) continue;
    groups.push({ time: part[0].time, open: part[0].open, high: Math.max(...part.map(x => x.high)), low: Math.min(...part.map(x => x.low)), close: part[3].close, volume: part.reduce((n, x) => n + (x.volume || 0), 0) });
  }
  return groups;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });
  if (!hasValidSession(req)) return send(res, 401, { error: 'Authentication required' });
  const symbol = String(req.query?.symbol || 'XAUUSD').toUpperCase();
  const timeframe = String(req.query?.timeframe || '15');
  const yahooSymbol = SYMBOLS[symbol];
  const config = INTERVALS[timeframe];
  if (!yahooSymbol || !config) return send(res, 400, { error: 'Unsupported symbol or timeframe', supportedSymbols: Object.keys(SYMBOLS), supportedTimeframes: Object.keys(INTERVALS) });
  try {
    const url = new URL('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(yahooSymbol));
    url.searchParams.set('range', config.range);
    url.searchParams.set('interval', config.interval);
    url.searchParams.set('includePrePost', 'true');
    let response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ChemlalProMarketData/1.0' } });
    if (!response.ok) {
      const fallback = new URL(url.toString().replace('query1.finance.yahoo.com', 'query2.finance.yahoo.com'));
      response = await fetch(fallback, { headers: { 'User-Agent': 'Mozilla/5.0 ChemlalProMarketData/1.0' } });
    }
    if (!response.ok) throw new Error('Free market-data provider returned HTTP ' + response.status);
    const payload = await response.json();
    const result = payload?.chart?.result?.[0];
    if (!result) throw new Error(payload?.chart?.error?.description || 'No candle data returned by provider');
    const quote = result.indicators?.quote?.[0] || {};
    const candles = (result.timestamp || []).map((time, i) => ({
      time: time * 1000,
      open: Number(quote.open?.[i]), high: Number(quote.high?.[i]),
      low: Number(quote.low?.[i]), close: Number(quote.close?.[i]),
      volume: Number(quote.volume?.[i] || 0)
    })).filter(x => [x.open, x.high, x.low, x.close].every(Number.isFinite) && x.high >= x.low);
    const normalized = config.aggregate ? aggregateFourHours(candles) : candles;
    if (normalized.length < 30) throw new Error('Provider returned too few candles for this timeframe');
    return send(res, 200, {
      connected: true, source: 'Yahoo Finance chart data (free public endpoint)',
      symbol, providerSymbol: yahooSymbol, timeframe,
      price: normalized[normalized.length - 1].close,
      candles: normalized.slice(-300), analysis: analyze(normalized),
      updatedAt: Date.now(), delayed: true
    });
  } catch (error) {
    return send(res, 502, { connected: false, source: 'Free public market-data endpoint', error: error.message });
  }
}
