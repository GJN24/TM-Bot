
const { buildWorkbook } = require('../lib/excel');
const { score } = require('../lib/similarity');
const { Resend } = require('resend');
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const { searchEUIPO } = require('../clients/euipo');
const { searchWIPO } = require('../clients/wipo');
const { searchCA } = require('../clients/ca');

module.exports = async function (context, req) {
  if (req.method !== 'POST') { context.res = { status: 405, body: 'Method Not Allowed' }; return; }
  const { query, jurisdictions = [], email = null, consent = false } = req.body || {};
  if(!query){ context.res = { status: 400, body: 'Missing query' }; return; }

  const allowed = ['US','CA','EU','UK','WIPO','AU'];
  const target = jurisdictions.filter(j=>allowed.includes(j));
  if(!target.length){ context.res = { status: 400, body: 'No jurisdictions selected' }; return; }

  const tasks = [];
  if (target.includes('EU')) tasks.push(searchEUIPO(query).then(rows => ({jurisdiction:'EU', rows})));
  if (target.includes('WIPO')) tasks.push(searchWIPO(query).then(rows => ({jurisdiction:'WIPO', rows})));
  if (target.includes('CA')) tasks.push(searchCA(query).then(rows => ({jurisdiction:'CA', rows})));
  if (target.includes('AU')) tasks.push(Promise.resolve({jurisdiction:'AU', rows: []}));
  if (target.includes('US')) tasks.push(Promise.resolve({jurisdiction:'US', rows: []}));
  if (target.includes('UK')) tasks.push(Promise.resolve({jurisdiction:'UK', rows: []}));

  const results = await Promise.all(tasks);

  const byJur = {};
  for (const r of results){
    const rows = (r.rows || []).map(it => ({ ...it, ...score(query, it.mark || '') }))
                              .sort((a,b)=> (b.score - a.score))
                              .slice(0,10);
    byJur[r.jurisdiction] = rows;
  }

  const top = {
    US: (byJur.US || [])[0] || null,
    CA: (byJur.CA || [])[0] || null,
    EU: (byJur.EU || [])[0] || null,
  };

  const combined = Object.entries(byJur).flatMap(([jur, arr]) => arr.map(x => ({...x, office: jur})));
  const excelBuf = buildWorkbook(query, combined);
  const base64 = excelBuf.toString('base64');
  const filename = `trademark-results-${Date.now()}.xlsx`;

  let emailSent = false;
  if (email && consent && resend){
    try {
      await resend.emails.send({
        from: 'Trademark Bot <noreply@resend.dev>',
        to: email,
        subject: `Trademark search results for "${query}"`,
        text: 'Your report is attached. This tool is informational only and not legal advice.',
        attachments: [{ filename, content: base64 }]
      });
      emailSent = true;
    } catch (e) { context.log('Email send failed', e.message); }
  }

  context.res = {
    headers: { 'Content-Type': 'application/json' },
    body: { query, jurisdictions: target, top, excel: { filename, base64 }, emailSent }
  };
}
