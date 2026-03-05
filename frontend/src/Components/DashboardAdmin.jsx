import { useState, useEffect } from 'react';

const getIconaPrestazione = (nome) => {
    const n = nome?.toLowerCase() || "";
    if (n.includes('cardio')) return '🫀';
    if (n.includes('derma')) return '🔍';
    if (n.includes('ortoped') || n.includes('oss')) return '🦴';
    if (n.includes('oculist') || n.includes('visiv')) return '👁️';
    if (n.includes('dent') || n.includes('odont')) return '🦷';
    if (n.includes('neuro')) return '🧠';
    if (n.includes('ginecolog')) return '🤰';
    if (n.includes('pediatr')) return '🧸';
    if (n.includes('diet') || n.includes('nutriz')) return '🍎';
    if (n.includes('psico')) return '🛋️';
    return '🩺';
};

export default function DashboardAdmin() {
  const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000" 
    : "https://project-work-l-31.onrender.com";

  const [vista, setVista] = useState('finanza'); // finanza, prestazioni
  const [dati, setDati] = useState({ fatture: [], prestazioni: [] });
  const [loading, setLoading] = useState(true);
  
  const [ricerca, setRicerca] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sollecitoInviato, setSollecitoInviato] = useState(false);

  // Form per nuova prestazione
  const [nuovaPresta, setNuovaPresta] = useState({ nome_prestazione: "", costo: "" });

  const caricaTutto = async () => {
    try {
      setLoading(true);
      const [resFat, resPre] = await Promise.all([
        fetch(`${apiUrl}/api/fatture/dettagliate`),
        fetch(`${apiUrl}/api/prestazioni?admin=true`)
      ]);
      
      const fatData = await resFat.json();
      
      const fatOrdinate = Array.isArray(fatData) ? fatData.sort((a, b) => new Date(b.data_emissione) - new Date(a.data_emissione)) : [];

      setDati({
        fatture: fatOrdinate,
        prestazioni: await resPre.json()
      });
    } catch (err) {
      console.error("Errore di connessione al server:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { caricaTutto(); }, []);

  const gestisciSollecito = () => {
    if (!window.confirm("Vuoi inviare una notifica di sollecito ai pazienti con fatture in sospeso?")) return;
    
    setSollecitoInviato(true);
    setTimeout(() => {
        alert("Email di sollecito inviate con successo!");
        setSollecitoInviato(false);
    }, 2000);
  };

  const aggiungiPrestazione = async (e) => {
    e.preventDefault();
    if (!window.confirm("Confermi l'aggiunta di questa nuova prestazione al listino ufficiale?")) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/prestazioni`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuovaPresta)
      });
      if (res.ok) {
        alert("✨ Prestazione registrata con successo!");
        setNuovaPresta({ nome_prestazione: "", costo: "" });
        await caricaTutto();
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) { alert("Errore connessione."); } finally { setIsSubmitting(false); }
  };

  const togglePrestazione = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/api/prestazioni/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) { await caricaTutto(); }
    // eslint-disable-next-line no-unused-vars
    } catch (err) { alert("Errore aggiornamento."); }
  };

  const safeFatture = dati.fatture;
  
  const totaleEmesso = safeFatture.reduce((s, f) => s + (Number(f.importo) || 0), 0);
  const totaleIncassato = safeFatture.filter(f => f.pagata).reduce((s, f) => s + (Number(f.importo) || 0), 0);
  const pendenza = totaleEmesso - totaleIncassato;
  const ratio = totaleEmesso > 0 ? Math.round((totaleIncassato / totaleEmesso) * 100) : 0;

  const fattureFiltrate = safeFatture.filter(f => f.paziente?.toLowerCase().includes(ricerca.toLowerCase()));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-in fade-in duration-1000">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full opacity-20"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🏦</div>
        </div>
        <p className="text-indigo-600 font-black animate-pulse uppercase tracking-[0.4em] text-sm">Decrittazione Flussi...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* HEADER */}
      <header className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-[3rem] p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden border border-white/10">
        <div className="absolute -top-[50%] -right-[10%] w-[70%] h-[150%] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-inner">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-100">Live • Centro di Controllo</span>
                </div>
                <div>
                    <h2 className="text-5xl lg:text-6xl font-black tracking-tighter">MedCloud Dashboard</h2>
                    <p className="text-indigo-200 font-medium mt-1 uppercase tracking-widest text-sm max-w-md">Amministrazione, Finanza e Controllo.</p>
                </div>
            </div>
            <div className="bg-white/5 px-8 py-5 rounded-[2rem] border border-white/10 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">Esercizio Fiscale</p>
                <p className="text-3xl font-black tracking-widest text-indigo-100">{new Date().getFullYear()}</p>
            </div>
        </div>
      </header>

      {/* TABS DI NAVIGAZIONE */}
      <div className="bg-white p-3 rounded-full border border-slate-100 shadow-xl flex justify-center items-center gap-2 max-w-md mx-auto relative z-10">
        <button onClick={() => setVista('finanza')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${vista === 'finanza' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Finanza</button>
        <button onClick={() => setVista('prestazioni')} className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${vista === 'prestazioni' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Listino Servizi</button>
      </div>

      <main>
        {/* --- SEZIONE FINANZIARIA --- */}
        {vista === 'finanza' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] shadow-2xl text-white overflow-hidden border border-white/10 relative group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
                  <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100">Liquidità Netta Incassata</p>
                  <h4 className="relative z-10 text-5xl font-black mt-1 tracking-tighter">€{totaleIncassato}</h4>
                  <div className="mt-8 relative z-10">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-indigo-200">Tasso di conversione</span>
                      <span className="text-lg font-black">{ratio}%</span>
                    </div>
                    <div className="bg-black/20 rounded-full h-3 w-full p-0.5 shadow-inner">
                      <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-1000" style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Fatturato Lordo Emesso</p>
                            <h4 className="text-4xl font-black text-slate-800 mt-1 tracking-tighter">€{totaleEmesso}</h4>
                        </div>
                        <span className="mt-6 text-xs text-slate-400 font-bold">Lordo, prima delle tasse</span>
                    </div>
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between">
                        <div>
                            <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">Crediti In Sospeso</p>
                            <h4 className="text-4xl font-black text-orange-500 mt-1 tracking-tighter">€{pendenza}</h4>
                        </div>
                        <button onClick={gestisciSollecito} disabled={pendenza === 0 || sollecitoInviato} className="mt-6 w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 py-3 rounded-xl text-[10px] font-black uppercase active:scale-95 disabled:opacity-50 transition-all">
                            {sollecitoInviato ? '...' : pendenza === 0 ? 'Registro Pulito ✓' : 'Sollecita Pagamenti'}
                        </button>
                    </div>
                </div>
            </div>

            {/* TABELLA FATTURE */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in">
                <div className="p-8 lg:px-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Registro Transazioni</h3>
                    
                    <div className="relative w-full md:w-80 group">
                        <span className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Cerca paziente..." 
                            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                            value={ricerca}
                            onChange={(e) => setRicerca(e.target.value)} 
                        />
                        {ricerca && (
                            <button onClick={() => setRicerca('')} className="absolute inset-y-0 right-4 flex items-center text-slate-300 hover:text-slate-600 transition-colors">
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="divide-y divide-slate-50 min-h-[300px]">
                    {fattureFiltrate.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <span className="text-4xl mb-3">👻</span>
                            <p className="font-black text-lg">Nessun risultato</p>
                            <p className="text-xs">Prova a cercare un altro nominativo.</p>
                        </div>
                    ) : (
                        fattureFiltrate.map(f => (
                            <div key={f.id_fattura} className="p-6 lg:px-10 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-inner ${f.pagata ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {f.paziente?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800">{f.paziente}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">FT-{String(f.id_fattura).padStart(4, '0')} • {new Date(f.data_emissione).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <p className="font-black text-slate-900 text-lg">€{f.importo}</p>
                                    <span className={`text-[9px] font-black w-24 text-center py-2 rounded-lg border ${f.pagata ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                        {f.pagata ? 'SALDATA' : 'PENDENTE'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        )}

        {/* --- SEZIONE PRESTAZIONI --- */}
        {vista === 'prestazioni' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4 duration-500">
            
            {/* FORM AGGIUNTA PRESTAZIONE */}
            <div className="lg:col-span-4">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 sticky top-8 group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">Nuovo Servizio</h4>
                        <p className="text-xs text-slate-400 font-bold mb-8 leading-relaxed">Arricchisci il catalogo inserendo i dettagli della nuova prestazione.</p>
                        
                        <form onSubmit={aggiungiPrestazione} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome Servizio</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-300">🩺</span>
                                    <input required type="text" placeholder="Es. Visita Oculistica" 
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" 
                                        value={nuovaPresta.nome_prestazione} onChange={e => setNuovaPresta({...nuovaPresta, nome_prestazione: e.target.value})} 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tariffa (€)</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-300">💶</span>
                                    <input required type="number" placeholder="Es. 120" min="0"
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" 
                                        value={nuovaPresta.costo} onChange={e => setNuovaPresta({...nuovaPresta, costo: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full mt-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-indigo-600 hover:to-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50">
                                {isSubmitting ? 'Salvataggio in corso...' : 'Aggiungi al listino'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* TABELLA LISTINO CON TOGGLE SWITCH */}
            <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Listino Ufficiale</h3>
                    <div className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-black border border-indigo-100">{dati.prestazioni.length} Servizi Totali</div>
                </div>
                
                <div className="divide-y divide-slate-50">
                    {dati.prestazioni.map(p => (
                        <div key={p.id_prestazione} className="p-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-xl shadow-inner transition-colors duration-300 ${p.is_active ? 'bg-indigo-50/80 text-indigo-500' : 'bg-slate-100 text-slate-300'}`}>
                                    {getIconaPrestazione(p.nome_prestazione)}
                                </div>
                                <div>
                                    <p className={`font-black text-lg transition-colors duration-300 ${p.is_active ? 'text-slate-800' : 'text-slate-300 line-through'}`}>{p.nome_prestazione}</p>
                                    <p className={`font-black mt-0.5 transition-colors duration-300 ${p.is_active ? 'text-indigo-600' : 'text-slate-400'}`}>€{p.costo}</p>
                                </div>
                            </div>
                            
                            {/* TOGGLE SWITCH STILE iOS */}
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${p.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {p.is_active ? 'Visibile' : 'Nascosto'}
                                </span>
                                
                                <button 
                                    onClick={() => togglePrestazione(p.id_prestazione)}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${p.is_active ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-300 hover:bg-slate-400'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${p.is_active ? 'translate-x-8' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}