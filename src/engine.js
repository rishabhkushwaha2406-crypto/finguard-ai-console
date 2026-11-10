'use strict';
/* ============================================================
   FinGuard AI  ·  client-side engine (synthetic data, no backend)
   Everything below is deterministic and computed in the browser.
   The `api` object at the bottom is the seam for a FastAPI backend.
   ============================================================ */
const H = 3600e3, D = 86400e3, IST = 5.5 * H;
const BASE = Date.UTC(2026, 10, 11, 5, 30);           // "now" = 11 Nov 2026, 11:00 IST
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad = n => String(n).padStart(2, '0');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sumAmt = l => l.reduce((s, t) => s + t.amt, 0);
const fmtTs = ts => { const d = new Date(ts + IST); return `${pad(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`; };
const fmtDay = ts => { const d = new Date(ts + IST); return `${pad(d.getUTCDate())} ${MON[d.getUTCMonth()]}`; };
const hourIST = ts => new Date(ts + IST).getUTCHours();
const dowIST = ts => new Date(ts + IST).getUTCDay();
const dayKey = ts => Math.floor((ts + IST) / D);
const fmtINR = n => { const a = Math.abs(n); let s; if (a >= 1e7) s = (a / 1e7).toFixed(2) + ' Cr'; else if (a >= 1e5) s = (a / 1e5).toFixed(2) + ' L'; else s = Math.round(a).toLocaleString('en-IN'); return (n < 0 ? '-' : '') + '₹' + s; };
const fmtFull = n => '₹' + Math.round(n).toLocaleString('en-IN');
const pct = (v, d = 0) => (v * 100).toFixed(d) + '%';
const sigmoid = z => 1 / (1 + Math.exp(-z));
const SEV_ORDER = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const CPRISK = { IN: .08, US: .12, GB: .12, SG: .15, AE: .35, TR: .45, HK: .4, CY: .6, SC: .7, KY: .75, PA: .8 };

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- synthetic dataset ---------- */
function buildDataset() {
  const rnd = mulberry32(7311);
  const R = (a, b) => a + (b - a) * rnd(), RI = (a, b) => Math.floor(R(a, b + 1)), pick = a => a[Math.floor(rnd() * a.length)];
  const FIRST = ['Aarav','Ishita','Rohan','Meera','Kabir','Ananya','Vihaan','Diya','Arjun','Sana','Neel','Tara','Yash','Riya','Dev','Naina','Karan','Pooja','Aditya','Sneha','Rahul','Kavya','Manish','Leena','Farhan','Isha','Varun','Anjali'];
  const LAST = ['Sharma','Iyer','Kulkarni','Menon','Patel','Reddy','Chatterjee','Nair','Gupta','Khan','Bose','Joshi','Rao','Mehta','Sinha','Desai','Pillai','Kapoor','Shetty','Verma','Das','Singh','Malhotra','Bhatt','Ghosh'];
  const OCC = [['Salaried employee', .1], ['Software engineer', .08], ['Physician', .12], ['Jeweller', .7], ['Real-estate broker', .65], ['Forex dealer', .78], ['Student', .2], ['Restaurant owner', .5], ['Commodity trader', .58], ['Management consultant', .3], ['School teacher', .08], ['Import-export trader', .62], ['Chartered accountant', .2], ['Logistics operator', .4]];
  const CITY = ['Mumbai','Pune','Bengaluru','Delhi','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Kochi'];
  const OV = {
    7: { occ: 'Jeweller', base: 820000, seg: 'SME', kyc: 'Verified' }, 12: { occ: 'Software engineer', base: 90000, seg: 'Retail', kyc: 'Verified' },
    19: { occ: 'Import-export trader', base: 700000, seg: 'SME', kyc: 'Pending' }, 23: { occ: 'Real-estate broker', base: 300000, seg: 'Retail', kyc: 'Expired', dormant: 240 },
    31: { occ: 'Commodity trader', base: 520000 }, 34: { occ: 'Restaurant owner', base: 480000 }, 38: { occ: 'Logistics operator', base: 560000 },
    41: { occ: 'Student', base: 40000, seg: 'Retail', kyc: 'Pending' }, 42: { occ: 'Salaried employee', base: 55000, kyc: 'Expired' }, 43: { occ: 'Salaried employee', base: 52000 }, 44: { occ: 'Forex dealer', base: 150000 },
    46: { occ: 'Management consultant', base: 260000 }, 50: { occ: 'Import-export trader', base: 800000, seg: 'SME' }, 58: { occ: 'School teacher', base: 45000, dormant: 210 }, 15: { occ: 'Chartered accountant', base: 240000 }, 27: { occ: 'Physician', base: 300000 }, 36: { occ: 'School teacher', base: 60000 }
  };
  const customers = [];
  for (let i = 1; i <= 60; i++) {
    const o = OV[i] || {}, occ = o.occ ? OCC.find(x => x[0] === o.occ) : pick(OCC);
    const base = o.base || Math.round(Math.exp(R(Math.log(40000), Math.log(700000))) / 1000) * 1000;
    const kycRoll = rnd();
    customers.push({
      id: 'C-' + (1000 + i), name: FIRST[(i * 3) % FIRST.length] + ' ' + LAST[(i * 7 + 3) % LAST.length], occ: occ[0], occRisk: occ[1],
      city: pick(CITY), country: i % 17 === 0 ? 'AE' : 'IN', geo: i % 17 === 0 ? .4 : R(.04, .2),
      kyc: o.kyc || (kycRoll < .82 ? 'Verified' : kycRoll < .92 ? 'Pending' : 'Expired'), seg: o.seg || (base > 400000 ? 'SME' : base > 200000 ? 'HNI' : 'Retail'),
      since: 2014 + (i % 11), base, dev: 'D-' + (2000 + i), dormantDays: o.dormant || 0, idx: i
    });
  }
  const cid = n => 'C-' + (1000 + n);
  const MERCH = ['Aurora Electronics','Metro Fuel','Saffron Table','Urban Grocer','Lumen Cabs','StreamBox','Kite Pharmacy','Harbor Books','Nimbus Airlines','Zen Fitness','Orchid Salon','Pixel Mobiles'];
  const BEN = ['Sunrise Traders','Bluepeak Logistics','K. Narayan & Co','Maple Interiors','Vertex Components','Ganga Textiles','Delta Mobility','Orion Packaging','Sahyadri Foods','Pinnacle Realty'];
  const FOREIGN = [['AE', 'Falcon Gate Trading'], ['SG', 'Merlion Supply Pte'], ['GB', 'Thames Ledger Ltd'], ['HK', 'Pearl Delta Co'], ['CY', 'Aegean Holdings'], ['PA', 'Meridian Holdings'], ['TR', 'Bosphorus Exports']];
  const raw = []; let uid = 0;
  const mkTx = (c, hoursAgo, dir, type, amt, cp, o = {}) => raw.push({ _u: uid++, c, ts: Math.round(BASE - hoursAgo * H), dir, type, amt: Math.round(amt), cp: cp.id, cpName: cp.name, cpC: cp.c || 'IN', ch: o.ch || (type === 'CASH_DEP' ? 'Branch' : type === 'CARD' ? 'POS' : pick(['Mobile', 'Mobile', 'Web', 'API'])), dev: o.dev || null, st: 'Completed', fraud: o.fraud || null });
  const merch = () => { const n = pick(MERCH); return { id: 'M-' + (3000 + MERCH.indexOf(n)), name: n }; };
  const ben = (k, idx = 0) => ({ id: 'B-' + (1100 + idx * 10 + (k % 10)), name: BEN[(k + idx) % BEN.length] });
  const fben = (k, idx = 0) => { const f = FOREIGN[k % FOREIGN.length]; return { id: 'B-' + (7000 + idx * 10 + (k % FOREIGN.length)), name: f[1], c: f[0] }; };
  const T = (a, b, hoursAgo, type, amt, o = {}) => { // both sides of a customer-to-customer transfer (a, b are customer numbers)
    const A = cid(a), B = cid(b);
    mkTx(A, hoursAgo, 'out', type, amt, { id: B, name: customers[b - 1].name }, { dev: o.dev, fraud: o.fraud, ch: o.ch });
    mkTx(B, hoursAgo - .01, 'in', type, amt, { id: A, name: customers[a - 1].name });
  };
  const skip = new Set([7, 12, 19, 23, 31, 34, 38, 41, 42, 43, 44, 46, 50, 58, 15, 27, 36]);

  // baseline behaviour
  customers.forEach(c => {
    if (c.dormantDays || skip.has(c.idx) && ![15, 27, 36].includes(c.idx)) return;
    const typ = c.base / 9, n = RI(5, 12), pool = [RI(0, 9), RI(0, 9), RI(0, 9), RI(0, 9)];
    const when = () => { const day = RI(0, 29), hr = rnd() < .93 ? RI(8, 22) : RI(0, 7); const d0 = Math.floor((BASE + IST) / D) * D - IST; let ts = d0 - day * D + hr * H + RI(0, 59) * 60000; if (ts > BASE - 600000) ts -= D; return (BASE - ts) / H; };
    if (rnd() < .72) mkTx(c.id, when(), 'in', 'NEFT', c.base * R(1, 1.25), { id: 'E-' + (500 + c.idx % 7), name: 'Employer / client payout' }, { ch: 'API' });
    for (let k = 0; k < n; k++) {
      const r = rnd();
      if (r < .36) mkTx(c.id, when(), 'out', 'UPI', clamp(typ * R(.03, .4), 120, 80000), merch());
      else if (r < .52) mkTx(c.id, when(), 'out', 'CARD', clamp(typ * R(.05, .7), 200, 90000), merch());
      else if (r < .68) mkTx(c.id, when(), 'out', 'IMPS', clamp(typ * R(.2, 1.1), 1500, 140000), ben(pick(pool), c.idx));
      else if (r < .8) mkTx(c.id, when(), 'out', 'NEFT', typ * R(.5, 1.8), ben(pick(pool), c.idx));
      else if (r < .86) mkTx(c.id, when(), 'in', 'CASH_DEP', clamp(typ * R(.2, 1.2), 3000, 280000), { id: 'BR-' + RI(1, 9), name: 'Branch cash counter' });
      else if (r < .91 && c.seg !== 'Retail') mkTx(c.id, when(), 'out', 'WIRE', typ * R(1, 2.6), fben(pick([0, 1, 2, 2]), c.idx));
      else { const peer = 1 + ((c.idx + RI(1, 58)) % 60); if (rnd() < .22 && peer !== c.idx && !skip.has(peer)) T(c.idx, peer, when(), 'UPI', clamp(typ * R(.04, .25), 300, 60000)); else mkTx(c.id, when(), 'out', 'UPI', typ * .1, merch()); }
    }
  });

  // S1 structuring
  [[118, 9.42], [96, 9.67], [70, 9.31], [52, 9.85], [30, 9.58]].forEach(([h, a], i) => mkTx(cid(7), h, 'in', 'CASH_DEP', a * 1e5, { id: 'BR-' + (2 + i % 3), name: 'Branch cash counter' }, { ch: 'Branch' }));
  for (let k = 0; k < 6; k++) mkTx(cid(7), RI(3, 600) / 20, 'out', 'UPI', RI(900, 9000), merch());
  // S2 velocity
  for (let k = 0; k < 19; k++) mkTx(cid(12), 40 - k * .33, 'out', k % 3 ? 'UPI' : 'IMPS', RI(1200, 19000), k % 3 ? merch() : ben(k, 12), { ch: 'Mobile' });
  mkTx(cid(12), 120, 'in', 'NEFT', 90000, { id: 'E-501', name: 'Employer / client payout' }, { ch: 'API' });
  // S3 rapid movement
  mkTx(cid(19), 60, 'in', 'WIRE', 18.5e5 * 1, { id: 'B-7000', name: 'Falcon Gate Trading', c: 'AE' }, { ch: 'API' });
  [[58.4, 6.1, 3], [57.3, 6.0, 4], [56.2, 5.9, 5]].forEach(([h, a, k]) => mkTx(cid(19), h, 'out', 'WIRE', a * 1e5, fben(k, 19), { ch: 'Web' }));
  mkTx(cid(19), 200, 'in', 'NEFT', 120000, { id: 'E-502', name: 'Employer / client payout' }, { ch: 'API' });
  // S4 dormant
  mkTx(cid(23), 30, 'in', 'WIRE', 7.8e5, { id: 'B-7001', name: 'Merlion Supply Pte', c: 'SG' }, { ch: 'API' });
  mkTx(cid(23), 26, 'out', 'NEFT', 7.7e5, ben(8, 23), { ch: 'Web' });
  mkTx(cid(58), 10, 'out', 'UPI', 12000, merch());
  // S5 circular transfers
  T(31, 34, 90, 'NEFT', 6.5e5); T(34, 38, 71, 'NEFT', 6.42e5); T(38, 31, 48, 'NEFT', 6.3e5);
  // S6/S9 mule collection and shared beneficiary
  const senders = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 16, 17, 18, 20];
  senders.forEach((s, k) => T(s, 41, 120 - k * 5.3, k % 2 ? 'UPI' : 'IMPS', RI(8, 38) * 1000, { fraud: k % 4 === 1 ? 'Authorized push payment scam' : null, ch: 'Mobile' }));
  for (let k = 0; k < 8; k++) mkTx(cid(41), 110 - k * 11, 'in', 'IMPS', RI(9, 35) * 1000, { id: 'S-' + (60 + k), name: 'External sender ' + (60 + k) }, { ch: 'API' });
  mkTx(cid(41), 9, 'out', 'NEFT', 5.4e5, { id: 'B-9001', name: 'Nexus Trade Solutions' }, { ch: 'Mobile', dev: 'D-0888' });
  [42, 43, 44].forEach((n, i) => {
    for (let k = 0; k < 5; k++) mkTx(cid(n), 70 - k * 9 - i * 2, 'in', 'IMPS', RI(12, 40) * 1000, { id: 'S-' + (80 + i * 5 + k), name: 'External sender ' + (80 + i * 5 + k) }, { ch: 'API' });
    mkTx(cid(n), 20 - i * 3, 'out', 'NEFT', (2.0 + i * .4) * 1e5, { id: 'B-9001', name: 'Nexus Trade Solutions' }, { ch: 'Mobile', dev: n === 44 ? 'D-0888' : 'D-0777' });
    mkTx(cid(n), 40 - i, 'out', 'UPI', 2400, merch(), { dev: n === 44 ? 'D-0888' : 'D-0777' });
  });
  // S7 unusual volume
  for (let k = 0; k < 9; k++) mkTx(cid(50), 120 - k * 12, 'out', k % 2 ? 'NEFT' : 'IMPS', RI(52, 90) * 1e4, ben(k + 2, 50), { ch: 'Web' });
  mkTx(cid(50), 280, 'in', 'CASH_DEP', 140000, { id: 'BR-3', name: 'Branch cash counter' });
  // S8 repeated beneficiary
  for (let k = 0; k < 7; k++) mkTx(cid(46), 70 - k * 10, 'out', 'IMPS', 49000, { id: 'B-9100', name: 'Kestrel Consulting' }, { ch: 'Mobile' });
  mkTx(cid(46), 300, 'in', 'NEFT', 260000, { id: 'E-503', name: 'Employer / client payout' });
  // fraud: account takeover, card-not-present, push-payment scam
  mkTx(cid(15), 19.8, 'out', 'WIRE', 9.4e5, fben(5, 15), { ch: 'Web', dev: 'D-9120', fraud: 'Account takeover' });
  mkTx(cid(15), 21.5, 'out', 'UPI', 85000, ben(3, 15), { ch: 'Mobile', dev: 'D-9120', fraud: 'Account takeover' });
  mkTx(cid(15), 200, 'in', 'NEFT', 240000, { id: 'E-504', name: 'Employer / client payout' });
  mkTx(cid(27), 33, 'out', 'CARD', 38000, { id: 'M-3900', name: 'Orbit Gadgets (overseas)', c: 'HK' }, { ch: 'Online', fraud: 'Card-not-present' });
  mkTx(cid(27), 32.8, 'out', 'CARD', 61500, { id: 'M-3901', name: 'LuxeStreet Online', c: 'CY' }, { ch: 'Online', fraud: 'Card-not-present' });
  mkTx(cid(27), 32.6, 'out', 'CARD', 52000, { id: 'M-3902', name: 'Nova Digital', c: 'HK' }, { ch: 'Online', fraud: 'Card-not-present' });
  mkTx(cid(27), 150, 'in', 'NEFT', 300000, { id: 'E-505', name: 'Employer / client payout' });
  mkTx(cid(36), 14, 'out', 'IMPS', 240000, { id: 'B-8801', name: 'Quick Prize Desk' }, { ch: 'Mobile', fraud: 'Authorized push payment scam' });
  mkTx(cid(36), 190, 'in', 'NEFT', 60000, { id: 'E-506', name: 'Employer / client payout' });
  // random account-takeover style fraud in baseline outbound transactions
  const cands = raw.filter(t => t.dir === 'out' && !t.fraud && (t.type === 'WIRE' || t.type === 'IMPS' || t.type === 'UPI' || t.type === 'CARD') && !skip.has(+t.c.slice(2) - 1000)).sort(() => rnd() - .5).slice(0, 11);
  cands.forEach((t, k) => {
    const sig = () => rnd() < .78;
    t.fraud = k % 3 === 0 ? 'Synthetic identity' : k % 3 === 1 ? 'Account takeover' : 'Card-not-present';
    if (sig()) t.dev = 'D-9' + (200 + k);
    if (sig()) { const d0 = Math.floor((t.ts + IST) / D) * D - IST; t.ts = d0 + RI(0, 4) * H + RI(2, 55) * 60000; if (t.ts > BASE) t.ts -= D; }
    const cu = customers[+t.c.slice(2) - 1001]; if (sig()) t.amt = Math.round(clamp(t.amt * R(4, 11), 20000, cu.base * 2.2));
    if (sig()) { const f = fben(k + 1); t.cp = 'B-8' + (200 + k); t.cpName = f[1] + ' (new)'; t.cpC = f.c; }
  });
  raw.forEach(t => { if (rnd() < .012 && !t.fraud) t.st = 'Failed'; });
  raw.sort((a, b) => a.ts - b.ts || a._u - b._u);
  raw.forEach((t, i) => { t.id = 'TX-' + (480100 + i); });
  return { customers, raw };
}

/* ---------- feature engineering + simulated fraud scorer ---------- */
const FW = { amt: 2.8, newBen: .7, night: 1.4, newDev: 2.6, geo: 2.0, vel: 1.5, xb: .6, typ: 1.0 };
const FB = -5.3;
const FLABEL = { amt: 'Amount vs customer norm', newBen: 'First payment to this beneficiary', night: 'Night-time activity (00:00–05:00 IST)', newDev: 'Unrecognised device', geo: 'Counterparty geography (simulated risk)', vel: 'Transactions in the previous hour', xb: 'Cross-border', typ: 'Payment type risk' };
const TYPE_RISK = { WIRE: .5, CARD: .35, IMPS: .3, NEFT: .15, UPI: .15, CASH_DEP: .2 };
function enrich(raw, customers) {
  const cm = {}; customers.forEach(c => cm[c.id] = c);
  const sorted = [...raw].sort((a, b) => a.ts - b.ts || a._u - b._u), hist = {}, seen = new Set();
  const out = sorted.map(t => {
    const c = cm[t.c], key = t.c + '|' + t.cp, newBen = t.dir === 'out' && !seen.has(key) ? 1 : 0; seen.add(key);
    const arr = hist[t.c] || (hist[t.c] = []); const vel = arr.filter(x => t.ts - x <= H && t.ts >= x).length; arr.push(t.ts);
    const hr = hourIST(t.ts), typical = c.base / 9;
    const feat = { amt: t.dir === 'out' ? clamp(Math.log(Math.max(t.amt / typical, 1)) / 3, 0, 1.5) : 0, newBen, night: hr >= 0 && hr < 5 ? 1 : 0, newDev: t.dev && t.dev !== c.dev && /^D-9/.test(t.dev) ? 1 : 0, geo: CPRISK[t.cpC] ?? .3, vel: clamp(vel / 6), xb: t.cpC !== 'IN' ? 1 : 0, typ: TYPE_RISK[t.type] ?? .2 };
    return { ...t, feat };
  });
  const mean = {}; Object.keys(FW).forEach(k => mean[k] = out.reduce((s, t) => s + t.feat[k], 0) / Math.max(out.length, 1));
  out.forEach(t => { let z = FB; Object.keys(FW).forEach(k => z += FW[k] * t.feat[k]); t.z = z; t.p = sigmoid(z); if (t.st === 'Completed' && t.p >= .85) t.st = 'Held'; });
  return { txns: out, mean };
}
function explainTx(t, mean) {
  const base = FB + Object.keys(FW).reduce((s, k) => s + FW[k] * mean[k], 0);
  const contrib = Object.keys(FW).map(k => ({ k, label: FLABEL[k], v: FW[k] * (t.feat[k] - mean[k]), x: t.feat[k] })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  return { base, contrib, baseP: sigmoid(base) };
}
function modelMetrics(txns, thr) {
  const lab = txns.map(t => [t.p, t.fraud ? 1 : 0]), P = lab.filter(x => x[1]).length, N = lab.length - P;
  const at = th => { let tp = 0, fp = 0; lab.forEach(([p, y]) => { if (p >= th) { y ? tp++ : fp++; } }); const fn = P - tp, tn = N - fp; const pr = tp + fp ? tp / (tp + fp) : 1, rc = P ? tp / P : 0; return { tp, fp, fn, tn, precision: pr, recall: rc, f1: pr + rc ? 2 * pr * rc / (pr + rc) : 0, fpr: N ? fp / N : 0 }; };
  const curve = []; for (let i = 0; i <= 50; i++) { const th = i / 50; curve.push({ th, ...at(th) }); }
  let auc = 0; for (let i = 1; i < curve.length; i++) auc += (curve[i - 1].fpr - curve[i].fpr) * (curve[i - 1].recall + curve[i].recall) / 2;
  let prauc = 0; for (let i = 1; i < curve.length; i++) prauc += (curve[i - 1].recall - curve[i].recall) * (curve[i - 1].precision + curve[i].precision) / 2;
  return { ...at(thr), P, N, curve, auc, prauc };
}

/* ---------- AML rule engine ---------- */
const DEFAULT_RULES = [
  { id: 'AML-001', name: 'Structuring / smurfing', severity: 'High', enabled: true, desc: 'Repeated cash deposits sitting just below the reporting threshold inside a short window.', params: { threshold: 1000000, band: .85, minCount: 3, windowH: 96 },
    schema: [['threshold', 'Reporting threshold', 500000, 1500000, 50000, fmtINR], ['band', 'Lower band (share of threshold)', .5, .98, .01, v => pct(v)], ['minCount', 'Minimum deposits', 2, 8, 1, v => v], ['windowH', 'Window (hours)', 24, 240, 12, v => v + 'h']] },
  { id: 'AML-002', name: 'High transaction velocity', severity: 'Medium', enabled: true, desc: 'An unusually large number of transactions from one customer in a short window.', params: { minCount: 12, windowH: 6 },
    schema: [['minCount', 'Transactions in window', 6, 30, 1, v => v], ['windowH', 'Window (hours)', 1, 24, 1, v => v + 'h']] },
  { id: 'AML-003', name: 'Rapid movement of funds', severity: 'High', enabled: true, desc: 'A large credit is moved out almost immediately, leaving little balance behind.', params: { minIn: 500000, pct: .85, windowH: 6 },
    schema: [['minIn', 'Minimum inbound amount', 200000, 3000000, 50000, fmtINR], ['pct', 'Share moved out', .5, 1, .01, v => pct(v)], ['windowH', 'Window (hours)', 1, 48, 1, v => v + 'h']] },
  { id: 'AML-004', name: 'Dormant account reactivation', severity: 'Medium', enabled: true, desc: 'A long-inactive account suddenly moves a significant amount.', params: { minDormant: 180, minAmt: 500000 },
    schema: [['minDormant', 'Dormant for at least (days)', 60, 365, 10, v => v + 'd'], ['minAmt', 'Minimum amount', 10000, 2000000, 10000, fmtINR]] },
  { id: 'AML-005', name: 'Circular money transfers', severity: 'Critical', enabled: true, desc: 'Funds travel through a loop of customers and return to the origin with similar amounts.', params: { minAmt: 100000, windowH: 120, tol: .25, maxLen: 4 },
    schema: [['minAmt', 'Minimum amount per hop', 20000, 1000000, 10000, fmtINR], ['windowH', 'Window (hours)', 24, 240, 12, v => v + 'h'], ['tol', 'Amount tolerance', .05, .6, .05, v => '±' + pct(v)], ['maxLen', 'Maximum loop length', 3, 5, 1, v => v]] },
  { id: 'AML-006', name: 'Unusual counterparty diversity', severity: 'High', enabled: true, desc: 'Many different senders pay one account in a short period, a common collection pattern.', params: { minCp: 15, windowH: 168 },
    schema: [['minCp', 'Distinct senders', 6, 40, 1, v => v], ['windowH', 'Window (hours)', 24, 336, 12, v => v + 'h']] },
  { id: 'AML-007', name: 'Unusual transaction volume', severity: 'Medium', enabled: true, desc: 'Outgoing value in a window far above the customer’s own weekly baseline.', params: { mult: 4, minAbs: 2000000, windowH: 168 },
    schema: [['mult', 'Multiple of weekly baseline', 2, 10, .5, v => v + '×'], ['minAbs', 'Minimum value in window', 500000, 6000000, 100000, fmtINR], ['windowH', 'Window (hours)', 48, 336, 24, v => v + 'h']] },
  { id: 'AML-008', name: 'Repeated transfers to one beneficiary', severity: 'Medium', enabled: true, desc: 'Many similar payments to the same beneficiary, often sized to stay under review limits.', params: { minCount: 5, windowH: 96, minAmt: 10000 },
    schema: [['minCount', 'Transfers in window', 3, 12, 1, v => v], ['windowH', 'Window (hours)', 24, 240, 12, v => v + 'h'], ['minAmt', 'Minimum amount each', 5000, 100000, 1000, fmtINR]] }
];
const byCust = txns => { const m = {}; txns.forEach(t => (m[t.c] || (m[t.c] = [])).push(t)); return m; };
function windows(list, win, minN) { const out = []; let i = 0; while (i < list.length) { let k = i; while (k < list.length && list[k].ts - list[i].ts <= win) k++; if (k - i >= minN) { out.push(list.slice(i, k)); i = k; } else i++; } return out; }
const RUN = {
  'AML-001': (p, g) => { const o = []; for (const c in g) { const dep = g[c].filter(t => t.type === 'CASH_DEP' && t.dir === 'in' && t.amt >= p.band * p.threshold && t.amt < p.threshold); windows(dep, p.windowH * H, p.minCount).forEach(w => o.push({ c, tx: w, ev: [`${w.length} cash deposits between ${fmtINR(p.band * p.threshold)} and ${fmtINR(p.threshold)} inside ${p.windowH}h`, `Total deposited ${fmtINR(sumAmt(w))} against a reporting threshold of ${fmtINR(p.threshold)}`] })); } return o; },
  'AML-002': (p, g) => { const o = []; for (const c in g) windows(g[c], p.windowH * H, p.minCount).forEach(w => o.push({ c, tx: w, ev: [`${w.length} transactions inside ${p.windowH}h`, `${new Set(w.map(t => t.cp)).size} different counterparties, total ${fmtINR(sumAmt(w))}`] })); return o; },
  'AML-003': (p, g) => { const o = []; for (const c in g) g[c].filter(t => t.dir === 'in' && t.amt >= p.minIn).forEach(i => { const outs = g[c].filter(t => t.dir === 'out' && t.ts > i.ts && t.ts - i.ts <= p.windowH * H), s = sumAmt(outs); if (outs.length && s >= p.pct * i.amt) o.push({ c, tx: [i, ...outs], ev: [`${fmtINR(i.amt)} credited from ${i.cpName} (${i.cpC})`, `${pct(s / i.amt)} sent onward in ${Math.max(1, Math.round((outs[outs.length - 1].ts - i.ts) / H * 10) / 10)}h across ${outs.length} payments`] }); }); return o; },
  'AML-004': (p, g, cm) => { const o = []; for (const c in g) { const cu = cm[c]; if (cu.dormantDays < p.minDormant) continue; const t = g[c].find(x => x.amt >= p.minAmt); if (t) o.push({ c, tx: g[c].filter(x => x.ts >= t.ts && x.ts - t.ts <= 48 * H), ev: [`Account inactive for ${cu.dormantDays} days before this activity`, `${fmtINR(t.amt)} ${t.dir === 'in' ? 'received from' : 'sent to'} ${t.cpName} (${t.cpC})`] }); } return o; },
  'AML-005': (p, g, cm, all) => {
    const edges = all.filter(t => t.dir === 'out' && cm[t.cp] && t.amt >= p.minAmt), src = {}; edges.forEach(e => (src[e.c] || (src[e.c] = [])).push(e));
    const o = [], seen = new Set();
    edges.forEach(e0 => { const path = [e0]; (function dfs() { const last = path[path.length - 1], node = last.cp; if (node === e0.c && path.length >= 3) { const key = path.map(e => e.c).sort().join('|'); if (!seen.has(key)) { seen.add(key); const cs = path.map(e => e.c).sort(), am = path.map(e => e.amt); o.push({ c: cs[0], tx: [...path], ev: [`${path.length}-party loop ${path.map(e => e.c).join(' → ')} → ${e0.c}`, `Amounts ${fmtINR(Math.min(...am))} to ${fmtINR(Math.max(...am))} over ${Math.round((path[path.length - 1].ts - e0.ts) / H)}h`] }); } return; } if (path.length >= p.maxLen) return; (src[node] || []).forEach(e => { if (e.ts >= last.ts && e.ts - e0.ts <= p.windowH * H && Math.abs(e.amt - e0.amt) <= p.tol * e0.amt && !path.some(x => x.c === e.c)) { path.push(e); dfs(); path.pop(); } }); })(); });
    return o;
  },
  'AML-006': (p, g) => { const o = []; for (const c in g) { const L = g[c].filter(t => t.dir === 'in'); let i = 0; while (i < L.length) { let k = i; const set = new Set(); while (k < L.length && L[k].ts - L[i].ts <= p.windowH * H) { set.add(L[k].cp); k++; } if (set.size >= p.minCp) { const w = L.slice(i, k); o.push({ c, tx: w, ev: [`${set.size} distinct senders paid this account in ${p.windowH}h`, `Total received ${fmtINR(sumAmt(w))}; ${w.length} credits`] }); i = k; } else i++; } } return o; },
  'AML-007': (p, g, cm) => { const o = []; for (const c in g) { const L = g[c].filter(t => t.dir === 'out'), wk = cm[c].base * 7 / 30; let i = 0; while (i < L.length) { let k = i, s = 0; while (k < L.length && L[k].ts - L[i].ts <= p.windowH * H) { s += L[k].amt; k++; } if (s >= Math.max(p.mult * wk, p.minAbs)) { o.push({ c, tx: L.slice(i, k), ev: [`${fmtINR(s)} sent in ${p.windowH}h`, `That is ${(s / wk).toFixed(1)}× this customer’s weekly baseline of ${fmtINR(wk)}`] }); i = k; } else i++; } } return o; },
  'AML-008': (p, g) => { const o = []; for (const c in g) { const m = {}; g[c].filter(t => t.dir === 'out' && t.cp[0] === 'B' && t.amt >= p.minAmt).forEach(t => (m[t.cp] || (m[t.cp] = [])).push(t)); for (const cp in m) windows(m[cp], p.windowH * H, p.minCount).forEach(w => o.push({ c, tx: w, ev: [`${w.length} transfers to ${w[0].cpName} (${cp}) inside ${p.windowH}h`, `Total ${fmtINR(sumAmt(w))}; each between ${fmtINR(Math.min(...w.map(t => t.amt)))} and ${fmtINR(Math.max(...w.map(t => t.amt)))}`] })); } return o; }
};
function runRules(txns, rules, customers) {
  const cm = {}; customers.forEach(c => cm[c.id] = c); const g = byCust(txns), alerts = [];
  rules.filter(r => r.enabled).forEach(r => RUN[r.id](r.params, g, cm, txns).forEach(h => {
    const tx = h.tx; alerts.push({ id: `AL-${r.id.slice(4)}-${h.c.slice(2)}-${tx[0].id.slice(3)}`, kind: 'AML', ruleId: r.id, title: r.name, severity: r.severity, c: h.c, txIds: tx.map(t => t.id), ts: Math.max(...tx.map(t => t.ts)), amount: sumAmt(tx), evidence: h.ev });
  }));
  return alerts.sort((a, b) => b.ts - a.ts);
}
function fraudAlerts(txns, thr, mean) {
  return txns.filter(t => t.p >= thr).map(t => { const ex = explainTx(t, mean); return { id: 'FR-' + t.id.slice(3), kind: 'Fraud', ruleId: 'ML-FRD', title: 'Fraud model flag', severity: t.p >= .9 ? 'Critical' : t.p >= .75 ? 'High' : 'Medium', c: t.c, txIds: [t.id], ts: t.ts, amount: t.amt, p: t.p, evidence: [`Simulated fraud score ${pct(t.p)} on ${t.type} of ${fmtINR(t.amt)}`, ...ex.contrib.filter(x => x.v > .25).slice(0, 3).map(x => `${x.label}: +${x.v.toFixed(2)} log-odds`)] }; }).sort((a, b) => b.ts - a.ts);
}

/* ---------- graph analytics ---------- */
function buildGraph(customers, txns) {
  const cm = {}; customers.forEach(c => cm[c.id] = c);
  const trans = {}, devC = {}, benC = {}, inCp = {}, inAmt = {}, outAmt = {};
  txns.forEach(t => {
    if (t.dir === 'out' && cm[t.cp]) { const k = t.c + '>' + t.cp; const e = trans[k] || (trans[k] = { a: t.c, b: t.cp, n: 0, amt: 0 }); e.n++; e.amt += t.amt; }
    if (t.dev) (devC[t.dev] || (devC[t.dev] = new Set())).add(t.c);
    if (t.dir === 'out' && t.cp[0] === 'B') (benC[t.cp] || (benC[t.cp] = { name: t.cpName, s: new Set() })).s.add(t.c);
    if (t.dir === 'in') { (inCp[t.c] || (inCp[t.c] = new Set())).add(t.cp); inAmt[t.c] = (inAmt[t.c] || 0) + t.amt; } else outAmt[t.c] = (outAmt[t.c] || 0) + t.amt;
  });
  const nodes = [], nid = new Set(), edges = [];
  const addN = n => { if (!nid.has(n.id)) { nid.add(n.id); nodes.push(n); } };
  Object.values(trans).forEach(e => { edges.push({ a: e.a, b: e.b, type: 'transfer', n: e.n, amt: e.amt }); });
  Object.entries(devC).forEach(([d, s]) => { if (s.size >= 2) { s.forEach(c => edges.push({ a: c, b: d, type: 'device' })); } });
  Object.entries(benC).forEach(([b, o]) => { if (o.s.size >= 2) o.s.forEach(c => edges.push({ a: c, b, type: 'beneficiary' })); });
  const deg = {}; edges.forEach(e => { deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; });
  customers.forEach(c => { if (deg[c.id]) addN({ id: c.id, type: 'cust', label: c.name }); });
  Object.keys(devC).forEach(d => { if (deg[d]) addN({ id: d, type: 'dev', label: 'Device ' + d }); });
  Object.entries(benC).forEach(([b, o]) => { if (deg[b]) addN({ id: b, type: 'ben', label: o.name }); });
  const par = {}; const find = x => (par[x] === undefined || par[x] === x) ? (par[x] = x) : (par[x] = find(par[x]));
  nodes.forEach(n => par[n.id] = n.id); edges.forEach(e => { par[find(e.a)] = find(e.b); });
  const comps = {}; nodes.forEach(n => (comps[find(n.id)] || (comps[find(n.id)] = [])).push(n.id));
  const compList = Object.values(comps).sort((a, b) => b.length - a.length).map((m, i) => ({ id: 'K' + (i + 1), members: m }));
  const compOf = {}; compList.forEach(k => k.members.forEach(m => compOf[m] = k.id));
  const N = nodes.length, central = {}; nodes.forEach(n => central[n.id] = (deg[n.id] || 0) / Math.max(N - 1, 1));
  // directed cycles among customers (length 3..4)
  const adj = {}; Object.values(trans).filter(e => e.amt >= 100000).forEach(e => (adj[e.a] || (adj[e.a] = [])).push(e.b));
  const cycles = [], seenC = new Set();
  Object.keys(adj).forEach(s => { const path = [s]; (function dfs() { const u = path[path.length - 1]; (adj[u] || []).forEach(v => { if (v === s && path.length >= 3) { const key = [...path].sort().join('|'); if (!seenC.has(key)) { seenC.add(key); cycles.push([...path]); } } else if (!path.includes(v) && path.length < 4) { path.push(v); dfs(); path.pop(); } }); })(); });
  const cycNodes = new Set(cycles.flat());
  const inCyc = {}; cycles.forEach(cy => cy.forEach(c => inCyc[c] = cy));
  const benShare = {}, devShare = {}; Object.values(benC).forEach(o => { if (o.s.size >= 2) o.s.forEach(c => benShare[c] = (benShare[c] || 0) + 1); }); Object.values(devC).forEach(s => { if (s.size >= 2) s.forEach(c => devShare[c] = (devShare[c] || 0) + 1); });
  const mules = {};
  customers.forEach(c => {
    const nIn = (inCp[c.id] || new Set()).size, ratio = outAmt[c.id] && inAmt[c.id] ? outAmt[c.id] / inAmt[c.id] : 0, ind = [];
    if (nIn >= 12) ind.push(`Received from ${nIn} distinct counterparties`);
    if (ratio >= .8 && inAmt[c.id] >= 300000) ind.push(`Moved ${pct(Math.min(ratio, 1.5))} of inflow back out`);
    if (benShare[c.id]) ind.push(`Pays a beneficiary also paid by other customers`);
    if (devShare[c.id]) ind.push('Shares a device with another customer');
    if (ind.length >= 2) mules[c.id] = { indicators: ind, strength: ind.length >= 3 ? 'Several indicators' : 'Some indicators' };
  });
  return { nodes, edges, comps: compList, compOf, central, deg, cycles, cycNodes, inCyc, benShare, devShare, benC, devC, mules, inCp };
}
function explainEdge(e, nm) {
  if (e.type === 'transfer') return `${nm(e.a)} sent ${e.n} transfer${e.n > 1 ? 's' : ''} to ${nm(e.b)} totalling ${fmtINR(e.amt)}.`;
  if (e.type === 'device') return `${nm(e.a)} and other customers used device ${e.b}. Shared devices occur in families and offices, so this is a link to review, not proof of wrongdoing.`;
  return `${nm(e.a)} paid beneficiary ${nm(e.b)}, who also received money from other customers.`;
}

/* ---------- customer risk ---------- */
const DEFAULT_WEIGHTS = { kyc: 15, geo: 12, occ: 10, behaviour: 15, velocity: 12, beneficiary: 10, network: 14, alerts: 12 };
const WLABEL = { kyc: 'KYC status', geo: 'Geographic indicators', occ: 'Occupation profile', behaviour: 'Transaction behaviour', velocity: 'Transaction velocity', beneficiary: 'Beneficiary exposure', network: 'Network connections', alerts: 'Historical alerts' };
const WDESC = { kyc: 'Verified, pending or expired identity checks', geo: 'Customer residency and counterparty countries (simulated indicators)', occ: 'Cash intensity and sector exposure of the stated occupation', behaviour: '30-day outflow against the customer’s own baseline', velocity: 'Peak transaction count in any 6 hour window', beneficiary: 'Beneficiaries shared with other customers', network: 'Graph degree, loops and shared devices', alerts: 'Severity-weighted alert history' };
const SEVW = { Critical: 3, High: 2, Medium: 1.2, Low: .5 };
const band = s => s >= 75 ? 'Critical' : s >= 50 ? 'High' : s >= 25 ? 'Medium' : 'Low';
function riskFor(c, ctx, W, cut = Infinity) {
  const L = (ctx.g[c.id] || []).filter(t => t.ts <= cut), al = ctx.alerts.filter(a => a.c === c.id && a.ts <= cut), tot = Object.values(W).reduce((a, b) => a + b, 0) || 1;
  const f = {}; f.kyc = { Verified: .05, Pending: .6, Expired: .8 }[c.kyc] ?? .5;
  const mean = L.length ? L.reduce((s, t) => s + (CPRISK[t.cpC] ?? .3), 0) / L.length : 0; f.geo = clamp(.5 * c.geo + .5 * clamp(mean * 2));
  f.occ = c.occRisk;
  const out30 = L.filter(t => t.dir === 'out' && t.ts > cut - 30 * D).reduce((s, t) => s + t.amt, 0); f.behaviour = clamp(out30 / (c.base * 2.5));
  let mx = 0; for (let i = 0; i < L.length; i++) { let k = i; while (k < L.length && L[k].ts - L[i].ts <= 6 * H) k++; mx = Math.max(mx, k - i); } f.velocity = clamp(mx / 12);
  f.beneficiary = clamp((ctx.graph.benShare[c.id] || 0) / 2);
  f.network = clamp(clamp((ctx.graph.deg[c.id] || 0) / 8) * .5 + (ctx.graph.cycNodes.has(c.id) ? .6 : 0) + (ctx.graph.devShare[c.id] ? .2 : 0));
  f.alerts = clamp(al.reduce((s, a) => s + SEVW[a.severity], 0) / 4);
  const parts = Object.keys(W).map(k => ({ k, label: WLABEL[k], f: f[k], v: W[k] * f[k] / tot * 100, w: W[k] / tot * 100 }));
  const score = Math.round(clamp(parts.reduce((s, p) => s + p.v, 0) * 2.1, 0, 100)); parts.forEach(p => p.v *= 2.1);
  return { score, band: band(score), parts };
}
function computeRisk(customers, ctx, W) { const m = {}; customers.forEach(c => m[c.id] = riskFor(c, ctx, W)); return m; }

/* ---------- misc helpers ---------- */
function toCSV(rows, cols) { const esc = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }; return [cols.map(c => c[0]).join(','), ...rows.map(r => cols.map(c => esc(c[1](r))).join(','))].join('\n'); }
function parseCSV(text) { const rows = []; let row = [], cur = '', q = false; for (let i = 0; i < text.length; i++) { const ch = text[i]; if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(x => x !== '')) rows.push(row); row = []; } else cur += ch; } row.push(cur); if (row.some(x => x !== '')) rows.push(row); return rows; }

/* ---------- copilot (deterministic, evidence-grounded) ---------- */
function copilot(intent, ctx) {
  const { alert, customer, tx, data } = ctx, B = [], ev = new Set(), miss = [];
  const cName = c => data.cm[c]?.name || c;
  const listTx = ids => ids.slice(0, 6).map(i => { const t = data.tm[i]; ev.add(i); return `${i} · ${fmtTs(t.ts)} · ${t.dir === 'in' ? 'in' : 'out'} ${t.type} ${fmtINR(t.amt)} · ${t.cpName}`; });
  if (intent === 'explainAlert' && alert) {
    ev.add(alert.id); B.push(['p', `${alert.id} (${alert.title}, ${alert.severity}) concerns ${cName(alert.c)} (${alert.c}). It matched on the following recorded evidence:`]); B.push(['ul', alert.evidence]);
    B.push(['p', `Transactions in scope (${alert.txIds.length}):`]); B.push(['ul', listTx(alert.txIds)]);
    const r = data.risk[alert.c]; if (r) { B.push(['p', `Current customer risk score is ${r.score} (${r.band}). Largest contributors: ${[...r.parts].sort((a, b) => b.v - a.v).slice(0, 3).map(p => `${p.label} ${p.v.toFixed(1)}`).join(', ')}.`]); }
    const cu = data.cm[alert.c]; if (cu && cu.kyc !== 'Verified') B.push(['p', `KYC status is ${cu.kyc}. This is recorded in the customer profile.`]);
    miss.push('Sanctions or watchlist screening results are not available in this demo.', 'Source-of-funds documents are not attached.');
  } else if (intent === 'summarizeCustomer' && customer) {
    const L = data.g[customer.id] || [], out = L.filter(t => t.dir === 'out'), inn = L.filter(t => t.dir === 'in'), r = data.risk[customer.id]; ev.add(customer.id);
    B.push(['p', `${customer.name} (${customer.id}) is a ${customer.seg} customer in ${customer.city}, ${customer.occ.toLowerCase()}, customer since ${customer.since}. KYC: ${customer.kyc}.`]);
    B.push(['p', `Over the last 30 days: ${L.length} transactions, ${fmtINR(sumAmt(inn))} in and ${fmtINR(sumAmt(out))} out. Typical monthly outflow for this profile is ${fmtINR(customer.base)}.`]);
    const top = {}; out.forEach(t => top[t.cpName] = (top[t.cpName] || 0) + t.amt); const tp = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (tp.length) B.push(['p', 'Largest counterparties by outgoing value: ' + tp.map(x => `${x[0]} ${fmtINR(x[1])}`).join('; ') + '.']);
    B.push(['p', `Risk score ${r.score} (${r.band}). Open alerts: ${data.alerts.filter(a => a.c === customer.id).map(a => a.id).join(', ') || 'none'}.`]);
    data.alerts.filter(a => a.c === customer.id).forEach(a => ev.add(a.id));
    if (data.graph.mules[customer.id]) B.push(['p', 'Graph indicators worth reviewing (these are indicators, not findings): ' + data.graph.mules[customer.id].indicators.join('; ') + '.']);
    miss.push('Employment and income documents are not available.', 'Watchlist screening is not available.');
  } else if (intent === 'explainTx' && tx) {
    const ex = explainTx(tx, data.mean); ev.add(tx.id);
    B.push(['p', `${tx.id}: ${tx.dir === 'in' ? 'credit' : 'debit'} of ${fmtINR(tx.amt)} by ${tx.type} for ${cName(tx.c)} on ${fmtTs(tx.ts)} IST, counterparty ${tx.cpName} (${tx.cpC}). The simulated scorer gives a fraud probability of ${pct(tx.p, 1)} against a typical baseline of ${pct(ex.baseP, 1)}.`]);
    B.push(['p', 'Features pushing the score up:']); B.push(['ul', ex.contrib.filter(x => x.v > .05).slice(0, 4).map(x => `${x.label}: +${x.v.toFixed(2)} log-odds`)]);
    const dn = ex.contrib.filter(x => x.v < -.05).slice(0, 2); if (dn.length) { B.push(['p', 'Features pulling it down:']); B.push(['ul', dn.map(x => `${x.label}: ${x.v.toFixed(2)} log-odds`)]); }
    miss.push('Device fingerprint details beyond the device ID are not available.', 'The customer has not been contacted; no confirmation of intent exists.');
  } else if (intent === 'checks' && alert) {
    ev.add(alert.id); const cu = data.cm[alert.c]; const s = [];
    s.push('Confirm the customer’s expected activity against the KYC profile and stated occupation.');
    if (alert.ruleId === 'AML-001') s.push('Request the source of the cash and review branch footage references and deposit slips for the listed dates.');
    if (alert.ruleId === 'AML-005') s.push('Review every customer in the loop for a common introducer, address or beneficiary.');
    if (alert.ruleId === 'AML-003' || alert.ruleId === 'AML-004') s.push('Obtain the commercial rationale and supporting invoice for the inbound and outbound wires.');
    if (alert.ruleId === 'AML-006' || alert.ruleId === 'AML-008') s.push('Check the beneficiary’s other inbound relationships and any shared devices in the graph view.');
    if (alert.kind === 'Fraud') s.push('Contact the customer through a verified channel to confirm the transaction before releasing any hold.');
    if (cu.kyc !== 'Verified') s.push(`Complete KYC refresh; status is currently ${cu.kyc}.`);
    s.push('Record the outcome in the case notes before changing the disposition.');
    B.push(['p', `Suggested next checks for ${alert.id}, based only on the evidence on file:`]); B.push(['ul', s]);
    miss.push('Whether the counterparty appears on any watchlist cannot be determined here.');
  } else if (intent === 'report' && alert) {
    const cu = data.cm[alert.c], r = data.risk[alert.c]; ev.add(alert.id); ev.add(alert.c);
    B.push(['h', 'Investigation summary (draft)']);
    B.push(['p', `Alert ${alert.id} · ${alert.title} · severity ${alert.severity} · raised ${fmtTs(alert.ts)} IST.`]);
    B.push(['h', 'Subject']); B.push(['p', `${cu.name} (${cu.id}), ${cu.occ}, ${cu.seg}, ${cu.city}. KYC ${cu.kyc}. Risk score ${r.score} (${r.band}).`]);
    B.push(['h', 'Evidence']); B.push(['ul', alert.evidence]); B.push(['ul', listTx(alert.txIds)]);
    B.push(['h', 'Information not available']); B.push(['ul', ['Watchlist and sanctions screening results', 'Customer explanation', 'Supporting documents']]);
    B.push(['h', 'Disposition']); B.push(['p', 'Not decided. A human investigator must review this draft and record a disposition. This tool does not file SAR or STR reports.']);
  } else {
    B.push(['p', 'I can explain an alert, a transaction or a customer using only the records in this workspace. Select a context on the right, or mention an ID such as ' + data.alerts[0].id + ', ' + data.txns[data.txns.length - 1].id + ' or ' + data.customers[40].id + '.']);
  }
  if (miss.length && intent !== 'report') { B.push(['p', 'Not available in the data I can see:']); B.push(['ul', miss]); }
  B.push(['note', 'Draft for human review. Generated by deterministic templates from application records. No external language model is connected.']);
  return { blocks: B, evidence: [...ev] };
}

/* ---------- backend seam ---------- */
const API_CONTRACT = [
  ['POST', '/auth/login', 'Local role switch in Settings'], ['GET', '/customers', 'dataset.customers'], ['GET', '/customers/{id}/risk', 'computeRisk()'],
  ['GET', '/transactions', 'dataset.txns'], ['POST', '/transactions/upload', 'Data Management validator'], ['GET', '/aml/rules', 'DEFAULT_RULES'], ['POST', '/aml/run-monitoring', 'runRules()'],
  ['POST', '/fraud/predict', 'enrich() simulated scorer'], ['GET', '/fraud/model-metrics', 'modelMetrics()'], ['GET', '/alerts', 'runRules() + fraudAlerts()'],
  ['POST', '/cases', 'store.createCase()'], ['PATCH', '/cases/{id}', 'store.updateCase()'], ['POST', '/cases/{id}/events', 'store.addNote()'],
  ['GET', '/analytics/overview', 'Overview selectors'], ['POST', '/ai/explain', 'copilot()'], ['POST', '/ai/investigation-summary', 'copilot("report")']
];
