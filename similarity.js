
const metaphone = require('double-metaphone');
const levenshtein = require('fast-levenshtein');

function normalize(s){
  return (s||'').toString().toLowerCase().normalize('NFKD').replace(/\p{M}+/gu,'');
}

function exact(a,b){
  return normalize(a) === normalize(b) ? 1 : 0;
}

function fuzzy(a,b){
  const A = normalize(a); const B = normalize(b);
  if(!A || !B) return 0;
  const dist = levenshtein.get(A,B);
  const maxLen = Math.max(A.length, B.length) || 1;
  return 1 - (dist / maxLen); // 1=identical, 0=very different
}

function phonetic(a,b){
  const [a1,a2] = metaphone(normalize(a));
  const [b1,b2] = metaphone(normalize(b));
  if(!a1 || !b1) return 0;
  return (a1===b1 || a1===b2 || (a2 && (a2===b1 || a2===b2))) ? 1 : 0;
}

function score(query, mark){
  const e = exact(query, mark);
  if(e===1) return {score:1, matchType:'Exact'};
  const p = phonetic(query, mark);
  const f = fuzzy(query, mark);
  const s = Math.max(f*0.6, p*0.4);
  const label = p>0.9? 'Phonetic' : 'Similar';
  return {score: s, matchType: label};
}

module.exports = { score };
