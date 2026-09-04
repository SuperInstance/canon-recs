// index.js — canon-recs: recommend papers related to a topic or to a paper.
//
// Combines claim() (most-authoritative) and ghost() (k-nearest-neighbors by
// dial-vector) to produce a recommendation set.
//
//   const { recommendByTopic, recommendByPaper } = require('@superinstance/canon-recs');
//   const r1 = await recommendByTopic('Mudra vessel bridge', 5);
//   const r2 = await recommendByPaper(470, 5);

const { claim, drill } = require('@superinstance/canon-claim');
const { fetchCanon, renderGraph } = require('@superinstance/canon-graph');
const DEFAULT_BASE = 'https://live-canon.superinstance.dev';

function byNum(papers) {
  const out = {};
  for (const p of papers) out[p.number] = p;
  return out;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < 16; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  na = Math.sqrt(na);
  nb = Math.sqrt(nb);
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

function cellToDials(p) {
  const year = parseInt((p.date || '1970-01-01').slice(0, 4)) || 1970;
  const yearQ = (year - 1970) * 546;
  const phaseQ = (p.phase || 0) * 218;
  const fQ = (p.f_number || 0) * 218;
  const nRefs = (p.ref_papers || []).length + (p.ref_f_numbers || []).length;
  const nRefsQ = Math.min(0x7FFF, nRefs * 256);
  // FNV-1a 64-bit, simplified
  let th = 0xCBF29CE484222325n;
  const FNV_PRIME = 0x00000100000001B3n;
  const MASK = 0xFFFFFFFFFFFFFFFFn;
  const enc = new TextEncoder();
  for (const b of enc.encode(p.title || '')) {
    th ^= BigInt(b);
    th = (th * FNV_PRIME) & MASK;
  }
  const titleLo = Number(th & 0xFFFFn);
  const titleHi = Number((th >> 16n) & 0xFFFFn);
  const num = Math.min(p.number || 0, 500);
  const numQ = num * 131;
  return [numQ, titleLo, fQ, phaseQ, yearQ, nRefsQ, titleHi, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}

async function recommendByTopic(topic, k = 5, options = {}) {
  const base = options.base || DEFAULT_BASE;
  // Get the most-authoritative paper + runners-up via claim
  const c = await claim(topic, { base });
  // Get the full canon for ghost
  const canon = await fetchCanon(base);
  const papers = canon.papers || canon;
  const byN = byNum(papers);
  // Pick the top scorer as the anchor
  if (!c.winner) {
    return { topic, recommendations: [], source: 'claim' };
  }
  // Use ghost (k nearest neighbors by dial-vector) for related
  const targetDials = cellToDials(c.winner);
  const scored = [];
  for (const p of papers) {
    if (p.number === c.winner.number) continue;
    const dials = cellToDials(p);
    scored.push({ paper: p, score: cosine(targetDials, dials) });
  }
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, k);
  return {
    topic,
    source: c.winner,
    source_score: c.winner.score,
    recommendations: top.map(s => ({
      number: s.paper.number,
      title: s.paper.title,
      f_number: s.paper.f_number,
      similarity: Math.round(s.score * 10000) / 10000,
    })),
  };
}

async function recommendByPaper(paperNum, k = 5, options = {}) {
  const base = options.base || DEFAULT_BASE;
  const canon = await fetchCanon(base);
  const papers = canon.papers || canon;
  const target = papers.find(p => p.number === paperNum);
  if (!target) {
    return { error: `paper-${paperNum} not found`, recommendations: [] };
  }
  const targetDials = cellToDials(target);
  const scored = [];
  for (const p of papers) {
    if (p.number === paperNum) continue;
    const dials = cellToDials(p);
    scored.push({ paper: p, score: cosine(targetDials, dials) });
  }
  scored.sort((a, b) => b.score - a.score);
  return {
    source: target,
    recommendations: scored.slice(0, k).map(s => ({
      number: s.paper.number,
      title: s.paper.title,
      f_number: s.paper.f_number,
      similarity: Math.round(s.score * 10000) / 10000,
    })),
  };
}

module.exports = { recommendByTopic, recommendByPaper, DEFAULT_BASE };
