
// EUIPO Trademark Search – Sandbox integration (configurable)
// Docs: https://dev.euipo.europa.eu/ (register app, sandbox product)
const axios = require('axios');

const cfg = {
  id: process.env.EUIPO_CLIENT_ID || '',
  secret: process.env.EUIPO_CLIENT_SECRET || '',
  tokenUrl: process.env.EUIPO_TOKEN_URL || '',
  searchUrl: process.env.EUIPO_TRADEMARK_SEARCH_URL || '',
  method: (process.env.EUIPO_HTTP_METHOD || 'GET').toUpperCase(),
  subHeader: process.env.EUIPO_SUBSCRIPTION_HEADER || '',
  subValue: process.env.EUIPO_SUBSCRIPTION_VALUE || ''
};

let _cachedToken = null; // { access_token, expires_at }

async function getToken(){
  if(!cfg.tokenUrl || !cfg.id || !cfg.secret) return null;
  const now = Date.now();
  if(_cachedToken && _cachedToken.expires_at > now + 15000){
    return _cachedToken.access_token;
  }
  try{
    const params = new URLSearchParams();
    params.append('grant_type','client_credentials');
    const res = await axios.post(cfg.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: { username: cfg.id, password: cfg.secret }
    });
    const at = res.data.access_token; const ttl = (res.data.expires_in||3600)*1000;
    _cachedToken = { access_token: at, expires_at: Date.now()+ttl };
    return at;
  }catch(e){ return null; }
}

function headers(token){
  const h = { 'Accept': 'application/json' };
  if(token) h['Authorization'] = `Bearer ${token}`;
  if(cfg.subHeader && cfg.subValue) h[cfg.subHeader] = cfg.subValue;
  return h;
}

function mapHit(hit){
  const mark = hit.mark || hit.markText || hit.name || hit.trademark || '';
  const ownerName = hit.ownerName || hit.owner || hit.applicant?.name || hit.holder?.name || '';
  const ownerAddress = hit.ownerAddress || hit.applicant?.address || hit.holder?.address || '';
  const classes = hit.classes || hit.niceClasses || hit.gsClasses || [];
  const filingDate = hit.filingDate || hit.applicationDate || '';
  const registrationDate = hit.registrationDate || hit.regDate || '';
  const applicationUrl = hit.applicationUrl || hit.url || (hit.id ? `https://euipo.europa.eu/eSearch/#details/trademarks/${encodeURIComponent(hit.id)}` : '');
  return { mark, ownerName, ownerAddress, classes, filingDate, registrationDate, applicationUrl };
}

async function searchEUIPO(query){
  if(!cfg.searchUrl) return [];
  const token = await getToken();
  const h = headers(token);
  try{
    let res;
    if(cfg.method==='POST'){
      res = await axios.post(cfg.searchUrl, { query: String(query) }, { headers: h });
    }else{
      const url = new URL(cfg.searchUrl);
      if(!url.searchParams.has('q') && !url.searchParams.has('query')) url.searchParams.set('q', String(query));
      res = await axios.get(url.toString(), { headers: h });
    }
    const data = res.data;
    const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.results) ? data.results : []));
    return items.map(mapHit);
  }catch(e){ return []; }
}

module.exports = { searchEUIPO };
