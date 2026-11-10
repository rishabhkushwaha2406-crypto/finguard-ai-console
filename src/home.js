
/* ============================================================
   Public homepage
   ============================================================ */
function HeroNet({ loop }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv || !cv.getContext) return; const ctx = cv.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rnd = mulberry32(99), N = 74, nodes = [], dpr = Math.min(2, window.devicePixelRatio || 1);
    for (let i = 0; i < N; i++) nodes.push({ x: .08 + .92 * rnd(), y: rnd(), vx: (rnd() - .5) * .00016, vy: (rnd() - .5) * .00016, r: 1.4 + rnd() * 2.2, ph: rnd() * 6.28 });
    const cyc = [{ x: .62, y: .36 }, { x: .82, y: .58 }, { x: .5, y: .7 }];
    let W = 0, Hh = 0, mouse = null, raf = 0, frame = 0, col = {};
    const readCols = () => { const s = getComputedStyle(document.documentElement); col = { line: s.getPropertyValue('--line2').trim(), acc: s.getPropertyValue('--accent').trim(), crit: s.getPropertyValue('--crit').trim(), faint: s.getPropertyValue('--faint').trim(), text: s.getPropertyValue('--text').trim() }; };
    const size = () => { W = cv.clientWidth; Hh = cv.clientHeight; cv.width = W * dpr; cv.height = Hh * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); readCols();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(size) : null; ro && ro.observe(cv);
    const mv = e => { const r = cv.getBoundingClientRect(); mouse = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; };
    cv.addEventListener('pointermove', mv); cv.addEventListener('pointerleave', () => mouse = null);
    const pulses = []; for (let i = 0; i < 16; i++) pulses.push({ a: Math.floor(rnd() * N), t: rnd(), s: .002 + rnd() * .004, b: -1 });
    const draw = (time) => {
      frame++; if (frame % 90 === 0) readCols();
      ctx.clearRect(0, 0, W, Hh);
      const P = (n) => [n.x * W, n.y * Hh];
      nodes.forEach(n => { if (!reduce) { n.x += n.vx * 16; n.y += n.vy * 16; if (n.x < .05 || n.x > 1) n.vx *= -1; if (n.y < 0 || n.y > 1) n.vy *= -1; } });
      const near = (a, b) => Math.hypot((a.x - b.x) * W, (a.y - b.y) * Hh);
      const edges = [];
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = near(nodes[i], nodes[j]); if (d < 118) edges.push([i, j, d]); }
      ctx.lineWidth = 1;
      edges.forEach(([i, j, d]) => { const a = nodes[i], b = nodes[j]; let hot = 0; if (mouse) { const dm = Math.min(Math.hypot((a.x - mouse.x) * W, (a.y - mouse.y) * Hh), Math.hypot((b.x - mouse.x) * W, (b.y - mouse.y) * Hh)); hot = Math.max(0, 1 - dm / 150); } ctx.globalAlpha = (1 - d / 118) * .5 + hot * .6; ctx.strokeStyle = hot > .2 ? col.acc : col.line; ctx.beginPath(); ctx.moveTo(...P(a)); ctx.lineTo(...P(b)); ctx.stroke(); });
      nodes.forEach(n => { const [x, y] = P(n); let hot = 0; if (mouse) hot = Math.max(0, 1 - Math.hypot(x - mouse.x * W, y - mouse.y * Hh) / 120); ctx.globalAlpha = .55 + hot * .45; ctx.fillStyle = hot > .3 ? col.acc : col.faint; ctx.beginPath(); ctx.arc(x, y, n.r + hot * 2, 0, 6.283); ctx.fill(); });
      pulses.forEach(p => { if (p.b < 0 || p.t >= 1) { p.a = Math.floor(rnd() * N); const cand = edges.filter(e => e[0] === p.a || e[1] === p.a); if (cand.length) { const e = cand[Math.floor(rnd() * cand.length)]; p.from = e[0] === p.a ? e[0] : e[1]; p.b = e[0] === p.a ? e[1] : e[0]; } else p.b = -1; p.t = 0; } if (p.b >= 0) { p.t += reduce ? 0 : p.s * 1.6; const a = nodes[p.from], b = nodes[p.b], x = (a.x + (b.x - a.x) * p.t) * W, y = (a.y + (b.y - a.y) * p.t) * Hh; ctx.globalAlpha = .9; ctx.fillStyle = col.acc; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, 6.283); ctx.fill(); } });
      // the loop
      const tt = reduce ? 0 : time / 1000;
      ctx.globalAlpha = 1; ctx.strokeStyle = col.crit; ctx.lineWidth = 1.6;
      cyc.forEach((c, i) => { const d = cyc[(i + 1) % 3], ax = c.x * W, ay = c.y * Hh, bx = d.x * W, by = d.y * Hh; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -tt * 22; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]); const k = (tt * .35 + i / 3) % 1, px = ax + (bx - ax) * k, py = ay + (by - ay) * k; ctx.fillStyle = col.crit; ctx.beginPath(); ctx.arc(px, py, 3.2, 0, 6.283); ctx.fill(); });
      cyc.forEach((c, i) => { const x = c.x * W, y = c.y * Hh, pr = (tt * .6 + i * .33) % 1; ctx.globalAlpha = (1 - pr) * .5; ctx.beginPath(); ctx.arc(x, y, 8 + pr * 22, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = col.crit; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, 6.283); ctx.fill(); });
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro && ro.disconnect(); cv.removeEventListener('pointermove', mv); };
  }, []);
  return html`<div className="hero-net"><canvas ref=${ref} aria-label="Animated financial network with a circular transfer highlighted"></canvas>
    <div className="callout" style=${{ left: '40%', top: '16%' }}><b>AML-005</b> circular transfer<br/>${loop}</div>
    <div className="callout" style=${{ left: '60%', top: '82%', borderLeftColor: 'var(--accent)' }}><b style=${{ color: 'var(--accent)' }}>Graph</b> 3 customers, one loop<br/>evidence attached to the case</div></div>`;
}

function StructuringDemo() {
  const { data } = useApp(); const [minCount, setMin] = useState(3), [win, setWin] = useState(96), [thr, setThr] = useState(1000000);
  const L = (data.g['C-1007'] || []).filter(t => t.type === 'CASH_DEP'), [ref, w] = useWidth();
  const hits = RUN['AML-001']({ threshold: thr, band: .85, minCount, windowH: win }, { 'C-1007': (data.g['C-1007'] || []) });
  const h = 300, m = { l: 56, r: 14, t: 14, b: 30 }, iw = w - m.l - m.r, ih = h - m.t - m.b, t0 = BASE - 6 * D, y0 = 700000, y1 = 1150000;
  const X = ts => m.l + (ts - t0) / (6 * D) * iw, Y = v => m.t + ih - (v - y0) / (y1 - y0) * ih;
  const inHit = new Set(hits.flatMap(x => x.tx.map(t => t.id)));
  return html`<div className="demo"><div className="ctl"><div><div className="eyebrow">Live rule · AML-001</div><h3 style=${{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 26, marginTop: 8 }}>Adjust the rule and watch the alert change</h3></div>
    <${Slider} id="s1" label="Reporting threshold" value=${thr} min=${700000} max=${1100000} step=${50000} onChange=${setThr} fmt=${fmtINR}/>
    <${Slider} id="s2" label="Minimum deposits" value=${minCount} min=${2} max=${8} step=${1} onChange=${setMin}/>
    <${Slider} id="s3" label="Window (hours)" value=${win} min=${24} max=${168} step=${12} onChange=${setWin} fmt=${v => v + 'h'}/>
    <div className="result" style=${{ borderColor: hits.length ? 'var(--crit)' : 'var(--line2)' }}><${Pill} tone=${hits.length ? 'crit' : 'ok'}>${hits.length ? 'Alert raised' : 'No alert'}<//><span className="muted">${hits.length ? hits[0].ev[0] : 'Deposits do not satisfy the current rule.'}</span></div></div>
  <div className="viz" ref=${ref}><div style=${{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><b>C-1007 · cash deposits, last 6 days</b><span className="muted">${L.length} deposits on file</span></div>
    <svg width=${w} height=${h} role="img" aria-label="Cash deposits plotted against the reporting threshold">${[0, 1, 2, 3, 4].map(i => { const v = y0 + (y1 - y0) * i / 4; return html`<g key=${i}><line x1=${m.l} x2=${w - m.r} y1=${Y(v)} y2=${Y(v)} style=${{ stroke: 'var(--line)' }}/><text x=${m.l - 8} y=${Y(v) + 4} textAnchor="end" style=${{ fill: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>${fmtINR(v)}</text></g>`; })}
      <rect x=${m.l} width=${iw} y=${Y(thr)} height=${Math.max(0, Y(.85 * thr) - Y(thr))} style=${{ fill: 'var(--crit)', opacity: .08 }}/>
      <line x1=${m.l} x2=${w - m.r} y1=${Y(thr)} y2=${Y(thr)} strokeDasharray="5 4" style=${{ stroke: 'var(--crit)' }}/><text x=${w - m.r} y=${Y(thr) - 6} textAnchor="end" style=${{ fill: 'var(--crit)', fontSize: 10, fontFamily: 'var(--mono)' }}>reporting threshold ${fmtINR(thr)}</text>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => html`<text key=${i} x=${X(t0 + i * D)} y=${h - 8} textAnchor="middle" style=${{ fill: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>${fmtDay(t0 + i * D)}</text>`)}
      ${L.filter(t => t.ts >= t0).map(t => html`<g key=${t.id}><circle cx=${X(t.ts)} cy=${Y(t.amt)} r=${inHit.has(t.id) ? 7 : 5} style=${{ fill: inHit.has(t.id) ? 'var(--crit)' : 'var(--accent)', stroke: 'var(--bg)' }} strokeWidth="2"/><text x=${X(t.ts)} y=${Y(t.amt) - 12} textAnchor="middle" style=${{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'var(--mono)' }}>${fmtINR(t.amt)}</text></g>`)}
    </svg></div></div>`;
}

function FraudDemo() {
  const { data, open } = useApp(); const top = useMemo(() => [...data.txns].sort((a, b) => b.p - a.p).slice(0, 4), [data.txns]); const [id, setId] = useState(top[0].id);
  const t = data.tm[id], ex = explainTx(t, data.mean), cu = data.cm[t.c];
  return html`<div className="demo"><div className="ctl"><div><div className="eyebrow">Explainable scoring</div><h3 style=${{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 26, marginTop: 8 }}>Pick a flagged payment and see why</h3></div>
    <div style=${{ display: 'flex', flexDirection: 'column', gap: 6 }}>${top.map(x => html`<button key=${x.id} className="btn" style=${{ justifyContent: 'space-between', borderColor: id === x.id ? 'var(--accent)' : undefined, background: id === x.id ? 'var(--accent-soft)' : undefined }} onClick=${() => setId(x.id)}><span className="mono">${x.id}</span><span className="muted">${fmtINR(x.amt)}</span><b className="mono">${pct(x.p)}</b></button>`)}</div>
    <${KV} rows=${[['Customer', cu.name], ['Type', `${t.type} · ${t.dir === 'out' ? 'debit' : 'credit'}`], ['Counterparty', `${t.cpName} (${t.cpC})`], ['Time (IST)', fmtTs(t.ts)]]}/>
    <${Btn} sm onClick=${() => open('txn', t.id)}>Open full detail<//></div>
  <div className="viz"><${Waterfall} ex=${ex} p=${t.p}/></div></div>`;
}

function RiskDemo() {
  const { data, open } = useApp(); const ids = ['C-1041', 'C-1019', 'C-1031', 'C-1007'], [id, setId] = useState(ids[0]); const r = data.risk[id], c = data.cm[id];
  return html`<div className="demo"><div className="ctl"><div><div className="eyebrow">Customer risk</div><h3 style=${{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 26, marginTop: 8 }}>Every point of the score has a source</h3></div>
    <div style=${{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>${ids.map(x => html`<button key=${x} className="btn sm" aria-pressed=${x === id} style=${{ background: x === id ? 'var(--accent)' : undefined, color: x === id ? 'var(--accent-ink)' : undefined }} onClick=${() => setId(x)}>${x}</button>`)}</div>
    <div style=${{ display: 'flex', gap: 16, alignItems: 'center' }}><${Ring} score=${r.score} band=${r.band}/><div><b>${c.name}</b><div className="muted" style=${{ fontSize: 12 }}>${c.occ} · ${c.seg}<br/>KYC ${c.kyc}</div></div></div><${Btn} sm onClick=${() => open('customer', id)}>Open profile<//></div>
  <div className="viz"><div className="sect-t">Contribution to score (points)</div><${HBars} rows=${[...r.parts].sort((a, b) => b.v - a.v).map(p => ({ label: p.label, value: p.v, color: p.v > 6 ? bandColor.High : undefined }))} fmt=${v => v.toFixed(1)}/><div className="faint" style=${{ fontSize: 11, marginTop: 10 }}>Weights are configurable in the workspace. Indicators here are simulated and are not sanctions or regulatory determinations.</div></div></div>`;
}

function GraphSection() {
  const { data } = useApp(); const [sel, setSel] = useState('C-1041');
  const node = data.graph.nodes.find(n => n.id === sel);
  return html`<div className="demo" style=${{ gridTemplateColumns: 'minmax(0,1fr) 300px' }}><div style=${{ minWidth: 0 }}><${GraphCanvas} data=${data} selected=${sel} onSelect=${setSel} height=${460} flags=${{ transfer: true, device: true, beneficiary: true }}/></div>
    <div className="ctl" style=${{ borderRight: 0, borderLeft: '1px solid var(--line)' }}><div className="eyebrow">Selected node</div><${NodeInfo} data=${data} id=${sel}/><div className="faint" style=${{ fontSize: 11 }}>Drag nodes, scroll to zoom, click to inspect. A shared device or beneficiary is a lead to review, not a verdict.</div></div></div>`;
}

function CopilotDemo() {
  const { data, open } = useApp(); const al = data.alerts.find(a => a.ruleId === 'AML-005') || data.alerts[0]; const cu = data.cm[al.c];
  const prompts = [['Why was this alert raised?', 'explainAlert'], ['What should I check next?', 'checks'], ['Summarise the customer', 'summarizeCustomer'], ['Draft the investigation summary', 'report']];
  const [msgs, setMsgs] = useState([]);
  const ask = (q, intent) => setMsgs(m => [...m, { q, res: copilot(intent, { alert: al, customer: cu, data }), k: m.length }]);
  return html`<div className="demo" style=${{ gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)' }}><div className="ctl"><div><div className="eyebrow">Investigation copilot</div><h3 style=${{ fontFamily: 'var(--display)', fontWeight: 400, fontSize: 26, marginTop: 8 }}>Answers that cite the record</h3></div>
    <div className="muted" style=${{ fontSize: 13 }}>Context: <span className="mono">${al.id}</span> · ${cu.name}</div>
    <div style=${{ display: 'flex', flexDirection: 'column', gap: 6 }}>${prompts.map(([q, i]) => html`<button key=${i} className="btn" style=${{ justifyContent: 'flex-start' }} onClick=${() => ask(q, i)}>${q}</button>`)}</div>
    <${Note}>Responses are built from application records only. Missing evidence is stated, and a human reviews every draft.<//></div>
  <div className="viz chat" style=${{ minHeight: 360, maxHeight: 560, overflow: 'auto' }}>${!msgs.length && html`<div className="muted" style=${{ padding: 24 }}>Choose a question to see an evidence-grounded answer.</div>`}${msgs.map(m => html`<${Fragment} key=${m.k}><div className="bubble me">${m.q}</div><${Answer} res=${m.res} onOpen=${open}/><//>`)}</div></div>`;
}

function Walkthrough() {
  const { data, open, store } = useApp(); const al = data.alerts.find(a => a.ruleId === 'AML-005') || data.alerts[0]; const [s, setS] = useState(0);
  const steps = [['Detect', 'A rule fires with evidence attached'], ['Inspect', 'Every transaction behind the alert'], ['Connect', 'See who else is involved'], ['Decide', 'Open a case and assign it'], ['Report', 'Draft the summary for review']];
  const txs = al.txIds.map(i => data.tm[i]); const cs = [...new Set(txs.map(t => t.c))];
  const cs2 = store.cases.find(c => c.alertId === al.id);
  let stage;
  if (s === 0) stage = html`<div><div style=${{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}><${Sev} s=${al.severity}/><b>${al.id}</b><span className="muted">${al.title}</span></div><ul className="evl">${al.evidence.map(e => html`<li key=${e}>${e}</li>`)}</ul><div style=${{ marginTop: 14 }}><${KV} rows=${[['Customer', `${data.cm[al.c].name} (${al.c})`], ['Raised', fmtTs(al.ts) + ' IST'], ['Value in scope', fmtINR(al.amount)]]}/></div></div>`;
  else if (s === 1) stage = html`<div className="tw"><table className="tbl"><thead><tr><th>Transaction</th><th>Time (IST)</th><th>From</th><th>To</th><th className="right">Amount</th></tr></thead><tbody>${txs.map(t => html`<tr key=${t.id} className="r" onClick=${() => open('txn', t.id)}><td className="mono">${t.id}</td><td>${fmtTs(t.ts)}</td><td>${data.cm[t.c].name}</td><td>${data.cm[t.cp]?.name || t.cpName}</td><td className="right mono">${fmtINR(t.amt)}</td></tr>`)}</tbody></table></div>`;
  else if (s === 2) { const pts = [[150, 50], [270, 170], [60, 170]]; stage = html`<svg viewBox="0 0 330 230" style=${{ width: '100%', maxWidth: 460, display: 'block', margin: '0 auto' }} role="img" aria-label="Loop between three customers">${txs.map((t, i) => { const a = pts[i], b = pts[(i + 1) % 3]; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; return html`<g key=${t.id}><line x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} strokeWidth="1.6" strokeDasharray="6 5" style=${{ stroke: 'var(--crit)' }}><animate attributeName="stroke-dashoffset" from="22" to="0" dur="1.4s" repeatCount="indefinite"/></line><text x=${mx + (mx > 160 ? 14 : mx < 160 ? -14 : 0)} y=${my + (my < 100 ? -8 : 16)} textAnchor="middle" style=${{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)' }}>${fmtINR(t.amt)}</text></g>`; })}${cs.map((c, i) => html`<g key=${c}><circle cx=${pts[i][0]} cy=${pts[i][1]} r="16" style=${{ fill: 'var(--surface)', stroke: 'var(--crit)' }} strokeWidth="2"/><text x=${pts[i][0]} y=${pts[i][1] + 4} textAnchor="middle" style=${{ fill: 'var(--text)', fontSize: 10, fontFamily: 'var(--mono)' }}>${c.slice(2)}</text><text x=${pts[i][0]} y=${pts[i][1] + (i === 0 ? -24 : 34)} textAnchor="middle" style=${{ fill: 'var(--muted)', fontSize: 11 }}>${data.cm[c].name}</text></g>`)}</svg>`; }
  else if (s === 3) stage = html`<div><${KV} rows=${[['Case', cs2 ? cs2.id : 'Created when you open the alert'], ['Priority', cs2 ? cs2.priority : 'High'], ['Assigned to', cs2 ? cs2.assignee : 'Unassigned'], ['Status', cs2 ? html`<${Status} s=${cs2.status}/>` : html`<${Status} s="New"/>`]]}/><ul className="tl" style=${{ marginTop: 16 }}>${(cs2 ? cs2.events.slice(-3) : [{ ts: al.ts, text: 'Alert raised by rule engine' }]).map((e, i) => html`<li key=${i}>${e.text}<small>${fmtTs(e.ts)} IST</small></li>`)}</ul><div style=${{ marginTop: 14 }}><${Btn} sm onClick=${() => open('alert', al.id)}>Open alert in workspace<//></div></div>`;
  else { const r = copilot('report', { alert: al, customer: data.cm[al.c], data }); stage = html`<${Answer} res=${r} onOpen=${open} instant/>`; }
  return html`<div className="steps"><div className="rail" role="tablist">${steps.map((st, i) => html`<button key=${st[0]} role="tab" aria-current=${s === i} onClick=${() => setS(i)}><span className="n">0${i + 1}</span><span><b style=${{ display: 'block', fontSize: 14, color: 'var(--text)' }}>${st[0]}</b><span style=${{ fontSize: 12 }}>${st[1]}</span></span></button>`)}</div><div className="stage">${stage}</div></div>`;
}

function Home() {
  const { data, go, theme, setTheme, store } = useApp();
  const amlN = data.alerts.filter(a => a.kind === 'AML').length, frN = data.alerts.filter(a => a.kind === 'Fraud').length;
  const hiN = data.customers.filter(c => ['High', 'Critical'].includes(data.risk[c.id].band)).length, bigNets = data.graph.comps.filter(k => k.members.length >= 3).length;
  const loopAl = data.alerts.find(a => a.ruleId === 'AML-005');
  const sc = id => { const el = document.getElementById(id); el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const eng = [
    ['AML rule engine', 'Eight configurable scenarios with rolling windows, thresholds, severity and evidence on every alert.', `${amlN} alerts in 30 days`, 'aml'],
    ['Fraud intelligence', 'Explainable scoring, an adjustable threshold and honest metrics computed from the labels on file.', `${frN} flagged · PR-AUC ${data.metrics.prauc.toFixed(2)}`, 'fraud'],
    ['Customer risk', 'A 0 to 100 score from documented, adjustable weights, with the contributors laid out.', `${hiN} high or critical`, 'risk'],
    ['Graph analytics', 'Customers, devices and beneficiaries joined into one network with loops and clusters surfaced.', `${data.graph.cycles.length} loop · ${Object.keys(data.graph.mules).length} accounts to review`, 'graph'],
    ['Cases and copilot', 'Assignment, notes, escalation and an audit trail, with summaries drawn only from the record.', `${store.cases.length} cases open or closed`, 'cases']
  ];
  return html`<div className="page" id="home-scroll">
    <header className="nav"><div className="wrap"><button className="brand" onClick=${() => sc('top')}><${Logo}/>FinGuard AI</button><nav><a href="#home" onClick=${e => { e.preventDefault(); sc('platform'); }}>Platform</a><a href="#home" onClick=${e => { e.preventDefault(); sc('intelligence'); }}>Intelligence</a><a href="#home" onClick=${e => { e.preventDefault(); sc('network'); }}>Network</a><a href="#home" onClick=${e => { e.preventDefault(); sc('copilot'); }}>Copilot</a><a href="#home" onClick=${e => { e.preventDefault(); sc('walkthrough'); }}>Walkthrough</a></nav><div className="sp"></div><${Btn} kind="ghost sm" icon=${theme === 'dark' ? 'sun' : 'moon'} onClick=${() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Switch theme"/><${Btn} kind="primary sm" onClick=${() => go('overview')}>Open workspace<//></div></header>
    <main id="top"><section className="hero"><div className="wrap"><div className="hero-grid"><div><div className="eyebrow">Financial crime intelligence</div><h1 style=${{ marginTop: 18 }}>Follow the money until it <em>tells the truth.</em></h1><p className="lede">FinGuard AI brings AML monitoring, fraud models, customer risk and graph analytics into one investigation workspace, so analysts spend their time on cases instead of spreadsheets.</p><div className="cta"><${Btn} kind="primary lg" onClick=${() => go('overview')}>Open the workspace<//><${Btn} kind="lg" icon="play" onClick=${() => sc('walkthrough')}>Watch a case unfold<//></div></div><${HeroNet} loop=${loopAl ? loopAl.evidence[1] : ''}/></div>
      <div className="strip"><div><div className="v num">${data.txns.length}</div><div className="l">transactions monitored</div></div><div><div className="v num">${data.alerts.length}</div><div className="l">alerts from rules and the fraud scorer</div></div><div><div className="v num">${bigNets}</div><div className="l">networks with three or more linked parties</div></div><div><div className="v num">${hiN}</div><div className="l">customers at high or critical risk</div></div></div>
      <div className="faint" style=${{ fontSize: 12, marginTop: 12 }}>Every figure on this page is computed in your browser from synthetic demonstration data. No database, API or trained model is connected.</div></div></section>
    <section className="sec" id="platform"><div className="wrap"><div className="eyebrow">Platform</div><h2>Five engines, <em>one case file.</em></h2><p className="sub">Every detection feeds the same alert queue, the same customer profile and the same audit trail.</p>
      <div className="engines">${eng.map(e => html`<div key=${e[0]} className="engine"><h3>${e[0]}</h3><p>${e[1]}</p><div className="m">${e[2]}</div><button className="go" onClick=${() => go(e[3])}>Open <${Icon} n="arrow" s=${13}/></button></div>`)}</div></div></section>
    <section className="sec" id="intelligence"><div className="wrap"><div className="eyebrow">AML intelligence</div><h2>Rules you can <em>read, tune and test.</em></h2><p className="sub">Each scenario has a threshold, a window and a severity. Change them and the alerts change with them.</p><${StructuringDemo}/></div></section>
    <section className="sec"><div className="wrap"><div className="eyebrow">Fraud intelligence</div><h2>A score is only useful if you can <em>argue with it.</em></h2><p className="sub">Each flag shows which features pushed it up or down, in the units the model uses.</p><${FraudDemo}/></div></section>
    <section className="sec"><div className="wrap"><div className="eyebrow">Risk intelligence</div><h2>Risk as a sum of <em>named reasons.</em></h2><p className="sub">Weights are documented and adjustable. Simulated indicators are labelled as such.</p><${RiskDemo}/></div></section>
    <section className="sec" id="network"><div className="wrap"><div className="eyebrow">Graph analytics</div><h2>The pattern is rarely in <em>one account.</em></h2><p className="sub">Transfers, shared devices and shared beneficiaries form one network. Loops and collection points stand out.</p><${GraphSection}/></div></section>
    <section className="sec" id="copilot"><div className="wrap"><div className="eyebrow">AI investigation copilot</div><h2>Summaries that <em>show their evidence.</em></h2><p className="sub">The copilot answers from alerts, transactions and model outputs. It states what is missing and never files a report.</p><${CopilotDemo}/></div></section>
    <section className="sec" id="walkthrough"><div className="wrap"><div className="eyebrow">Product demonstration</div><h2>From alert to <em>written summary.</em></h2><p className="sub">Step through the circular transfer case from detection to a draft for human review.</p><${Walkthrough}/></div></section>
    <footer className="foot"><div className="wrap"><div className="big">Open the workspace and <em style=${{ color: 'var(--accent)' }}>take a case.</em></div><div style=${{ marginTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}><${Btn} kind="primary lg" onClick=${() => go('overview')}>Open the workspace<//><${Btn} kind="lg" onClick=${() => go('settings')}>See the backend contract<//></div>
      <div className="cols"><div><div style=${{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text)', fontWeight: 600 }}><${Logo} s=${20}/>FinGuard AI</div><p style=${{ marginTop: 10, maxWidth: 320 }}>Demonstration build. Synthetic data, client-side logic. Not a production AML system and not legal or regulatory advice.</p></div><div><h4>Workspace</h4>${[['overview', 'Overview'], ['transactions', 'Transactions'], ['aml', 'AML Monitoring'], ['fraud', 'Fraud Detection']].map(x => html`<button key=${x[0]} onClick=${() => go(x[0])}>${x[1]}</button>`)}</div><div><h4>Intelligence</h4>${[['risk', 'Customer Risk'], ['graph', 'Graph Intelligence'], ['cases', 'Investigations'], ['copilot', 'AI Copilot']].map(x => html`<button key=${x[0]} onClick=${() => go(x[0])}>${x[1]}</button>`)}</div><div><h4>Build</h4>${[['analytics', 'Analytics'], ['data', 'Data Management'], ['settings', 'Settings and API']].map(x => html`<button key=${x[0]} onClick=${() => go(x[0])}>${x[1]}</button>`)}</div></div></div></footer></main></div>`;
}
