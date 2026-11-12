import React from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, CandlestickChart, ShieldCheck, Bell, Settings, Target, Waves, LockKeyhole, Eye, EyeOff, LogOut, LoaderCircle, Calculator, BookOpen, Radar } from 'lucide-react';
import { RiskManager, TradeJournal, SMCIntelligence } from './AdvancedTools.jsx';
import { LivePrices } from './LivePrices.jsx';
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
  const [language, setLanguage] = React.useState('EN');
  const [bridge, setBridge] = React.useState({connected:false, loading:false});
  React.useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),30000);return ()=>clearInterval(timer);},[]);
  const labels={EN:{overview:'Overview',signals:'SMC Signals',smc:'SMC Intelligence',risk:'Risk Manager',journal:'Trade Journal',markets:'Markets',settings:'Settings',secure:'WORKSPACE SECURE',title:'Market Overview'},FR:{overview:'Vue générale',signals:'Signaux SMC',smc:'Intelligence SMC',risk:'Gestion du risque',journal:'Journal de trading',markets:'Marchés',settings:'Paramètres',secure:'ESPACE SÉCURISÉ',title:'Vue du marché'},AR:{overview:'نظرة عامة',signals:'إشارات SMC',smc:'تحليل SMC',risk:'إدارة المخاطر',journal:'سجل التداول',markets:'الأسواق',settings:'الإعدادات',secure:'مساحة عمل آمنة',title:'نظرة عامة على السوق'}};
  const t=labels[language];
  const utcHour=new Date(clock).getUTCHours();
  const sessions=[{name:'ASIA',active:utcHour>=0&&utcHour<9},{name:'LONDON',active:utcHour>=7&&utcHour<16},{name:'NEW YORK',active:utcHour>=13&&utcHour<22}];
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
  const nav = [['overview',t.overview,Activity],['signals',t.signals,Target],['smc-tools',t.smc,Radar],['risk',t.risk,Calculator],['journal',t.journal,BookOpen],['markets',t.markets,Waves],['settings',t.settings,Settings]];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="logo-mark"><CandlestickChart/></div><div><b>TRADER PRO</b><span>CHEMLAL FX</span></div></div>
      <div className="side-label">WORKSPACE</div>
      {nav.map(([id,label,Icon])=><button key={id} className={'nav-item '+(tab===id?'active':'')} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}
      <div className="sidebar-bottom"><ShieldCheck size={17}/><span>Private workspace</span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="topbar-title"><p className="eyebrow">TRADING TERMINAL / {tab.toUpperCase()}</p><h1>{tab==='overview'?t.title:tab==='signals'?'SMC Strategy Signals':tab==='markets'?'Market Watch':tab==='settings'?t.settings:tab==='risk'?t.risk:tab==='journal'?t.journal:t.smc}</h1></div><div className="top-brand-center"><span className="top-brand-mark"><CandlestickChart size={18}/></span><b>CHEMLAL <em>PRO</em></b></div><div className="top-actions"><select className="language-select" aria-label="Language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="EN">EN</option><option value="FR">FR</option><option value="AR">AR</option></select><span className="status"><i/> {t.secure}</span><button className="icon-btn" title="Sign out" onClick={signOut}><LogOut size={18}/></button></div></header><section className="market-session-strip"><div className="bridge-live-state"><i className="is-live"/><span>MARKET DATA · TRADINGVIEW WIDGETS</span></div><div className="session-items">{sessions.map(s=><span key={s.name} className={s.active?'session-active':''}><i/>{s.name}</span>)}</div></section>
      {tab === 'overview' && <>
        <section className="welcome-strip"><div><span className="eyebrow">YOUR TRADING DESK</span><h2>Market intelligence, in one place.</h2><p>Track structure, liquidity and key price zones across your watchlist.</p></div><div className="market-chip"><span className="pulse-dot"/><div><b>{activeMarket.symbol}</b><small>CHART SELECTED</small></div></div></section>
        <LivePrices />
        <section className="stats-grid">
          <div className="stat-card"><span>SELECTED MARKET</span><strong>{activeMarket.symbol}</strong><small>{activeMarket.name}</small></div>
          <div className="stat-card"><span>CHART TIMEFRAME</span><strong>{timeframe==='D'?'1 Day':timeframe==='240'?'4 Hours':timeframe+' Minutes'}</strong><small>TradingView widget</small></div>
          <div className="stat-card"><span>PRICE SOURCE</span><strong className="positive">TRADINGVIEW</strong><small>Embedded market widgets</small></div>
          <div className="stat-card"><span>SMC ENGINE</span><strong className="amber">AWAITING DATA</strong><small>No unverified trade calls</small></div>
        </section>
        <section className="content-grid">
          <div className="panel chart-panel"><div className="panel-head"><div><span className="eyebrow">MARKET CHART</span><h2>{activeMarket.name}</h2></div><div className="timeframes">{[['1','1m'],['5','5m'],['15','15m'],['60','1h'],['240','4h'],['D','1D']].map(([v,l])=><button className={timeframe===v?'selected':''} onClick={()=>setTimeframe(v)} key={v}>{l}</button>)}</div></div><div className="chart-wrap"><iframe title="TradingView market chart" src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=%230b1728&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1`} /></div><div className="chart-foot"><span><i/> TradingView chart</span><span>Chart provider prices may differ from your broker</span></div></div>
          <div className="panel watch-panel"><div className="panel-head"><div><span className="eyebrow">QUICK ACCESS</span><h2>Market Watch</h2></div><span className="tag">4 SYMBOLS</span></div><div className="watch-list">{markets.filter(m=>watchlist.includes(m.symbol)).map(m=><button key={m.symbol} className={'watch-row '+(selectedMarket===m.symbol?'watch-active':'')} onClick={()=>chooseMarket(m)}><span className="market-symbol">{m.symbol}<small>{m.type}</small></span><span className="market-change positive">TV CHART<small>Open market chart</small></span></button>)}</div><p className="disclaimer">Market quotes are displayed by TradingView widgets. Check your broker for executable prices.</p></div>
        </section>
        <section className="panel lower-panel"><div className="panel-head"><div><span className="eyebrow">SMART MONEY CONCEPTS</span><h2>Strategy workspace</h2></div><button className="subtle-btn" onClick={()=>setTab('signals')}>Open SMC analysis <span>→</span></button></div><div className="feature-grid"><div><span className="feature-icon"><Activity/></span><b>Market Structure</b><p>BOS and CHoCH tracking framework.</p></div><div><span className="feature-icon"><Waves/></span><b>Liquidity Map</b><p>Equal highs/lows and liquidity sweep zones.</p></div><div><span className="feature-icon"><Target/></span><b>Trade Planning</b><p>Entry, invalidation and multi-target layout.</p></div></div></section>
      </>}
      {tab === 'signals' && <>
        <LivePrices symbol={activeMarket.tv} />
        <section className="panel chart-panel smc-live-chart-panel">
          <div className="panel-head"><div><span className="eyebrow">LIVE TRADINGVIEW MARKET</span><h2>{activeMarket.name} · {activeMarket.symbol}</h2></div><div className="timeframes">{[['1','1m'],['5','5m'],['15','15m'],['60','1h'],['240','4h'],['D','1D']].map(([v,l])=><button className={timeframe===v?'selected':''} onClick={()=>setTimeframe(v)} key={v}>{l}</button>)}</div></div>
          <div className="chart-wrap"><iframe title="TradingView SMC signal market chart" src={`https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(activeMarket.tv)}&interval=${timeframe}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=%230b1728&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hideideas=1`} /></div>
          <div className="chart-foot"><span><i/> TradingView chart · {activeMarket.tv}</span><span>Reference prices; broker execution may differ</span></div>
        </section>
        <section className="smc-summary-grid">
          <div className="smc-summary-card"><span>MARKET DIRECTION</span><div className="direction-options"><b className="bullish">BULLISH</b><b className="bearish">BEARISH</b></div><small>Awaiting verified candle data</small></div>
          <div className="smc-summary-card"><span>TRADE DECISION</span><strong className="wait-text">WAIT</strong><small>No confirmed BUY / SELL setup</small></div>
          <div className="smc-summary-card"><span>SIGNAL STRENGTH</span><strong>—</strong><div className="strength-track"><i style={{width:'0%'}}/></div><small>Not calculated</small></div>
          <div className="smc-summary-card"><span>STRATEGY AGREEMENT</span><strong>—</strong><small>Confluence unavailable</small></div>
        </section>
        <section className="signal-layout smc-main-grid">
          <div className="panel">
            <div className="panel-head"><div><span className="eyebrow">SMART MONEY CONCEPTS</span><h2>SMC Strategy Signal · {activeMarket.symbol}</h2></div><span className="tag amber-tag">WAIT</span></div>
            <div className="signal-direction"><div className="signal-icon"><Activity/></div><div><b>WAIT FOR CONFIRMATION</b><small>Signal generation is paused until a verified live candle feed is connected</small></div></div>
            <div className="smc-section-title">MARKET STRUCTURE</div>
            <div className="smc-metric-grid">
              <div><span>Trend direction</span><b>Undetermined</b></div><div><span>BOS</span><b>Not detected</b></div><div><span>CHoCH</span><b>Not detected</b></div><div><span>Liquidity</span><b>Not evaluated</b></div>
            </div>
            <div className="smc-section-title">INSTITUTIONAL ZONES</div>
            <div className="smc-metric-grid">
              <div><span>Order Blocks</span><b>Awaiting data</b></div><div><span>Fair Value Gap</span><b>Awaiting data</b></div><div><span>Liquidity sweep</span><b>Awaiting data</b></div><div><span>Displacement</span><b>Awaiting data</b></div>
            </div>
            <div className="smc-section-title">WHY THIS SIGNAL?</div>
            <div className="signal-reason"><b>Current reason: WAIT</b><p>There is no verified broker candle feed available to confirm market structure, liquidity events or strategy confluence. The system therefore avoids inventing a bullish/bearish bias or issuing a BUY/SELL call.</p></div>
          </div>
          <div className="panel">
            <span className="eyebrow">TRADE MANAGEMENT</span><h2 className="trade-plan-title">Entry &amp; target levels</h2>
            <div className="level-list">{[['ENTRY ZONE','—'],['ENTRY PRICE','—'],['STOP LOSS','—'],['TAKE PROFIT 1','—'],['TAKE PROFIT 2','—'],['TAKE PROFIT 3','—']].map(([a,b])=><div key={a}><span>{a}</span><b>{b}</b></div>)}</div>
            <p className="disclaimer">Entry and target levels will be calculated only after a valid setup is detected from real market candles. No trade levels are fabricated.</p>
          </div>
        </section>
        <section className="panel lower-panel">
          <div className="panel-head"><div><span className="eyebrow">DECISION JOURNAL</span><h2>Last 50 strategy decisions</h2></div><span className="tag">0 / 50 RECORDS</span></div>
          <div className="history-empty"><div className="history-empty-icon"><Activity size={20}/></div><b>No strategy decisions recorded yet</b><p>Once the verified data feed and SMC calculation engine are connected, every BUY, SELL or WAIT decision will be saved with its reason, direction, entry, stop loss and TP1–TP3 levels. The journal will retain the latest 50 decisions.</p></div>
        </section>
      </>}
      {tab === 'smc-tools' && <SMCIntelligence market={activeMarket.symbol} bridge={bridge} />}
      {tab === 'risk' && <RiskManager market={activeMarket.symbol} />}
      {tab === 'journal' && <TradeJournal market={activeMarket.symbol} />}
      {tab === 'markets' && <><LivePrices /><section className="panel markets-panel"><div className="panel-head"><div><span className="eyebrow">INSTRUMENTS</span><h2>Watchlist markets</h2></div><span className="tag">SELECT TO OPEN CHART</span></div><div className="market-table"><div className="market-table-head"><span>INSTRUMENT</span><span>ASSET CLASS</span><span>PRICE SOURCE</span><span>CHART</span></div>{markets.map(m=><div className="market-table-row" key={m.symbol}><div><b>{m.symbol}</b><small>{m.name}</small></div><span>{m.type}</span><b className="positive">TradingView</b><button className="subtle-btn" onClick={()=>chooseMarket(m)}>Open chart →</button></div>)}</div><p className="disclaimer">Use the Market Prices ticker above for current provider quotes. TradingView quotes may be delayed and can differ from broker execution prices.</p></section></>}
      {tab === 'settings' && <><section className="panel settings-panel"><div className="panel-head"><div><span className="eyebrow">WORKSPACE</span><h2>Connection settings</h2></div><span className="tag">PRIVATE</span></div><div className="settings-row"><div><b>Secure password login</b><p>Server-side authentication and HttpOnly session cookie.</p></div><span className="integration-state connected">Protected</span></div><div className="settings-row"><div><b>TradingView chart</b><p>Embedded chart widget for selected instruments.</p></div><span className="integration-state connected">Available</span></div><div className="settings-row"><div><b>TradingView market widgets</b><p>Market ticker and embedded charts provide the displayed reference prices.</p></div><span className="integration-state connected">Enabled</span></div><div className="settings-row"><div><b>MT5 / ChemlalBridge</b><p>Optional broker candle connection for automated calculations. Not used as the displayed price source.</p></div><span className="integration-state">Optional</span></div><div className="settings-row"><div><b>SMC rule engine</b><p>TradingView embedded widgets do not expose candle data to this app. Automated SMC requires a separate permitted candle feed.</p></div><span className="integration-state">Data required</span></div><div className="settings-row"><div><b>Language</b><p>Choose English, French or Arabic from the header.</p></div><span className="integration-state connected">{language}</span></div><div className="settings-row"><div><b>Trading sessions</b><p>Asia 00–09, London 07–16, New York 13–22 UTC (indicative windows).</p></div><span className="integration-state connected">{sessions.filter(s=>s.active).map(s=>s.name).join(' + ')||'Between sessions'}</span></div></section><section className="panel lower-panel"><span className="eyebrow">SECURITY NOTE</span><h2>Keep your workspace protected</h2><p className="settings-note">Your current password and session system remain unchanged. Never place broker credentials, API secrets or private keys in browser-side code.</p></section></>}
      <footer>TRADER PRO CHEMLAL <span>Trading involves risk. Informational workspace only — not financial advice.</span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
