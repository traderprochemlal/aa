import React from 'react';
import { Calculator, ShieldCheck, BookOpen, Radar, Plus, Trash2 } from 'lucide-react';

const money = (n) => Number.isFinite(n) ? n.toLocaleString(undefined,{maximumFractionDigits:2}) : '—';

export function RiskManager({market}) {
  const [balance,setBalance]=React.useState('10000');
  const [risk,setRisk]=React.useState('1');
  const [entry,setEntry]=React.useState('');
  const [stop,setStop]=React.useState('');
  const [target,setTarget]=React.useState('');
  const [contract,setContract]=React.useState('100');
  const b=Number(balance), r=Number(risk), e=Number(entry), s=Number(stop), t=Number(target), c=Number(contract);
  const valid=b>0&&r>0&&r<=100&&e>0&&s>0&&e!==s&&c>0;
  const riskCash=valid?b*r/100:NaN;
  const distance=valid?Math.abs(e-s):NaN;
  const lots=valid?riskCash/(distance*c):NaN;
  const rr=valid&&Number.isFinite(t)&&t>0?Math.abs(t-e)/distance:NaN;
  return <div className="tool-page">
    <section className="tool-hero"><div><span className="eyebrow">CAPITAL PROTECTION</span><h2>Smart Risk Manager</h2><p>Plan risk before entering a trade. Position sizing uses the contract-size assumption shown below.</p></div><span className="tool-icon"><ShieldCheck/></span></section>
    <div className="tool-columns">
      <section className="panel tool-panel"><div className="panel-head"><div><span className="eyebrow">TRADE PARAMETERS</span><h2>{market} · Position calculator</h2></div></div>
        <label className="tool-field">Account balance<input type="number" min="0" value={balance} onChange={e=>setBalance(e.target.value)}/></label>
        <label className="tool-field">Risk per trade (%)<input type="number" min="0.01" max="100" step="0.1" value={risk} onChange={e=>setRisk(e.target.value)}/></label>
        <div className="tool-field-grid"><label className="tool-field">Entry price<input type="number" step="any" placeholder="e.g. 2350.00" value={entry} onChange={e=>setEntry(e.target.value)}/></label><label className="tool-field">Stop loss<input type="number" step="any" placeholder="e.g. 2345.00" value={stop} onChange={e=>setStop(e.target.value)}/></label></div>
        <div className="tool-field-grid"><label className="tool-field">Take profit<input type="number" step="any" placeholder="Optional" value={target} onChange={e=>setTarget(e.target.value)}/></label><label className="tool-field">Contract size<input type="number" min="0.0001" step="any" value={contract} onChange={e=>setContract(e.target.value)}/></label></div>
        <p className="tool-note">Sizing formula: risk amount ÷ (entry-to-stop distance × contract size). Default 100 is a common XAUUSD lot assumption; confirm your broker's symbol specification before using it.</p>
      </section>
      <section className="panel tool-panel"><span className="eyebrow">CALCULATED PLAN</span><h2 className="tool-result-title">Risk overview</h2>
        <div className="result-grid"><div><span>Risk amount</span><b>{valid?money(riskCash):'—'}</b></div><div><span>Stop distance</span><b>{valid?money(distance):'—'}</b></div><div><span>Estimated lot size</span><b>{valid?lots.toFixed(3):'—'}</b></div><div><span>Reward / Risk</span><b>{Number.isFinite(rr)?rr.toFixed(2)+'R':'—'}</b></div></div>
        <div className="risk-warning">{valid?'Calculation only — verify tick value, lot step, margin and contract size with your broker before placing an order.':'Enter a valid balance, risk, entry and stop to calculate position size.'}</div>
      </section>
    </div>
  </div>;
}

export function TradeJournal({market}) {
  const [items,setItems]=React.useState(()=>{try{return JSON.parse(localStorage.getItem('chemlal-trade-journal-v1')||'[]')}catch{return []}});
  const [symbol,setSymbol]=React.useState(market);
  const [side,setSide]=React.useState('BUY');
  const [result,setResult]=React.useState('1');
  const [note,setNote]=React.useState('');
  React.useEffect(()=>{try{localStorage.setItem('chemlal-trade-journal-v1',JSON.stringify(items))}catch{}},[items]);
  const wins=items.filter(x=>x.r>0).length, losses=items.filter(x=>x.r<0).length;
  const total=items.reduce((n,x)=>n+x.r,0), winRate=items.length?wins/items.length*100:0;
  const add=()=>{const value=Number(result);if(!Number.isFinite(value)||!symbol.trim())return;setItems(old=>[{id:Date.now(),symbol:symbol.toUpperCase(),side,r:value,note:note.trim(),date:new Date().toLocaleString()},...old].slice(0,200));setNote('')};
  const remove=(id)=>setItems(old=>old.filter(x=>x.id!==id));
  return <div className="tool-page"><section className="tool-hero"><div><span className="eyebrow">PERFORMANCE TRACKING</span><h2>Professional Trade Journal</h2><p>Record completed trades in R-multiples and review your execution history.</p></div><span className="tool-icon"><BookOpen/></span></section>
    <div className="journal-stats"><div className="stat-card"><span>RECORDED TRADES</span><strong>{items.length}</strong></div><div className="stat-card"><span>WIN RATE</span><strong>{winRate.toFixed(1)}%</strong></div><div className="stat-card"><span>NET RESULT</span><strong className={total>=0?'positive':'negative'}>{total.toFixed(2)}R</strong></div><div className="stat-card"><span>WINS / LOSSES</span><strong>{wins} / {losses}</strong></div></div>
    <section className="panel tool-panel"><div className="panel-head"><div><span className="eyebrow">NEW RECORD</span><h2>Log a completed trade</h2></div></div>
      <div className="journal-form"><label className="tool-field">Symbol<input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="XAUUSD"/></label><label className="tool-field">Direction<select value={side} onChange={e=>setSide(e.target.value)}><option>BUY</option><option>SELL</option></select></label><label className="tool-field">Result (R)<input type="number" step="0.1" value={result} onChange={e=>setResult(e.target.value)}/></label><label className="tool-field journal-note">Execution notes<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Setup, mistake, lesson..."/></label><button className="subtle-btn journal-add" onClick={add}><Plus size={15}/> Add trade</button></div>
    </section>
    <section className="panel tool-panel journal-history"><div className="panel-head"><div><span className="eyebrow">LOCAL TRADE HISTORY</span><h2>Recent trades</h2></div><span className="tag">LAST 200</span></div>
      {items.length===0?<div className="history-empty"><BookOpen/><b>No trades logged yet</b><p>Your journal is saved in this browser on this device. It is not synced to a server or other devices.</p></div>:<div className="journal-list">{items.map(x=><div className="journal-row" key={x.id}><div><b>{x.symbol} · {x.side}</b><small>{x.date}{x.note?' · '+x.note:''}</small></div><strong className={x.r>=0?'positive':'negative'}>{x.r>0?'+':''}{x.r.toFixed(2)}R</strong><button className="delete-trade" title="Delete trade" onClick={()=>remove(x.id)}><Trash2 size={15}/></button></div>)}</div>}
    </section>
  </div>;
}

export function SMCIntelligence({market, bridge}) {
  const frames=['M5','M15','H1','H4'];
  return <div className="tool-page"><section className="tool-hero"><div><span className="eyebrow">SMART MONEY CONCEPTS</span><h2>SMC Intelligence · {market}</h2><p>Multi-timeframe analysis workspace. Structure checks use the latest broker candles when the MT5 bridge is online; this is a rule-based tool, not an AI model.</p></div><span className="tool-icon"><Radar/></span></section>
    <section className="panel tool-panel"><div className="panel-head"><div><span className="eyebrow">MULTI-TIMEFRAME MATRIX</span><h2>Structure confirmation</h2></div><span className={bridge?.connected ? "tag" : "tag amber-tag"}>{bridge?.connected ? "BROKER DATA LIVE" : "DATA REQUIRED"}</span></div>
      <div className="mtf-grid">{frames.map(frame=>{const item=bridge?.analysis?.[frame];return <div key={frame}><b>{frame}</b><strong className={item?.status==='BUY'?'positive':item?.status==='SELL'?'negative':''}>{item?.status||'WAIT'}</strong><small>{item?.direction||'Awaiting verified candles'}</small></div>})}</div>
      {bridge?.connected && bridge?.quote?.symbol===market && <div className="live-signal-detail"><div><span>MT5 BID / ASK</span><b>{bridge.quote.bid} / {bridge.quote.ask}</b></div><div><span>M15 STRUCTURE</span><b>{bridge.analysis?.M15?.bos||'Not evaluated'}</b></div><div><span>M15 FVG</span><b>{bridge.analysis?.M15?.fvg||'Not evaluated'}</b></div><p>{bridge.analysis?.M15?.reason||'Waiting for candles'}</p></div>}
      {!bridge?.connected && <p className="tool-note">MT5 is offline. Connect the Expert Advisor to start receiving broker candles.</p>}
      <p className="tool-note">The connected endpoint currently evaluates candle-range breakouts and recent three-candle FVG candidates. This is a first rule-based pass, not full institutional SMC or an AI model; confirm every setup manually.</p>
    </section>
    <div className="tool-columns">
      <section className="panel tool-panel"><span className="eyebrow">LIQUIDITY RADAR</span><h2 className="tool-result-title">Key liquidity pools</h2><div className="radar-list"><div><span>Equal highs / buy-side liquidity</span><b>Not scanned</b></div><div><span>Equal lows / sell-side liquidity</span><b>Not scanned</b></div><div><span>Previous day high / low</span><b>Not available</b></div><div><span>Liquidity sweep confirmation</span><b>WAIT</b></div></div></section>
      <section className="panel tool-panel"><span className="eyebrow">NEWS RISK GUARD</span><h2 className="tool-result-title">Event risk status</h2><div className="risk-warning">Calendar feed not connected. Check high-impact economic releases manually before trading. The platform will not label news conditions as safe without a trusted calendar source.</div><div className="radar-list"><div><span>High-impact event window</span><b>Unknown</b></div><div><span>Spread / volatility check</span><b>Not connected</b></div></div></section>
    </div>
  </div>;
}
