
'use client';
import { useState } from 'react';
import NorthIPBrand from '../components/NorthIPBrand';
import './globals.css';

const DEFAULT_JURISDICTIONS = ['US','CA','EU','UK','WIPO'];

export default function Page(){
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [jurisdictions, setJuris] = useState(DEFAULT_JURISDICTIONS);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || '/api';

  const toggleJ = (code) => {
    setJuris(prev => prev.includes(code) ? prev.filter(x=>x!==code) : [...prev, code]);
  };

  async function onSubmit(e){
    e.preventDefault();
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${apiBase}/search`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ query:text, jurisdictions, email: email || null, consent })
      });
      if(!res.ok){
        const t = await res.text();
        throw new Error(t || 'Search failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (err){ setError(err.message); }
    finally { setLoading(false); }
  }

  function JCheckbox({code,label}){
    return (
      <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
        <input type="checkbox" checked={jurisdictions.includes(code)} onChange={()=>toggleJ(code)} />
        {label}
      </label>
    );
  }

  const TopCard = ({region, item}) => (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>{region}</strong>
        {item?.matchType && <span className="badge">{item.matchType}</span>}
      </div>
      {item ? (
        <div style={{marginTop:8}}>
          <div><strong>Mark:</strong> {item.mark || '—'}</div>
          <div><strong>Owner:</strong> {item.ownerName || '—'}</div>
          <div><strong>Classes:</strong> {item.classes?.join(', ') || '—'}</div>
          <div>{item.applicationUrl ? <a href={item.applicationUrl} target="_blank" rel="noreferrer">View official record</a> : <span className="small">No link</span>}</div>
        </div>
      ) : (<div className="small">No result yet</div>)}
    </div>
  );

  const downloadExcel = () => {
    if(!result?.excel?.base64) return;
    const b64 = result.excel.base64;
    const bytes = atob(b64);
    const buf = new ArrayBuffer(bytes.length);
    const arr = new Uint8Array(buf);
    for(let i=0;i<bytes.length;i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = result.excel.filename || 'trademark-results.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header>
        <NorthIPBrand />
      </header>
      <main className="container">
        <h1>Trademark Clearance Bot</h1>
        <p className="small">Enter a word/name/phrase and select jurisdictions. Closest matches for US, Canada, and EU appear below; the full Excel includes top 10 per jurisdiction.</p>
        <form onSubmit={onSubmit}>
          <label>Word / Name / Phrase</label>
          <input type="text" value={text} onChange={e=>setText(e.target.value)} placeholder="e.g., NORTHLY" required />

          <label>Jurisdictions</label>
          <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
            <JCheckbox code="US" label="US"/>
            <JCheckbox code="CA" label="Canada"/>
            <JCheckbox code="EU" label="Europe (EUIPO)"/>
            <JCheckbox code="UK" label="UK"/>
            <JCheckbox code="WIPO" label="Global (WIPO)"/>
            <JCheckbox code="AU" label="Australia"/>
          </div>

          <label>Send me the Excel (optional)</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" />
          <label className="small" style={{display:'flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /> I consent to receive the report via email.
          </label>

          <div style={{display:'flex', gap:8}}>
            <button className="primary" disabled={loading}>{loading? 'Searching…' : 'Run search'}</button>
            {result?.excel?.base64 && <button type="button" className="ghost" onClick={downloadExcel}>Download Excel</button>}
          </div>
        </form>

        {error && <p style={{color:'crimson'}}>{error}</p>}

        {result && (
          <div style={{marginTop:24}}>
            <h2>Closest matches</h2>
            <div className="cards">
              <TopCard region="United States" item={result?.top?.US} />
              <TopCard region="Canada" item={result?.top?.CA} />
              <TopCard region="Europe (EUIPO)" item={result?.top?.EU} />
            </div>
            <p className="small" style={{marginTop:12}}>Full results for all selected jurisdictions are included in the Excel report.</p>
          </div>
        )}
      </main>
      <footer className="container small">
        This tool is informational only and not legal advice. Verify at official office records.
      </footer>
    </div>
  );
}
