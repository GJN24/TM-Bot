
// Convert IP Horizons (CIPO) Trademarks CSV to compact JSON index
// Usage: node tools/ca-load.js /path/to/cipo_trademarks.csv
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function pick(o, keys){ for(const k of keys){ if(o[k]!=null && o[k]!=='' ) return o[k]; } return ''; }
function norm(s){ return (s||'').toString().trim(); }

const MARK_ALTS = ['MARK','Mark','Trademark','Word mark','Word Mark','TM_TEXT','SIGN'];
const OWNER_ALTS = ['Owner','Owner Name','Proprietor Name','Applicant Name','Holder Name'];
const ADDR_ALTS = ['Owner Address','Owner Address Line','Address','Proprietor Address','Applicant Address'];
const APPNO_ALTS = ['Application Number','Application No','Appl. No','App No','FILE_NO','APPLICATION_NUM'];
const FILED_ALTS = ['Filing Date','Application Date','Filed','FILING_DATE'];
const REGD_ALTS = ['Registration Date','Registered','REG_DATE'];

function main(){
  const inFile = process.argv[2];
  if(!inFile){ console.error('Usage: node tools/ca-load.js <input.csv>'); process.exit(1); }
  const csv = fs.readFileSync(inFile,'utf8');
  const rows = parse(csv, { columns:true, skip_empty_lines:true });
  const out = [];
  for(const r of rows){
    const mark = norm(pick(r, MARK_ALTS));
    if(!mark) continue;
    out.push({
      mark,
      ownerName: norm(pick(r, OWNER_ALTS)),
      ownerAddress: norm(pick(r, ADDR_ALTS)),
      applicationNumber: norm(pick(r, APPNO_ALTS)),
      filingDate: norm(pick(r, FILED_ALTS)),
      registrationDate: norm(pick(r, REGD_ALTS)),
      applicationUrl: 'https://ised-isde.canada.ca/cipo/trademark-search/srch'
    });
  }
  const outFile = path.join(__dirname,'..','data','ca-index.json');
  fs.writeFileSync(outFile, JSON.stringify(out));
  console.log('Wrote', outFile, 'records:', out.length);
}

main();
