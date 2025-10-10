
const XLSX = require('xlsx');

function buildWorkbook(query, rows){
  const header = [
    'Query','Found mark','Owner','Owner address','IP office','Filing date','Registration date','Link'
  ];
  const data = [header];
  rows.forEach(r=>{
    data.push([
      query,
      r.mark || '',
      r.ownerName || '',
      r.ownerAddress || '',
      r.office || '',
      r.filingDate || '',
      r.registrationDate || '',
      r.applicationUrl || ''
    ]);
  });
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  const buf = XLSX.write(wb, {type:'buffer', bookType:'xlsx'});
  return buf;
}

module.exports = { buildWorkbook };
