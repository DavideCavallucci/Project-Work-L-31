import { useState, useEffect } from 'react';

export default function DashboardAdmin() {
  const apiUrl = "https://project-work-l-31.onrender.com";

  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [ricerca, setRicerca] = useState("");
  const [sollecitoInviato, setSollecitoInviato] = useState(false);

  // 1. Funzione di caricamento dati
  const caricaDati = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/fatture/dettagliate`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        // Ordiniamo dalla più recente alla più vecchia
        const ordinate = data.sort((a, b) => new Date(b.data_emissione) - new Date(a.data_emissione));
        setFatture(ordinate);
      } else {
        setFatture([]);
      }
    } catch (err) {
      console.error("Errore di connessione al server:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { caricaDati(); }, []);

  // 2. Simulazione Azione di Sollecito
  const gestisciSollecito = () => {
    if (!window.confirm("Vuoi inviare una notifica di sollecito ai pazienti con fatture in sospeso?")) return;
    
    setSollecitoInviato(true);
    setTimeout(() => {
        alert("✅ Email di sollecito inviate con successo!");
        setSollecitoInviato(false);
    }, 2000);
  };

  // 3. Logica Dati e KPI
  const safeFatture = Array.isArray(fatture) ? fatture : [];
  
  // 🌟 MOTORE DI RICERCA: Solo per Nominativo Paziente
  const fattureFiltrate = safeFatture.filter(f => {
      const termine = ricerca.toLowerCase().trim();
      const nomePaziente = String(f.paziente || "Ignoto").toLowerCase();
      return nomePaziente.includes(termine);
  });

  const totaleEmesso = safeFatture.reduce((s, f) => s + (Number(f.importo) || 0), 0);
  const totaleIncassato = safeFatture.filter(f => f.pagata).reduce((s, f) => s + (Number(f.importo) || 0), 0);
  const inPendenza = totaleEmesso - totaleIncassato;
  const percentualeIncasso = totaleEmesso > 0 ? Math.round((totaleIncassato / totaleEmesso) * 100) : 0;

  // UI Caricamento
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-8 animate-in fade-in duration-1000">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-indigo-100/20 rounded-full blur-sm"></div>
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full opacity-20"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🏦</div>
        </div>
        <div className="text-center">
            <p className="text-indigo-600 font-black animate-pulse uppercase tracking-[0.4em] text-sm">Decrittazione Flussi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      
      {/* HEADER FINTECH ESSENZIALE */}
      <header className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-[3rem] p-10 lg:p-12 text-white shadow-2xl shadow-indigo-900/30 relative overflow-hidden border border-white/10">
        <div className="absolute -top-[50%] -right-[10%] w-[70%] h-[150%] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 shadow-inner">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-100">Live Ledger • System Online</span>
                </div>
                <div>
                    <h2 className="text-5xl lg:text-6xl font-black tracking-tighter bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent">
                        Finance OS
                    </h2>
                    <p className="text-indigo-200/80 font-medium mt-2 text-sm uppercase tracking-widest max-w-md">
                        Gestione amministrativa e monitoraggio liquidità.
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col items-end w-full lg:w-auto mt-6 lg:mt-0">
                <div className="bg-white/5 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-end">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300/70 mb-1">Esercizio Fiscale</p>
                    <p className="text-3xl font-black tracking-widest text-indigo-100">{new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
      </header>
      
      {/* BENTO GRID KPI CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BIG CARD: Liquidità */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden group border border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-6 backdrop-blur-md shadow-inner border border-white/20">💶</div>
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.3em]">Liquidità Netta Incassata</p>
                <div className="flex items-end gap-3 mt-1">
                    <h4 className="text-5xl font-black tracking-tighter">€{totaleIncassato}</h4>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-indigo-200">Tasso di conversione</span>
                    <span className="text-lg font-black text-white">{percentualeIncasso}%</span>
                </div>
                <div className="bg-black/20 rounded-full h-3 w-full overflow-hidden p-0.5 shadow-inner">
                    <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-1500 ease-out relative overflow-hidden" style={{ width: `${percentualeIncasso}%` }}>
                        <div className="absolute top-0 left-0 bottom-0 w-full bg-white/30 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD: Volume Affari */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between">
                <div>
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl mb-4">📈</div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Fatturato Emesso</p>
                    <h4 className="text-4xl font-black text-slate-800 mt-1 tracking-tighter">€{totaleEmesso}</h4>
                </div>
                <div className="mt-6 flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-indigo-100">Lordo</span>
                    <span className="text-xs text-slate-400 font-bold">Prima delle tasse</span>
                </div>
            </div>

            {/* CARD: In Pendenza (CON BOTTONE FUNZIONANTE) */}
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between group">
                <div className="relative z-10">
                    <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center text-xl mb-4 font-black">!</div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Crediti In Sospeso</p>
                    <h4 className="text-4xl font-black text-orange-500 mt-1 tracking-tighter">€{inPendenza}</h4>
                </div>
                
                <div className="mt-6 relative z-10">
                    <button 
                        onClick={gestisciSollecito}
                        disabled={sollecitoInviato || inPendenza === 0}
                        className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sollecitoInviato ? (
                            <><div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div> Invio in corso...</>
                        ) : inPendenza === 0 ? (
                            <>Nessun Sospeso</>
                        ) : (
                            <><div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div> Sollecita Pagamenti</>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* REGISTRO TRANSAZIONI MASTER */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        
        {/* Header Tabella & Ricerca Premium */}
        <div className="p-8 lg:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50 backdrop-blur-sm">
          <div>
              <h4 className="font-black text-slate-900 text-2xl tracking-tight">Registro Fatture</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Elenco delle transazioni emesse</p>
          </div>
          
          <div className="w-full md:w-96 relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-slate-400 group-focus-within:text-indigo-500 transition-colors text-lg">🔍</span>
            </div>
            <input 
                type="text" 
                placeholder="Cerca per nominativo paziente..." 
                className="w-full bg-white border border-slate-200 pl-14 pr-12 py-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-sm font-bold text-slate-700 shadow-sm transition-all placeholder:text-slate-300"
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
            />
            {ricerca && (
                <button 
                    onClick={() => setRicerca('')} 
                    className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-300 hover:text-slate-600 transition-colors"
                    title="Cancella ricerca"
                >
                    <span className="text-xl font-black">✕</span>
                </button>
            )}
          </div>
        </div>
        
        {/* Corpo Tabella */}
        <div className="divide-y divide-slate-100/80 bg-white min-h-[300px]">
          {safeFatture.length === 0 ? (
            // STATO 1: Database completamente vuoto
            <div className="flex flex-col items-center justify-center p-20 text-center h-full">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-4xl mb-4 shadow-inner border border-slate-100">🗄️</div>
                <p className="text-slate-500 font-black text-xl">Il registro è immacolato.</p>
                <p className="text-sm text-slate-400 font-medium mt-2">Nessuna fattura è stata ancora generata dal sistema.</p>
            </div>
          ) : fattureFiltrate.length === 0 ? (
            // STATO 2: Ricerca senza risultati
            <div className="flex flex-col items-center justify-center p-20 text-center h-full animate-in fade-in">
                <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-4xl mb-4 shadow-inner border border-indigo-100">🕵️</div>
                <p className="text-indigo-900 font-black text-xl">Paziente non trovato.</p>
                <p className="text-sm text-indigo-400 font-medium mt-2">Non ci sono fatture intestate a "{ricerca}".</p>
                <button onClick={() => setRicerca('')} className="mt-6 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Azzera ricerca</button>
            </div>
          ) : (
            // STATO 3: Lista popolata e filtrata
            fattureFiltrate.map((f) => {
              const nomePaziente = String(f?.paziente || "Paziente Ignoto");
              const iniziale = nomePaziente.charAt(0).toUpperCase() || "P";
              const isPagata = f.pagata;

              return (
                <div 
                    key={f.id_fattura} 
                    className="p-6 lg:px-10 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-all duration-300 group gap-4 cursor-default"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0
                        ${isPagata ? 'bg-emerald-50/80 text-emerald-600 border border-emerald-100' : 'bg-orange-50/80 text-orange-500 border border-orange-100'}`}>
                      {iniziale}
                    </div>
                    
                    <div className="transition-transform duration-300 group-hover:translate-x-2">
                      <p className="font-black text-slate-800 text-lg">{nomePaziente}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-black tracking-widest border border-slate-200">
                              FT-{String(f.id_fattura).padStart(4, '0')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="text-slate-300">📅</span> {f.data_emissione ? new Date(f.data_emissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '--/--/----'}
                          </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-8 border-t border-slate-100 md:border-0 pt-4 md:pt-0 transition-transform duration-300 group-hover:-translate-x-2">
                    <p className="font-black text-slate-900 text-2xl tracking-tighter">€{f.importo}</p>
                    
                    <span className={`w-32 justify-center text-[10px] font-black px-4 py-2.5 rounded-xl flex items-center gap-2 uppercase tracking-[0.2em] border shadow-sm transition-colors duration-300
                        ${isPagata ? 'bg-emerald-50 text-emerald-700 border-emerald-200 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-orange-50 text-orange-700 border-orange-200 group-hover:bg-orange-500 group-hover:text-white'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${isPagata ? 'bg-emerald-500 group-hover:bg-white' : 'bg-orange-500 animate-pulse group-hover:bg-white'}`}></div>
                      {isPagata ? 'SALDATA' : 'SOSPESA'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
}