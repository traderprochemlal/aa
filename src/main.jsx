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
  const [watchlist, setWatchlist] = React.useState('XAUUSD');
  React.useEffect(() => {
    let active = true;
    fetch('/api/session', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => { if (active) setAuth(data.authenticated ? 'authenticated' : 'guest'); })
      .catch(() => { if (active) setAuth('guest'); });
    return () => { active = false; };
  }, []);
  const signOut = async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); }
    finally { setAuth('guest'); }
  };
  if (auth === 'checking') return <main className="auth-screen"><div className="auth-loading"><LoaderCircle className="spin" size={25}/><span>SECURING YOUR WORKSPACE</span></div></main>;
  if (auth !== 'authenticated') return <LoginScreen onLogin={() => setAuth('authenticated')} />;
  const tvSymbol = symbol;
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="logo-mark"><CandlestickChart/></div><div><b>TRADER PRO</b><span>CHEMLAL FX</span></div></div><div className="side-label">WORKSPACE</div>{[['overview','Overview',Activity],['signals','SMC Signals',Target],['markets','Markets',Waves],['settings','Settings',Settings]].map(([id,label,Icon])=><button key={id} className={'nav-item '+(tab===id?'active':'')} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}<div className="sidebar-bottom"><ShieldCheck size={17}/><span>Workspace starter</span></div></aside>
    <main className="main"><header className="topbar"><div><p className="eyebrow">TRADING TERMINAL / {tab.toUpperCase()}</p><h1>{tab==='overview'?'Market Overview':tab==='signals'?'SMC Strategy Signals':tab==='markets'?'Markets':'Settings'}</h1></div><div className="top-actions"><span className="status"><i/> UI ONLINE</span><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={18}/></button></div></header>
    <section className="stats-grid"><div className="stat-card"><span>MARKET</span><strong>GOLD / USD</strong><small>TradingView chart</small></div><div className="stat-card"><span>SELECTED TIMEFRAME</span><strong>{timeframe} min</strong><small>Change below chart</small></div><div className="stat-card"><span>DATA CONNECTION</span><strong className="amber">NOT CONNECTED</strong><small>Live broker feed not configured</small></div><div className="stat-card"><span>STRATEGY ENGINE</span><strong className="amber">STARTER MODE</strong><small>Signals need market data</small></div></section>
    <section className="content-grid"><div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">LIVE CHART WIDGET</span><h2>Gold Spot · XAUUSD</h2></div><div className="timeframes">{[['1','1m'],['5','5m'],['15','15m'],['60','1h'],['240','4h'],['D','1D']].map(([v,l])=><button className={timeframe===v?'selected':''} onClick={()=>setTimeframe(v)} key={v}>{l}</button>)}</div></div><div className="chart-wrap"><iframe title="TradingView XAUUSD chart" src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=${timeframe}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=%230b1728&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1& studies=[]`} /></div><div className="chart-foot"><span><i/> TradingView widget</span><span>Prices and availability depend on selected data provider</span></div></div>
    <div className="panel signal-panel"><div className="panel-head"><div><span className="eyebrow">SMART MONEY CONCEPTS</span><h2>SMC Strategy Signal</h2></div><span className="tag amber-tag">WAIT</span></div><div className="signal-direction"><div className="signal-icon"><Activity/></div><div><b>WAIT FOR CONFIRMATION</b><small>No verified live feed connected</small></div></div><div className="meter-label"><span>Confluence strength</span><b>—</b></div><div className="meter"><i style={{width:'0%'}}/></div><div className="signal-list">{['Market structure · BOS / CHoCH','Liquidity sweep','Order Blocks','Fair Value Gap','Entry zone / Stop Loss','TP1 · TP2 · TP3'].map(x=><div key={x}><span>{x}</span><b>Pending data</b></div>)}</div><p className="disclaimer">No trade recommendation is generated until a reliable market-data source and strategy calculations are configured.</p></div></section>
    <section className="panel lower-panel"><div className="panel-head"><div><span className="eyebrow">NEXT INTEGRATIONS</span><h2>Connect your trading stack</h2></div><span className="tag">SETUP REQUIRED</span></div><div className="integration-grid"><div><b>MT5 / ChemlalBridge</b><p>Expert Advisor connection and authenticated signal relay.</p><span className="integration-state">Not connected</span></div><div><b>Market data API</b><p>Real-time quotes, candles and symbol mapping.</p><span className="integration-state">Not connected</span></div><div><b>AI analysis</b><p>Server-side analysis using verified candles and SMC rules.</p><span className="integration-state">Not configured</span></div></div></section>
    <footer>TRADER PRO CHEMLAL <span>Trading involves risk. This dashboard is an informational starter, not financial advice.</span></footer></main></div>
}
createRoot(document.getElementById('root')).render(<App/>);
