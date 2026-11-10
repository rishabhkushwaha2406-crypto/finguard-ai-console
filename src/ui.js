
/* ============================================================
   UI kit
   ============================================================ */
const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, Fragment } = React;
const html = htm.bind(React.createElement);
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);
const sevTone = { Critical: 'crit', High: 'high', Medium: 'warn', Low: 'info' };
const bandTone = { Low: 'ok', Medium: 'warn', High: 'high', Critical: 'crit' };
const bandColor = { Low: 'var(--ok)', Medium: 'var(--warn)', High: 'var(--orange)', Critical: 'var(--crit)' };
const statusTone = { New: 'info', 'Under Review': 'warn', Escalated: 'crit', Closed: 'ok' };
const cx = (...a) => a.filter(Boolean).join(' ');

const ICONS = {
  overview: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  tx: '<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>',
  aml: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  fraud: '<path d="M12 3l9.5 16.5h-19z"/><path d="M12 10v4M12 17v.5"/>',
  risk: '<path d="M4 17a8 8 0 1116 0"/><path d="M12 17l4-5"/>',
  graph: '<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.8 8.4l3 7.6M16.6 8l-3.5 8M8.2 6.8l7.6-.6"/>',
  cases: '<path d="M3 7h18v12H3zM8 7V4h8v3M3 13h18"/>',
  ai: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
  data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>',
  moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>', check: '<path d="M5 12l5 5 9-10"/>', plus: '<path d="M12 5v14M5 12h14"/>', home: '<path d="M4 11l8-7 8 7v9H4z"/>'
};
function Icon({ n, s = 16 }) { return html`<svg width=${s} height=${s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML=${{ __html: ICONS[n] || '' }}></svg>`; }
function Logo({ s = 24 }) { return html`<svg className="mark" width=${s} height=${s} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2.5L27.5 7v8.2c0 7.4-4.7 12.4-11.5 14.3C9.2 27.6 4.5 22.6 4.5 15.2V7z" fill="none" stroke="var(--accent)" strokeWidth="1.8"/><circle cx="11" cy="14" r="2" style=${{ fill: 'var(--accent)' }}/><circle cx="21" cy="12" r="2" style=${{ fill: 'var(--accent)' }}/><circle cx="16.5" cy="21" r="2" style=${{ fill: 'var(--crit)' }}/><path d="M11 14l10-2M21 12l-4.5 9M11 14l5.5 7" stroke="var(--accent)" strokeWidth="1.2" fill="none"/></svg>`; }

const Pill = ({ tone = '', plain, children }) => html`<span className=${cx('pill', tone, plain && 'plain')}>${children}</span>`;
const Sev = ({ s }) => html`<${Pill} tone=${sevTone[s]}>${s}<//>`;
const Band = ({ b }) => html`<${Pill} tone=${bandTone[b]}>${b}<//>`;
const Status = ({ s }) => html`<${Pill} tone=${statusTone[s] || ''}>${s}<//>`;
const Btn = ({ kind = '', sm, lg, icon, children, ...r }) => html`<button className=${cx('btn', kind, sm && 'sm', lg && 'lg')} ...${r}>${icon && html`<${Icon} n=${icon} s=${sm ? 13 : 15}/>`}${children}</button>`;
const Seg = ({ options, value, onChange, label }) => html`<div className="seg" role="group" aria-label=${label}>${options.map(o => { const v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return html`<button key=${v} aria-pressed=${value === v} onClick=${() => onChange(v)}>${l}</button>`; })}</div>`;
const Switch = ({ on, onChange, label }) => html`<button className="switch" role="switch" aria-checked=${on} aria-label=${label} onClick=${() => onChange(!on)}></button>`;
function Slider({ id, label, value, min, max, step, onChange, fmt = v => v }) {
  return html`<div><div style=${{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><label htmlFor=${id} className="muted">${label}</label><span className="mono">${fmt(value)}</span></div><input id=${id} className="range" type="range" min=${min} max=${max} step=${step} value=${value} onChange=${e => onChange(+e.target.value)}/></div>`;
}
const Panel = ({ title, small, right, flush, children, style }) => html`<div className="panel" style=${style}>${(title || right) && html`<header><div><h3>${title}</h3>${small && html`<small>${small}</small>`}</div><div style=${{ display: 'flex', gap: 8, alignItems: 'center' }}>${right}</div></header>`}<div className=${cx('body', flush && 'flush')}>${children}</div></div>`;
function PageHead({ title, sub, children }) { return html`<div className="hd"><div><h2>${title}</h2>${sub && html`<p>${sub}</p>`}</div><div style=${{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>${children}</div></div>`; }
function Drawer({ title, sub, onClose, children, footer }) {
  useEffect(() => { const f = e => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
  return html`<${Fragment}><div className="drawer-bg" onClick=${onClose}></div><aside className="drawer" role="dialog" aria-label=${title}><header><div style=${{ minWidth: 0 }}><div style=${{ fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1.1, letterSpacing: '-.01em' }}>${title}</div>${sub && html`<div className="muted" style=${{ marginTop: 4, fontSize: 12 }}>${sub}</div>`}</div><${Btn} kind="ghost sm" icon="x" onClick=${onClose} aria-label="Close"/></header><div className="dbody">${children}</div>${footer && html`<footer>${footer}</footer>`}</aside><//>`;
}
const KV = ({ rows }) => html`<dl className="kv">${rows.filter(r => r).map(([k, v]) => html`<${Fragment} key=${k}><dt>${k}</dt><dd>${v}</dd><//>`)}</dl>`;

/* ----- data table ----- */
function DataTable({ columns, rows, pageSize = 12, onRow, stripe, defaultSort, empty = 'No records match the current filters.', dense }) {
  const [sort, setSort] = useState(defaultSort || null), [page, setPage] = useState(0);
  const sorted = useMemo(() => { if (!sort) return rows; const c = columns.find(x => x.key === sort.key); const val = c.val || (r => r[c.key]); return [...rows].sort((a, b) => { const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (sort.dir === 'asc' ? 1 : -1); }); }, [rows, sort, columns]);
  useEffect(() => setPage(0), [rows.length]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize)), cur = Math.min(page, pages - 1), view = sorted.slice(cur * pageSize, cur * pageSize + pageSize);
  const th = c => { const s = c.sort !== false; const act = sort && sort.key === c.key; return html`<th key=${c.key} className=${cx(s && 's', c.align === 'right' && 'right')} aria-sort=${act ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} onClick=${() => s && setSort(act ? { key: c.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: 'desc' })} style=${{ width: c.w }}>${c.label}${act ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}</th>`; };
  return html`<div><div className="tw"><table className="tbl"><thead><tr>${columns.map(th)}</tr></thead><tbody>${view.map((r, i) => html`<tr key=${r.id || i} className=${onRow ? 'r' : ''} style=${{ '--stripe': stripe ? stripe(r) : 'transparent' }} onClick=${() => onRow && onRow(r)} tabIndex=${onRow ? 0 : -1} onKeyDown=${e => e.key === 'Enter' && onRow && onRow(r)}>${columns.map(c => html`<td key=${c.key} className=${cx(c.align === 'right' && 'right', c.mono && 'mono')}>${c.render ? c.render(r) : r[c.key]}</td>`)}</tr>`)}${!view.length && html`<tr><td colSpan=${columns.length} className="muted" style=${{ padding: 28, textAlign: 'center' }}>${empty}</td></tr>`}</tbody></table></div>
    <div className="pager"><span>${sorted.length} record${sorted.length === 1 ? '' : 's'}</span><span style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><${Btn} sm kind="ghost" disabled=${cur === 0} onClick=${() => setPage(cur - 1)}>Previous<//><span className="mono">${cur + 1} / ${pages}</span><${Btn} sm kind="ghost" disabled=${cur >= pages - 1} onClick=${() => setPage(cur + 1)}>Next<//></span></div></div>`;
}

/* ----- charts ----- */
function useWidth() { const ref = useRef(null); const [w, setW] = useState(640); useEffect(() => { const el = ref.current; if (!el) return; const f = () => setW(Math.max(220, el.clientWidth)); f(); if (typeof ResizeObserver === 'undefined') return; const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, []); return [ref, w]; }
function niceMax(v) { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function XYChart({ labels, series, height = 220, fmt = v => v, yMax, hline, hlineLabel, xTitle }) {
  const [ref, w] = useWidth(), [hov, setHov] = useState(null);
  const m = { l: 62, r: 12, t: 12, b: 26 }, iw = w - m.l - m.r, ih = height - m.t - m.b, n = labels.length;
  const mx = yMax || niceMax(Math.max(...series.flatMap(s => s.values), hline || 0, 1e-9)), bars = series.filter(s => s.type === 'bar'), nb = bars.length;
  const xs = i => bars.length ? m.l + (i + .5) * iw / n : m.l + (n > 1 ? i * iw / (n - 1) : iw / 2), y = v => m.t + ih - v / mx * ih;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 62))));
  const move = e => { const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left; const i = bars.length ? Math.floor((x - m.l) / (iw / n)) : Math.round((x - m.l) / (iw / Math.max(n - 1, 1))); setHov(Math.max(0, Math.min(n - 1, i))); };
  const bw = bars.length ? Math.max(2, Math.min(28, iw / n * .72 / nb)) : 0;
  return html`<div ref=${ref} style=${{ position: 'relative' }}><svg width=${w} height=${height} role="img" aria-label="chart" onPointerMove=${move} onPointerLeave=${() => setHov(null)} style=${{ display: 'block', touchAction: 'pan-y' }}>
    <defs>${series.map((s, i) => html`<linearGradient key=${i} id=${'g' + i + (s.id || '')} x1="0" x2="0" y1="0" y2="1"><stop offset="0" style=${{ stopColor: s.color, stopOpacity: .32 }}/><stop offset="1" style=${{ stopColor: s.color, stopOpacity: 0 }}/></linearGradient>`)}</defs>
    ${[0, 1, 2, 3, 4].map(i => { const v = mx * i / 4; return html`<g key=${i}><line x1=${m.l} x2=${w - m.r} y1=${y(v)} y2=${y(v)} style=${{ stroke: 'var(--line)' }}/><text x=${m.l - 8} y=${y(v) + 4} textAnchor="end" style=${{ fill: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>${fmt(v)}</text></g>`; })}
    ${labels.map((l, i) => i % every === 0 && html`<text key=${i} x=${xs(i)} y=${height - 8} textAnchor="middle" style=${{ fill: 'var(--faint)', fontSize: 10, fontFamily: 'var(--mono)' }}>${l}</text>`)}
    ${hline != null && html`<g><line x1=${m.l} x2=${w - m.r} y1=${y(hline)} y2=${y(hline)} strokeDasharray="4 4" style=${{ stroke: 'var(--crit)' }}/><text x=${w - m.r - 4} y=${y(hline) - 5} textAnchor="end" style=${{ fill: 'var(--crit)', fontSize: 10, fontFamily: 'var(--mono)' }}>${hlineLabel}</text></g>`}
    ${series.map((s, si) => { if (s.type === 'bar') { const bi = bars.indexOf(s); return html`<g key=${si}>${s.values.map((v, i) => html`<rect key=${i} x=${xs(i) - nb * bw / 2 + bi * bw} y=${y(v)} width=${bw - 1} height=${Math.max(0, m.t + ih - y(v))} rx="2" style=${{ fill: s.color, opacity: hov === i ? 1 : .82 }}/>`)}</g>`; }
      const pts = s.values.map((v, i) => `${xs(i)},${y(v)}`); const d = 'M' + pts.join('L');
      return html`<g key=${si}>${s.type === 'area' && html`<path d=${d + `L${xs(n - 1)},${m.t + ih}L${xs(0)},${m.t + ih}Z`} fill=${`url(#g${si}${s.id || ''})`}/>`}<path d=${d} fill="none" strokeWidth="1.8" strokeLinejoin="round" style=${{ stroke: s.color }}/><circle cx=${xs(n - 1)} cy=${y(s.values[n - 1])} r="3.2" style=${{ fill: s.color }}/></g>`; })}
    ${hov != null && html`<g><line x1=${xs(hov)} x2=${xs(hov)} y1=${m.t} y2=${m.t + ih} style=${{ stroke: 'var(--line2)' }}/>${series.filter(s => s.type !== 'bar').map((s, i) => html`<circle key=${i} cx=${xs(hov)} cy=${y(s.values[hov])} r="4" style=${{ fill: 'var(--bg)', stroke: s.color }} strokeWidth="2"/>`)}</g>`}
  </svg>${hov != null && html`<div className="ttip" style=${{ left: Math.min(w - 170, Math.max(4, xs(hov) + 12)), top: 4 }}><div className="mono faint" style=${{ fontSize: 11 }}>${labels[hov]}</div>${series.map((s, i) => html`<div key=${i} style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><i style=${{ width: 8, height: 8, borderRadius: 2, background: s.color }}></i><span className="muted">${s.name}</span><b className="mono" style=${{ marginLeft: 'auto' }}>${s.tfmt ? s.tfmt(s.values[hov]) : fmt(s.values[hov])}</b></div>`)}</div>`}</div>`;
}
function Donut({ data, size = 150, center, sub }) {
  const tot = data.reduce((s, d) => s + d.value, 0) || 1, R = size / 2 - 10; let a0 = -Math.PI / 2; const [h, setH] = useState(null);
  const arcs = data.map(d => { const a1 = a0 + d.value / tot * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, p = [a0, a1].map(a => [size / 2 + R * Math.cos(a), size / 2 + R * Math.sin(a)]); const path = d.value >= tot ? `M${size / 2},${size / 2 - R}a${R},${R} 0 1 1 -.01 0` : `M${p[0]}A${R},${R} 0 ${big} 1 ${p[1]}`; a0 = a1; return { ...d, path }; });
  return html`<div style=${{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}><svg width=${size} height=${size} role="img" aria-label="distribution">${arcs.map(a => a.value > 0 && html`<path key=${a.label} d=${a.path} fill="none" strokeWidth=${h === a.label ? 16 : 12} style=${{ stroke: a.color, transition: 'stroke-width .15s' }} onPointerEnter=${() => setH(a.label)} onPointerLeave=${() => setH(null)}/>`)}<text x=${size / 2} y=${size / 2 + 2} textAnchor="middle" style=${{ fill: 'var(--text)', fontFamily: 'var(--display)', fontSize: 30 }}>${h ? data.find(d => d.label === h).value : center}</text><text x=${size / 2} y=${size / 2 + 20} textAnchor="middle" style=${{ fill: 'var(--faint)', fontSize: 10 }}>${h || sub}</text></svg>
    <div style=${{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>${data.map(d => html`<div key=${d.label} style=${{ display: 'flex', gap: 8, alignItems: 'center' }}><i style=${{ width: 9, height: 9, borderRadius: 2, background: d.color }}></i><span className="muted" style=${{ minWidth: 70 }}>${d.label}</span><b className="mono">${d.value}</b></div>`)}</div></div>`;
}
function HBars({ rows, fmt = v => v, color = 'var(--accent)', onRow }) {
  const mx = Math.max(...rows.map(r => r.value), 1e-9);
  return html`<div>${rows.map(r => html`<div key=${r.label} className="rowbar" style=${{ cursor: onRow ? 'pointer' : 'default' }} onClick=${() => onRow && onRow(r)}><span className="muted" title=${r.label} style=${{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>${r.label}</span><div className="bar"><i style=${{ width: (r.value / mx * 100) + '%', background: r.color || color }}></i></div><span className="mono" style=${{ textAlign: 'right' }}>${fmt(r.value)}</span></div>`)}</div>`;
}
function Spark({ values, w = 110, h = 28, color = 'var(--accent)' }) {
  const mx = Math.max(...values, 1), mn = Math.min(...values, 0), x = i => 2 + i * (w - 4) / Math.max(values.length - 1, 1), y = v => h - 3 - (v - mn) / (mx - mn || 1) * (h - 6);
  return html`<svg width=${w} height=${h} aria-hidden="true"><path d=${'M' + values.map((v, i) => `${x(i)},${y(v)}`).join('L')} fill="none" strokeWidth="1.6" style=${{ stroke: color }}/><circle cx=${x(values.length - 1)} cy=${y(values[values.length - 1])} r="2.6" style=${{ fill: color }}/></svg>`;
}
function Heatmap({ matrix, rows, cols, fmt }) {
  const mx = Math.max(...matrix.flat(), 1), [h, setH] = useState(null);
  return html`<div style=${{ position: 'relative', overflowX: 'auto' }}><div style=${{ display: 'grid', gridTemplateColumns: `34px repeat(${cols.length},minmax(14px,1fr))`, gap: 2, minWidth: 440 }}>${rows.map((r, i) => html`<${Fragment} key=${r}><span className="faint mono" style=${{ fontSize: 10, alignSelf: 'center' }}>${r}</span>${cols.map((c, j) => html`<div key=${c} title=${`${r} ${c}: ${matrix[i][j]}`} style=${{ height: 22, borderRadius: 3, background: matrix[i][j] ? `color-mix(in srgb,var(--accent) ${Math.round(12 + matrix[i][j] / mx * 88)}%,transparent)` : 'var(--surface2)' }}></div>`)}<//>`)}<span></span>${cols.map((c, j) => html`<span key=${c} className="faint mono" style=${{ fontSize: 9, textAlign: 'center' }}>${j % 3 === 0 ? c : ''}</span>`)}</div></div>`;
}
function Waterfall({ ex, p, note = 'Additive log-odds contributions from a simulated logistic scorer. Not a trained model.' }) {
  const items = ex.contrib.slice(0, 8), mx = Math.max(...items.map(i => Math.abs(i.v)), .5);
  return html`<div><div style=${{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}><span style=${{ fontFamily: 'var(--display)', fontSize: 46, lineHeight: 1, color: p >= .75 ? 'var(--crit)' : p >= .5 ? 'var(--orange)' : 'var(--text)' }}>${pct(p, 1)}</span><span className="muted" style=${{ fontSize: 12 }}>fraud probability<br/>typical baseline ${pct(ex.baseP, 1)}</span></div>
    ${items.map(it => html`<div key=${it.k} style=${{ display: 'grid', gridTemplateColumns: 'minmax(120px,1.1fr) 1.4fr 56px', gap: 10, alignItems: 'center', margin: '7px 0', fontSize: 12 }}><span className="muted" style=${{ lineHeight: 1.25 }}>${it.label}</span><div style=${{ position: 'relative', height: 14 }}><i style=${{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--line2)' }}></i><i style=${{ position: 'absolute', top: 2, height: 10, borderRadius: 3, left: it.v >= 0 ? '50%' : (50 - Math.abs(it.v) / mx * 50) + '%', width: (Math.abs(it.v) / mx * 50) + '%', background: it.v >= 0 ? 'var(--crit)' : 'var(--ok)' }}></i></div><span className="mono" style=${{ textAlign: 'right', color: it.v >= 0 ? 'var(--crit)' : 'var(--ok)' }}>${it.v >= 0 ? '+' : ''}${it.v.toFixed(2)}</span></div>`)}
    <div className="faint" style=${{ fontSize: 11, marginTop: 8 }}>${note}</div></div>`;
}
function Ring({ score, band: b, size = 132 }) {
  const R = size / 2 - 8, C = 2 * Math.PI * R, off = C * (1 - score / 100);
  return html`<svg width=${size} height=${size} role="img" aria-label=${`Risk score ${score}`}><circle cx=${size / 2} cy=${size / 2} r=${R} fill="none" strokeWidth="8" style=${{ stroke: 'var(--surface2)' }}/><circle cx=${size / 2} cy=${size / 2} r=${R} fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray=${C} strokeDashoffset=${off} transform=${`rotate(-90 ${size / 2} ${size / 2})`} style=${{ stroke: bandColor[b], transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }}/><text x=${size / 2} y=${size / 2 + 8} textAnchor="middle" style=${{ fill: 'var(--text)', fontFamily: 'var(--display)', fontSize: size * .34 }}>${score}</text><text x=${size / 2} y=${size / 2 + size * .26} textAnchor="middle" style=${{ fill: 'var(--faint)', fontSize: 10, letterSpacing: '.12em' }}>${b.toUpperCase()}</text></svg>`;
}
function Evidence({ ids, onOpen }) { return html`<span>${ids.map(i => html`<button key=${i} className="ev" onClick=${() => onOpen && onOpen(i)}>${i}</button>`)}</span>`; }
function Note({ children }) { return html`<div className="notice">${children}</div>`; }
