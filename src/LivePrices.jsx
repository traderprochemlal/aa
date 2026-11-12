import React from 'react';

const symbols = [
  { proName: 'OANDA:XAUUSD', title: 'Gold' },
  { proName: 'OANDA:EURUSD', title: 'EUR/USD' },
  { proName: 'OANDA:GBPUSD', title: 'GBP/USD' },
  { proName: 'OANDA:USDJPY', title: 'USD/JPY' },
  { proName: 'OANDA:AUDUSD', title: 'AUD/USD' },
  { proName: 'OANDA:USDCAD', title: 'USD/CAD' },
  { proName: 'BITSTAMP:BTCUSD', title: 'Bitcoin' },
  { proName: 'BINANCE:ETHUSDT', title: 'Ethereum' },
  { proName: 'TVC:USOIL', title: 'Crude Oil' },
  { proName: 'NASDAQ:NDX', title: 'Nasdaq 100' },
  { proName: 'SP:SPX', title: 'S&P 500' },
  { proName: 'TVC:DXY', title: 'US Dollar Index' }
];

export function LivePrices({ symbol } = {}) {
  const hostRef = React.useRef(null);
  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container';
    widget.style.width = '100%';
    const tape = document.createElement('div');
    tape.className = 'tradingview-widget-container__widget';
    tape.style.width = '100%';
    widget.appendChild(tape);
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.type = 'text/javascript';
    script.text = JSON.stringify({
      symbols: symbol ? symbols.filter(item => item.proName === symbol) : symbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      locale: 'en'
    });
    widget.appendChild(script);
    host.appendChild(widget);
    return () => { host.innerHTML = ''; };
  }, []);

  return <section className="panel live-prices-panel">
    <div className="panel-head live-prices-head">
      <div><span className="eyebrow">LIVE MARKET QUOTES</span><h2>Market Prices</h2></div>
      <span className="tag live-feed-tag"><i/> TRADINGVIEW FEED</span>
    </div>
    <div className="live-ticker" ref={hostRef}/>
    <p className="disclaimer">Quotes are supplied by TradingView and may be delayed or differ from your broker's Bid/Ask prices. Use your broker platform to confirm execution prices.</p>
  </section>;
}
