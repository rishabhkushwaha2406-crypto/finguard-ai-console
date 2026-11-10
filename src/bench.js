
/* ============================================================
   Benchmark data: PaySim-style generator, Kaggle importers,
   columnar query engine and an in-browser trained model.
   ============================================================ */
const PS_TYPES = ['PAYMENT', 'TRANSFER', 'CASH_OUT', 'DEBIT', 'CASH_IN'];
const PS_FIELDS = 'step,type,amount,nameOrig,oldbalanceOrg,newbalanceOrig,nameDest,oldbalanceDest,newbalanceDest,isFraud,isFlaggedFraud';
function newStore(kind, n) {
  const S = { kind, n, names: [], nameIdx: new Map(), meta: {} };
  if (kind === 'paysim') Object.assign(S, { step: new Uint16Array(n), type: new Uint8Array(n), amount: new Float64Array(n), orig: new Uint32Array(n), dest: new Uint32Array(n), oldO: new Float64Array(n), newO: new Float64Array(n), oldD: new Float64Array(n), newD: new Float64Array(n), fraud: new Uint8Array(n), flagged: new Uint8Array(n) });
  return S;
}
const nameId = (S, s) => { let i = S.nameIdx.get(s); if (i === undefined) { i = S.names.length; S.names.push(s); S.nameIdx.set(s, i); } return i; };

/* PaySim-style simulator. Calibrated to the published PaySim summary statistics:
   type mix (CASH_OUT 35%, PAYMENT 34%, CASH_IN 22%, TRANSFER 8%, DEBIT 0.65%), 743 hourly steps,
   fraud only in TRANSFER and CASH_OUT (~0.13%), fraud drains the whole balance and is cashed out via a mule,
   and a rule-based flag that almost never fires. It is NOT the Kaggle file. */
function genPaySim(n = 120000, seed = 2026) {
  const rnd = mulberry32(seed), S = newStore('paysim', n), R = (a, b) => a + (b - a) * rnd();
  const ln = (mu, sg) => { const u = rnd() || 1e-9, v = rnd(); return Math.exp(Math.log(mu) + sg * Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185 * v)); };
  const cust = [], merch = []; const cName = () => 'C' + (100000000 + Math.floor(rnd() * 900000000)), mName = () => 'M' + (100000000 + Math.floor(rnd() * 900000000));
  const newC = () => { const i = nameId(S, cName()); cust.push(i); return i; }, newM = () => { const i = nameId(S, mName()); merch.push(i); return i; };
  const hubC = () => cust.length && rnd() < .55 ? cust[Math.floor(Math.pow(rnd(), 2.2) * cust.length)] : newC(), hubM = () => merch.length > 200 || (merch.length && rnd() < .8) ? merch[Math.floor(Math.pow(rnd(), 1.6) * merch.length)] : newM();
  // sorted hourly steps with a night-time dip
  const w = []; let tot = 0; for (let s = 1; s <= 743; s++) { const h = (s - 1) % 24, x = (h < 8 ? .22 : 1) * (s < 30 ? .6 : 1); tot += x; w.push(tot); }
  const steps = new Uint16Array(n); for (let i = 0; i < n; i++) { const r = rnd() * tot; let lo = 0, hi = 742; while (lo < hi) { const m = (lo + hi) >> 1; w[m] < r ? lo = m + 1 : hi = m; } steps[i] = lo + 1; } steps.sort();
  const put = (i, type, amt, o, d, oO, nO, oD, nD, fr = 0, fl = 0) => { S.step[i] = steps[i]; S.type[i] = type; S.amount[i] = Math.round(amt * 100) / 100; S.orig[i] = o; S.dest[i] = d; S.oldO[i] = oO; S.newO[i] = nO; S.oldD[i] = oD; S.newD[i] = nD; S.fraud[i] = fr; S.flagged[i] = fl; };
  const used = new Uint8Array(n), nF = Math.round(n * .00065), nL = Math.round(n * .0008), pairs = [];
  const slot = () => { for (let t = 0; t < 50; t++) { const i = Math.floor(rnd() * (n - 6)); if (!used[i] && !used[i + 1] && !used[i + 2]) { used[i] = used[i + 1] = used[i + 2] = 1; return i; } } return -1; };
  const fraudAmt = () => rnd() < .08 ? 1e7 : Math.min(1e7, Math.max(1500, ln(520000, 1.15)));
  const mules = [];
  for (let k = 0; k < nF; k++) { const i = slot(); if (i < 0) continue; const A = Math.round(fraudAmt() * 100) / 100, victim = newC(), reuse = mules.length && rnd() < .12, mule = reuse ? mules[Math.floor(rnd() * mules.length)] : newC(); if (!reuse) mules.push(mule); const agent = hubC();
    const ob = rnd() < .22 ? A * (1 + R(.05, 2)) : A; if (rnd() < .82) { put(i, 1, A, victim, mule, ob, ob - A, 0, rnd() < .7 ? 0 : A, 1, A > 2e5 && rnd() < .01 ? 1 : 0); const od = Math.round(R(0, 3e6)); put(i + 1 + (rnd() < .3 ? 1 : 0), 2, A, mule, agent, A, 0, od, od + A, 1, 0); pairs.push(i); } else { const od = Math.round(R(0, 3e6)); put(i, 2, A, victim, agent, ob, ob - A, od, od + A, 1, 0); } }
  for (let k = 0; k < nL; k++) { const i = slot(); if (i < 0) continue; const B = Math.round(ln(330000, 1.0)), x = hubC(), y = newC(), z = hubC(), ob = B * (1 + R(0, 3)), od = Math.round(R(0, 2e6)); put(i, 1, B, x, y, ob, ob - B, od, od + B); const C2 = Math.round(B * R(.3, 1)); put(i + 1 + (rnd() < .3 ? 1 : 0), 2, C2, y, z, B + R(0, 5e4), Math.max(0, B - C2), Math.round(R(0, 2e6)), 0 + Math.round(R(0, 2e6)) + C2); }
  const cum = [.3382, .4222, .7739, .7804, 1]; // PAYMENT, TRANSFER(.084), CASH_OUT, DEBIT, CASH_IN
  for (let i = 0; i < n; i++) { if (S.amount[i] > 0 || used[i]) { if (S.amount[i] > 0) continue; }
    const r = rnd(); let t = 0; while (r > cum[t]) t++;
    const mu = [9500, 480000, 120000, 3000, 120000][t], sg = [.9, 1.0, 1.0, 1.1, .9][t]; let amt = Math.min(9.2e7, Math.max(2, ln(mu, sg)));
    const reuseO = cust.length && rnd() < .04, o = reuseO ? cust[Math.floor(rnd() * cust.length)] : newC();
    let oO = amt * (1 + (-Math.log(rnd() || 1e-9)) * 2.2); if ((t === 1 || t === 2) && rnd() < .25) oO = amt; if (rnd() < .04) { oO = 0; if (t !== 4) amt = Math.min(amt, 1); }
    if (t === 0) put(i, 0, amt, o, hubM(), oO, oO - amt, 0, 0);
    else if (t === 4) { const oD = amt * (1 + R(0, 4)); put(i, 4, amt, o, hubC(), oO, oO + amt, oD, Math.max(0, oD - amt)); }
    else { const d = hubC(), oD = rnd() < .4 ? 0 : Math.round(R(0, 4e6)), nD = rnd() < .07 ? oD : oD + amt; put(i, t, amt, o, d, oO, Math.max(0, oO - amt), oD, nD); } }
  S.meta = { label: 'PaySim-style synthetic benchmark', source: 'Generated in this browser, calibrated to published PaySim statistics. Not the Kaggle file.', synthetic: true, sampling: 'Full simulation, no sampling' };
  return S;
}

/* streaming importer for the real Kaggle files (PaySim and Credit Card Fraud) */
async function importKaggle(file, onProgress, cap = 150000) {
  const CH = 8 * 1048576; let off = 0, carry = '', header = null, kind = null, rate = 1, rows = 0, kept = 0, fraudKept = 0; const rnd = mulberry32(5);
  const P = { step: [], type: [], amount: [], orig: [], dest: [], oldO: [], newO: [], oldD: [], newD: [], fraud: [], flagged: [] }, C = { time: [], amount: [], cls: [], v: [] }, S0 = { names: [], nameIdx: new Map() };
  while (off < file.size) {
    const chunk = await file.slice(off, off + CH).text(); off += CH; let txt = carry + chunk; const nl = off < file.size ? txt.lastIndexOf('\n') : txt.length; carry = off < file.size ? txt.slice(nl + 1) : ''; txt = txt.slice(0, nl);
    const lines = txt.split('\n');
    for (let li = 0; li < lines.length; li++) {
      let line = lines[li]; if (!line || line === '\r') continue; if (line.indexOf('"') >= 0) line = line.replace(/"/g, ''); const f = line.replace('\r', '').split(',');
      if (!header) { header = f.map(x => x.trim()); if (header.includes('nameOrig') && header.includes('isFraud')) kind = 'paysim'; else if (header.includes('Class') && header.includes('V1')) kind = 'creditcard'; else throw new Error('Unrecognised file. Expected the PaySim or Credit Card Fraud CSV header.'); if (kind === 'paysim') rate = 1; continue; }
      rows++;
      if (kind === 'paysim') {
        if (f.length < 11) continue; const fr = +f[9]; if (!fr && rate < 1 && rnd() > rate) continue; if (!fr && kept >= cap) continue;
        P.step.push(+f[0]); P.type.push(PS_TYPES.indexOf(f[1])); P.amount.push(+f[2]); P.orig.push(nameId(S0, f[3])); P.oldO.push(+f[4]); P.newO.push(+f[5]); P.dest.push(nameId(S0, f[6])); P.oldD.push(+f[7]); P.newD.push(+f[8]); P.fraud.push(fr); P.flagged.push(+f[10]); kept++; fraudKept += fr;
      } else { if (f.length < 31) continue; C.time.push(+f[0]); for (let k = 1; k <= 28; k++) C.v.push(+f[k]); C.amount.push(+f[29]); C.cls.push(+f[30]); kept++; fraudKept += +f[30]; }
    }
    if (kind === 'paysim' && off <= CH * 1 + 1) { const avg = chunk.length / Math.max(1, rows); const est = file.size / avg; rate = Math.min(1, cap * .9 / est); }
    onProgress && onProgress(Math.min(1, off / file.size), rows, kept);
    await new Promise(r => setTimeout(r, 0));
  }
  if (!kind) throw new Error('The file is empty.');
  if (kind === 'paysim') {
    const n = kept, S = newStore('paysim', n); S.names = S0.names; S.nameIdx = S0.nameIdx; for (const k of ['step', 'type', 'amount', 'orig', 'dest', 'oldO', 'newO', 'oldD', 'newD', 'fraud', 'flagged']) S[k].set(P[k]);
    S.meta = { label: 'PaySim (Kaggle import)', source: file.name, synthetic: false, sampling: rate < 1 ? `All ${fraudKept} fraud rows plus a ${(rate * 100).toFixed(1)}% random sample of other rows (${rows.toLocaleString()} rows read)` : `All ${rows.toLocaleString()} rows kept` }; return S;
  }
  const n = kept, S = { kind: 'creditcard', n, time: Float64Array.from(C.time), amount: Float64Array.from(C.amount), cls: Uint8Array.from(C.cls), v: Float32Array.from(C.v), names: [], nameIdx: new Map(), meta: { label: 'Credit Card Fraud (Kaggle import)', source: file.name, synthetic: false, sampling: `All ${rows.toLocaleString()} rows kept` } }; return S;
}
function psCSV(S, max = 1e9) { const out = [PS_FIELDS]; for (let i = 0; i < Math.min(S.n, max); i++) out.push([S.step[i], PS_TYPES[S.type[i]], S.amount[i], S.names[S.orig[i]], S.oldO[i], S.newO[i], S.names[S.dest[i]], S.oldD[i], S.newD[i], S.fraud[i], S.flagged[i]].join(',')); return out.join('\n'); }

/* query engine over columns */
function benchQuery(S, f) {
  const out = []; let acct = null; if (f.acct) { const t = f.acct.trim().toUpperCase(); acct = new Set(); if (t) for (let i = 0; i < S.names.length; i++) if (S.names[i].toUpperCase().includes(t)) { acct.add(i); if (acct.size > 5000) break; } }
  const tm = f.types && f.types.length < 5 ? new Set(f.types) : null;
  for (let i = 0; i < S.n; i++) {
    if (S.kind === 'paysim') {
      if (tm && !tm.has(S.type[i])) continue; const s = S.step[i]; if (s < f.stepMin || s > f.stepMax) continue; const a = S.amount[i]; if (a < f.amtMin || a > f.amtMax) continue;
      if (f.fraudOnly && !S.fraud[i]) continue; if (f.flaggedOnly && !S.flagged[i]) continue; if (f.drain && !(S.newO[i] === 0 && S.oldO[i] === S.amount[i])) continue; if (acct && !acct.has(S.orig[i]) && !acct.has(S.dest[i])) continue;
    } else { const a = S.amount[i]; if (a < f.amtMin || a > f.amtMax) continue; if (f.fraudOnly && !S.cls[i]) continue; const s = Math.floor(S.time[i] / 3600) + 1; if (s < f.stepMin || s > f.stepMax) continue; }
    out.push(i);
  }
  return Uint32Array.from(out);
}
function benchSort(S, idx, key, dir) {
  const col = { step: S.step, type: S.type, amount: S.amount, oldO: S.oldO, newO: S.newO, fraud: S.fraud || S.cls, time: S.time, row: null, score: S.score }[key]; const a = Array.from(idx), m = dir === 'asc' ? 1 : -1;
  if (!col) return m === 1 ? idx : Uint32Array.from(a.reverse()); a.sort((x, y) => (col[x] - col[y]) * m || x - y); return Uint32Array.from(a);
}
function benchAgg(S, idx) {
  const A = { n: idx.length, sum: 0, fraud: 0, flagged: 0, byType: PS_TYPES.map(() => ({ n: 0, sum: 0, fraud: 0 })), byDay: Array.from({ length: 32 }, () => ({ n: 0, v: 0, f: 0 })), byHour: Array.from({ length: 24 }, () => ({ n: 0, f: 0 })), hist: Array.from({ length: 14 }, () => ({ n: 0, f: 0 })) };
  for (let k = 0; k < idx.length; k++) { const i = idx[k], a = S.amount[i], fr = S.kind === 'paysim' ? S.fraud[i] : S.cls[i], step = S.kind === 'paysim' ? S.step[i] : Math.floor(S.time[i] / 3600) + 1; A.sum += a; A.fraud += fr; if (S.kind === 'paysim') { A.flagged += S.flagged[i]; const t = A.byType[S.type[i]]; t.n++; t.sum += a; t.fraud += fr; }
    const d = A.byDay[Math.min(31, Math.floor((step - 1) / 24))]; d.n++; d.v += a; d.f += fr; const h = A.byHour[(step - 1) % 24]; h.n++; h.f += fr; const b = Math.max(0, Math.min(13, Math.floor(Math.log10(Math.max(a, 1)) * 2))); A.hist[b].n++; A.hist[b].f += fr; }
  return A;
}
function acctIndex(S) { if (S._ai) return S._ai; const m = new Map(); const add = (a, i) => { let l = m.get(a); if (!l) m.set(a, l = []); l.push(i); }; for (let i = 0; i < S.n; i++) { add(S.orig[i], i); add(S.dest[i], i); } return S._ai = m; }
function chainPartner(S, i) {
  const ai = acctIndex(S), t = S.type[i], a = S.amount[i];
  if (t === 1) { const l = ai.get(S.dest[i]) || []; return l.find(j => S.type[j] === 2 && S.orig[j] === S.dest[i] && S.step[j] >= S.step[i] && Math.abs(S.amount[j] - a) <= .02 * a + 1 && j !== i); }
  if (t === 2) { const l = ai.get(S.orig[i]) || []; return l.find(j => S.type[j] === 1 && S.dest[j] === S.orig[i] && S.step[j] <= S.step[i] && Math.abs(S.amount[j] - a) <= .02 * a + 1 && j !== i); }
}

/* in-browser logistic regression, time-aware split */
const BF = ['Is TRANSFER', 'Log amount', 'Drains the whole balance', 'Origin balance mismatch', 'Destination balance mismatch', 'Destination untouched (0 → 0)', 'Origin balance equals amount', 'Log origin balance', 'Log destination balance'];
function benchFeat(S, i) { const a = S.amount[i], oO = S.oldO[i], nO = S.newO[i], oD = S.oldD[i], nD = S.newD[i]; return [S.type[i] === 1 ? 1 : 0, Math.log1p(a), nO === 0 && oO === a ? 1 : 0, Math.min(1, Math.abs(nO + a - oO) / (a + 1)), Math.min(1, Math.abs(oD + a - nD) / (a + 1)), oD === 0 && nD === 0 ? 1 : 0, oO === a ? 1 : 0, Math.log1p(oO), Math.log1p(oD)]; }
function curveMetrics(sc, y, thr) {
  const P = y.reduce((s, v) => s + v, 0), N = y.length - P, at = th => { let tp = 0, fp = 0; for (let i = 0; i < y.length; i++) if (sc[i] >= th) y[i] ? tp++ : fp++; const fn = P - tp, pr = tp + fp ? tp / (tp + fp) : 1, rc = P ? tp / P : 0; return { tp, fp, fn, tn: N - fp, precision: pr, recall: rc, f1: pr + rc ? 2 * pr * rc / (pr + rc) : 0, fpr: N ? fp / N : 0 }; };
  const curve = []; for (let i = 0; i <= 50; i++) curve.push({ th: i / 50, ...at(i / 50) });
  const ord = y.map((_, i) => i).sort((a, b) => sc[b] - sc[a]); let tp = 0, fp = 0, ap = 0, pr0 = 0, auc = 0, pf = 0, pt = 0;
  for (let k = 0; k < ord.length; k++) { const i = ord[k]; y[i] ? tp++ : fp++; if (k + 1 < ord.length && sc[ord[k + 1]] === sc[i]) continue; const rc = P ? tp / P : 0, pc = tp / (tp + fp), fr = N ? fp / N : 0; ap += (rc - pr0) * pc; pr0 = rc; auc += (fr - pf) * (rc + pt) / 2; pf = fr; pt = rc; }
  return { ...at(thr), P, N, auc, prauc: ap, curve };
}
function trainBench(S) {
  const rows = []; for (let i = 0; i < S.n; i++) if (S.type[i] === 1 || S.type[i] === 2) rows.push(i); const steps = rows.map(i => S.step[i]).sort((a, b) => a - b), cut = steps[Math.floor(steps.length * .7)];
  const X = rows.map(i => benchFeat(S, i)), y = rows.map(i => S.fraud[i]), d = X[0].length, tr = [], te = []; rows.forEach((i, k) => (S.step[i] <= cut ? tr : te).push(k));
  const mean = Array(d).fill(0), sd = Array(d).fill(0); tr.forEach(k => X[k].forEach((v, j) => mean[j] += v / tr.length)); tr.forEach(k => X[k].forEach((v, j) => sd[j] += (v - mean[j]) ** 2 / tr.length)); sd.forEach((v, j) => sd[j] = Math.sqrt(v) || 1);
  const Z = X.map(r => r.map((v, j) => (v - mean[j]) / sd[j])), w = Array(d).fill(0); let b = -3; const pos = tr.filter(k => y[k]).length, wp = Math.min(40, (tr.length - pos) / Math.max(pos, 1));
  for (let it = 0; it < 220; it++) { const g = Array(d).fill(0); let gb = 0; for (const k of tr) { let z = b; const r = Z[k]; for (let j = 0; j < d; j++) z += w[j] * r[j]; const p = 1 / (1 + Math.exp(-z)), e = (p - y[k]) * (y[k] ? wp : 1); for (let j = 0; j < d; j++) g[j] += e * r[j]; gb += e; } const nrm = tr.length + pos * (wp - 1); for (let j = 0; j < d; j++) w[j] -= .6 * (g[j] / nrm + 1e-3 * w[j]); b -= .6 * gb / nrm; }
  const score = k => { let z = b; for (let j = 0; j < d; j++) z += w[j] * Z[k][j]; return 1 / (1 + Math.exp(-z)); };
  const trS = tr.map(score), trY = tr.map(k => y[k]); let bt = .5, bf = -1; for (let t = 1; t < 50; t++) { const m = curveMetrics(trS, trY, t / 50); if (m.f1 > bf) { bf = m.f1; bt = t / 50; } }
  const teS = te.map(score), teY = te.map(k => y[k]), metrics = curveMetrics(teS, teY, bt);
  const all = new Float64Array(S.n); rows.forEach((i, k) => all[i] = score(k)); S.score = all;
  return { w, b, mean, sd, thr: bt, metrics, cut, nTrain: tr.length, nTest: te.length, posTrain: pos, posTest: teY.reduce((a, c) => a + c, 0) };
}
function explainBench(S, M, i) { const x = benchFeat(S, i), contrib = x.map((v, j) => ({ k: j, label: BF[j], v: M.w[j] * ((v - M.mean[j]) / M.sd[j]) })).sort((a, b) => Math.abs(b.v) - Math.abs(a.v)); return { contrib, baseP: 1 / (1 + Math.exp(-M.b)) }; }
