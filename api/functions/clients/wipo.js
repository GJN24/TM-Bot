
// WIPO Global Brand Database / IP API Catalog – configurable client
// Docs: https://www.wipo.int/en/web/global-brand-database ; https://apicatalog.wipo.int/
const axios = require('axios');

const cfg = {
  id: process.env.WIPO_CLIENT_ID || '',
  secret: process.env.WIPO_CLIENT_SECRET || '',
  tokenUrl: process.env.WIPO_TOKEN_URL || '',
  searchUrl: process.env.WIPO_SEARCH_URL || '',
  method: (process.env.WIPO_HTTP_METHOD || 'GET').toUpperCase(),
  subHeader: process.env.WIPO_SUBSCRIPTION_HEADER || '',
  subValue: process.env.WIPO_SUBSCRIPTION_VALUE || '',
  qParam: process.env.WIPO_QUERY_PARAM || 'q',
  qField: process.env.WIPO_QUERY_BODY_FIELD || 'query'
};

let _cachedToken = null;
async function getToken(){
  if(!cfg.tokenUrl || !cfg.id || !cfg.secret) return null;
  const now = Date.now();
  if(_cachedToken && _cachedToken.expires_at > now + 15000) return _cachedToken.access_token;
  try{
    const params = new URLSearchParams(); params.append('grant_type','client_credentials');
    const res = await axios.post(cfg.tokenUrl, params, { headers:{'Content-Type':'application/x-www-form-urlencoded'}, auth:{username:cfg.id, password:cfg.secret} });
    const at = res.data.access_token; const ttl=(res.data.expires_in||3600)*1000;
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
  const mark = hit.mark || hit.trademark || hit.name || hit.markText || '';
  const ownerName = hit.ownerName || hit.holder || hit.applicant?.name || '';
  const ownerAddress = hit.ownerAddress || hit.applicant?.address || '';
  const classes = hit.classes || hit.nice || hit.gsClasses || [];
  const filingDate = hit.filingDate || hit.applicationDate || '';
  const registrationDate = hit.registrationDate || hit.regDate || '';
  const applicationUrl = hit.applicationUrl || hit.url || (hit.id ? `https://www3.wipo.int/branddb/en/#(brand:${encodeURIComponent(hit.id)})` : '');
  return { mark, ownerName, ownerAddress, classes, filingDate, registrationDate, applicationUrl };
}

async function searchWIPO(query){
  if(!cfg.searchUrl) return [];
  const token = await getToken();
  const h = headers(token);
  try{
    let res;
    if(cfg.method==='POST'){
      const body = {}; body[cfg.qField] = String(query);
      res = await axios.post(cfg.searchUrl, body, { headers: h });
    }else{
      const url = new URL(cfg.searchUrl);
      if(!url.searchParams.has(cfg.qParam)) url.searchParams.set(cfg.qParam, String(query));
      res = await axios.get(url.toString(), { headers: h });
    }
    const data = res.data;
    const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.results) ? data.results : []));
    return items.map(mapHit);
  }catch(e){ return []; }
}

module.exports = { searchWIPO };
