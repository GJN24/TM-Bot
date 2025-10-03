
// Canada (CIPO) via IP Horizons dataset (no scraping)
const fs = require('fs');
const path = require('path');
const metaphone = require('double-metaphone');

let CACHE = null;

function loadIndex(){
  if(CACHE) return CACHE;
  const file = path.join(__dirname,'..','..','data','ca-index.json');
  if(!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file,'utf8');
  CACHE = JSON.parse(raw);
  return CACHE;
}

function norm(s){ return (s||'').toLowerCase().normalize('NFKD').replace(/\p{M}+/gu,''); }

async function searchCA(query){
  const data = loadIndex();
  if(!data.length) return [];
  const q = norm(query);
  const [q1] = metaphone(q);
  const candidates = [];
  for(const item of data){
    const m = norm(item.mark);
    if(m.includes(q)) { candidates.push(item); }
    else { const [m1] = metaphone(m); if(q1 && m1 && q1===m1) candidates.push(item); }
    if(candidates.length >= 120) break;
  }
  return candidates;
}

module.exports = { searchCA };
