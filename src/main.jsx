import React from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, CandlestickChart, ShieldCheck, Bell, Settings, Target, Waves, LockKeyhole, Eye, EyeOff, LogOut, LoaderCircle } from 'lucide-react';
import './style.css';

function LoginScreen({ onLogin }) {
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      setPassword('');
      onLogin();
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally { setBusy(false); }
  };
  return <main className="auth-screen">
    <div className="auth-glow auth-glow-one"/><div className="auth-glow auth-glow-two"/>
    <section className="auth-card">
      <div className="auth-brand"><div className="auth-logo"><CandlestickChart size={25}/></div><div><b>TRADER PRO</b><span>CHEMLAL FX</span></div></div>
      <div className="auth-heading"><span className="auth-kicker"><LockKeyhole size={13}/> PRIVATE WORKSPACE</span><h1>Welcome back<span>.</span></h1><p>Sign in to access your personal trading terminal.</p></div>
      <form className="auth-form" onSubmit={submit}>
        <label htmlFor="workspace-password">PERSONAL PASSWORD</label>
        <div className="password-field"><LockKeyhole size={17}/><input id="workspace-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" type="submit" disabled={busy || !password}>{busy ? <><LoaderCircle size={17} className="spin"/> Signing in...</> : <>Access workspace <span>→</span></>}</button>
      </form>
      <div className="auth-security"><ShieldCheck size={16}/><span>Protected session · Secure HttpOnly cookie</span></div>
      <div className="auth-footer"><span>TRADER PRO CHEMLAL</span><span>AUTHORIZED ACCESS ONLY</span></div>
    </section>
  </main>;
}


function App() {
  const [auth, setAuth] = React.useState('checking');
  const [symbol, setSymbol] = React.useState('OANDA:XAUUSD');
  const [timeframe, setTimeframe] = React.useState('15');
  const [tab, setTab] = React.useState('overview');
  const [watchlist, setWatchlist] = React.useState(['XAUUSD','EURUSD','GBPUSD','BTCUSD']);
  const [selectedMarket, setSelectedMarket] = React.useState('XAUUSD');
  React.useEffect(() => {
    let active = true;
    fetch('/api/session', { credentials: 'same-origin' }).then(r => r.json())
      .then(data => { if (active) setAuth(data.authenticated ? 'authenticated' : 'guest'); })
      .catch(() => { if (active) setAuth('guest'); });
    return () => { active = false; };
  }, []);
  const signOut = async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); }
    finally { setAuth('guest'); }
  };
  const markets = [
    {symbol:'XAUUSD',name:'Gold / US Dollar',tv:'OANDA:XAUUSD',type:'METALS',change:'+0.42%',tone:'positive'},
    {symbol:'EURUSD',name:'Euro / US Dollar',tv:'OANDA:EURUSD',type:'FOREX',change:'+0.08%',tone:'positive'},
    {symbol:'GBPUSD',name:'British Pound / US Dollar',tv:'OANDA:GBPUSD',type:'FOREX',change:'−0.13%',tone:'negative'},
    {symbol:'BTCUSD',name:'Bitcoin / US Dollar',tv:'BITSTAMP:BTCUSD',type:'CRYPTO',change:'+1.26%',tone:'positive'}
  ];
  const activeMarket = markets.find(m => m.symbol === selectedMarket) || markets[0];
  const chooseMarket = (m) => { setSelectedMarket(m.symbol); setSymbol(m.tv); setTab('overview'); };
  if (auth === 'checking') return <main className="auth-screen"><div className="auth-loading"><LoaderCircle className="spin" size={25}/><span>SECURING YOUR WORKSPACE</span></div></main>;
  if (auth !== 'authenticated') return <LoginScreen onLogin={() => setAuth('authenticated')} />;
  const nav = [['overview','Overview',Activity],['signals','SMC Signals',Target],['markets','Markets',Waves],['settings','Settings',Settings]];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo-mark"><CandlestickChart/></div><div><b>TRADER PRO</b><span>CHEMLAL FX</span></div></div>
      <div className="side-label">WORKSPACE</div>
      {nav.map(([id,label,Icon])=><button key={id} className={'nav-item '+(tab===id?'active':'')} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}
      <div className="sidebar-bottom"><ShieldCheck size={17}/><span>Private workspace</span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><p className="eyebrow">TRADING TERMINAL / {tab.toUpperCase()}</p><h1>{tab==='overview'?'Market Overview':tab==='signals'?'SMC Strategy Signals':tab==='markets'?'Market Watch':'Workspace Settings'}</h1></div><div className="top-actions"><span className="status"><i/> WORKSPACE SECURE</span><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={18}/></button></div></header>
      {tab === 'overview' && <>
        <section className="welcome-strip"><div><span className="eyebrow">YOUR TRADING DESK</span><h2>Market intelligence, in one place.</h2><p>Track structure, liquidity and key price zones across your watchlist.</p></div><div className="market-chip"><span className="pulse-dot"/><div><b>{activeMarket.symbol}</b><small>CHART SELECTED</small></div></div></section>
        <section className="stats-grid">
          <div className="stat-card"><span>SELECTED MARKET</span><strong>{activeMarket.symbol}</strong><small>{activeMarket.name}</small></div>
          <div className="stat-card"><span>CHART TIMEFRAME</span><strong>{timeframe==='D'?'1 Day':timeframe==='240'?'4 Hours':timeframe+' Minutes'}</strong><small>TradingView widget</small></div>
          <div className="stat-card"><span>MARKET DATA</span><strong className="amber">NOT CONNECTED</strong><small>Broker feed required for live quotes</small></div>
          <div className="stat-card"><span>SMC ENGINE</span><strong className="amber">AWAITING DATA</strong><small>No unverified trade calls</small></div>
        </section>
        <section className="content-grid">
          <div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">MARKET CHART</span><h2>{activeMarket.name}</h2></div><div className="timeframes">{[['1','1m'],['5','5m'],['15','15m'],['60','1h'],['240','4h'],['D','1D']].map(([v,l])=><button className={timeframe===v?'selected':''} onClick={()=>setTimeframe(v)} key={v}>{l}</button>)}</div></div><div className="chart-wrap"><iframe title="TradingView market chart" src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=%230b1728&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1`} /></div><div className="chart-foot"><span><i/> TradingView chart</span><span>Chart provider prices may differ from your broker</span></div></div>
          <div className="panel watch-panel"><div className="panel-head"><div><span className="eyebrow">QUICK ACCESS</span><h2>Market Watch</h2></div><span className="tag">4 SYMBOLS</span></div><div className="watch-list">{markets.filter(m=>watchlist.includes(m.symbol)).map(m=><button key={m.symbol} className={'watch-row '+(selectedMarket===m.symbol?'watch-active':'')} onClick={()=>chooseMarket(m)}><span className="market-symbol">{m.symbol}<small>{m.type}</small></span><span className={'market-change '+m.tone}>{m.change}<small>Indicative UI</small></span></button>)}</div><p className="disclaimer">Percentage labels are sample interface values, not live market quotes. Connect a verified feed to replace them.</p></div>
        </section>
        <section className="panel lower-panel"><div className="panel-head"><div><span className="eyebrow">SMART MONEY CONCEPTS</span><h2>Strategy workspace</h2></div><button className="subtle-btn" onClick={()=>setTab('signals')}>Open SMC analysis <span>→</span></button></div><div className="feature-grid"><div><span className="feature-icon"><Activity/></span><b>Market Structure</b><p>BOS and CHoCH tracking framework.</p></div><div><span className="feature-icon"><Waves/></span><b>Liquidity Map</b><p>Equal highs/lows and liquidity sweep zones.</p></div><div><span className="feature-icon"><Target/></span><b>Trade Planning</b><p>Entry, invalidation and multi-target layout.</p></div></div></section>
      </>}
      {tab === 'signals' && <><section className="stats-grid"><div className="stat-card"><span>MARKET BIAS</span><strong className="amber">WAIT</strong><small>Awaiting verified candle data</small></div><div className="stat-card"><span>TRADE DIRECTION</span><strong>NO SETUP</strong><small>BUY / SELL not confirmed</small></div><div className="stat-card"><span>CONFLUENCE</span><strong>—</strong><small>Not calculated</small></div><div className="stat-card"><span>ACTIVE SYMBOL</span><strong>{activeMarket.symbol}</strong><small>{activeMarket.name}</small></div></section><section className="signal-layout"><div className="panel"><div className="panel-head"><div><span className="eyebrow">SMART MONEY CONCEPTS</span><h2>SMC Strategy Signal</h2></div><span className="tag amber-tag">WAIT</span></div><div className="signal-direction"><div className="signal-icon"><Activity/></div><div><b>WAIT FOR CONFIRMATION</b><small>Analysis will activate after a market feed is connected</small></div></div><div className="meter-label"><span>Strategy confluence</span><b>—</b></div><div className="meter"><i style={{width:'0%'}}/></div><div className="signal-list">{[['Market trend','Pending data'],['BOS / CHoCH','Pending data'],['Liquidity sweep','Pending data'],['Order Blocks','Pending data'],['Fair Value Gap','Pending data'],['Strategy agreement','Not calculated']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div></div><div className="panel"><span className="eyebrow">TRADE PLAN</span><h2 className="trade-plan-title">Execution levels</h2><div className="level-list">{[['ENTRY ZONE','—'],['ENTRY PRICE','—'],['STOP LOSS','—'],['TAKE PROFIT 1','—'],['TAKE PROFIT 2','—'],['TAKE PROFIT 3','—']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div><p className="disclaimer">Levels remain blank until calculated from verified market data. This panel does not generate financial advice.</p></div></section><section className="panel lower-panel"><div className="panel-head"><div><span className="eyebrow">ANALYSIS PIPELINE</span><h2>What the engine will evaluate</h2></div><span className="tag">NOT ACTIVE</span></div><div className="feature-grid"><div><b>01 · Structure</b><p>Trend, swing points, BOS and CHoCH.</p></div><div><b>02 · Liquidity</b><p>Liquidity pools, sweeps and displacement.</p></div><div><b>03 · Confirmation</b><p>OB, FVG, entry risk and target alignment.</p></div></div></section></>}
      {tab === 'markets' && <section className="panel markets-panel"><div className="panel-head"><div><span className="eyebrow">INSTRUMENTS</span><h2>Watchlist markets</h2></div><span className="tag">SELECT TO OPEN CHART</span></div><div className="market-table"><div className="market-table-head"><span>INSTRUMENT</span><span>ASSET CLASS</span><span>INDICATIVE CHANGE</span><span>CHART</span></div>{markets.map(m=><div className="market-table-row" key={m.symbol}><div><b>{m.symbol}</b><small>{m.name}</small></div><span>{m.type}</span><b className={m.tone}>{m.change}</b><button className="subtle-btn" onClick={()=>chooseMarket(m)}>Open chart →</button></div>)}</div><p className="disclaimer">Market change figures are illustrative placeholders, not live prices. Live data integration is a separate next step.</p></section>}
      {tab === 'settings' && <><section className="panel settings-panel"><div className="panel-head"><div><span className="eyebrow">WORKSPACE</span><h2>Connection settings</h2></div><span className="tag">PRIVATE</span></div><div className="settings-row"><div><b>Secure password login</b><p>Server-side authentication and HttpOnly session cookie.</p></div><span className="integration-state connected">Protected</span></div><div className="settings-row"><div><b>TradingView chart</b><p>Embedded chart widget for selected instruments.</p></div><span className="integration-state connected">Available</span></div><div className="settings-row"><div><b>MT5 / ChemlalBridge</b><p>Authenticated Expert Advisor relay for broker quotes.</p></div><span className="integration-state">Not connected</span></div><div className="settings-row"><div><b>Live market data</b><p>Verified Bid/Ask and candle feed from your broker.</p></div><span className="integration-state">Not connected</span></div><div className="settings-row"><div><b>AI / SMC analysis</b><p>Server-side calculations using verified candle data.</p></div><span className="integration-state">Not configured</span></div></section><section className="panel lower-panel"><span className="eyebrow">SECURITY NOTE</span><h2>Keep your workspace protected</h2><p className="settings-note">Your current password and session system remain unchanged. Never place broker credentials, API secrets or private keys in browser-side code.</p></section></>}
      <footer>TRADER PRO CHEMLAL <span>Trading involves risk. Informational workspace only — not financial advice.</span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
