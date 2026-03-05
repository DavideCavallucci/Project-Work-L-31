import { useState, useEffect } from 'react';

export default function DashboardAdmin() {
  const apiUrl = "https://project-work-l-31.onrender.com";

  const [fatture, setFatture] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Funzione di caricamento dati sicura
  const caricaDati = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/fatture/dettagliate`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setFatture(data);
      } else {
        console.error("Il backend non ha restituito una lista di fatture:", data);
        setFatture([]);
      }
    } catch (err) {
      console.error("Errore di connessione al server:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { caricaDati(); }, []);

  // 2. Calcolo KPI con protezione
  const safeFatture = Array.isArray(fatture) ? fatture : [];
  const totaleEmesso = safeFatture.reduce((s, f) => s + (Number(f.importo) || 0), 0);
  const totaleIncassato = safeFatture.filter(f => f.pagata).reduce((s, f) => s + (Number(f.importo) || 0), 0);
  const inPendenza = totaleEmesso - totaleIncassato;
  const percentualeIncasso = totaleEmesso > 0 ? Math.round((totaleIncassato / totaleEmesso) * 100) : 0;

  // 3. UI di caricamento iniziale Premium
  if (loading && fatture.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-indigo-600 font-black animate-pulse uppercase tracking-[0.3em] text-xs">Sincronizzazione Flussi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM GLASSMORPHISM (Stile Finance) */}
      <header className="bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10 shadow-inner">
                    Direzione Amministrativa
                </span>
                <h2 className="text-4xl font-black mt-5 tracking-tight">Finance Overview</h2>
                <p className="text-indigo-200 font-medium mt-1 text-sm uppercase tracking-widest">
                    Monitoraggio Flussi di Cassa MedCloud
                </p>
            </div>
            
            <div className="flex flex-col items-end">
                <div className="text-right bg-black/20 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">Esercizio Corrente</p>
                    <p className="text-2xl font-black tracking-widest">{new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                </div>
            </div>
        </div>
        
        {/* Decorazione di sfondo */}
        <div className="absolute -right-10 -bottom-10 text-white/5 text-[200px] rotate-12 pointer-events-none font-black select-none">📊</div>
      </header>
      
      {/* KPI CARDS REDESIGN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest relative z-10">Volume Affari</p>
          <h4 className="text-4xl font-black text-slate-800 mt-2 relative z-10">€{totaleEmesso}</h4>
          <div className="absolute right-4 bottom-0 text-indigo-50 text-8xl font-black select-none pointer-events-none translate-y-4">€</div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 text-white relative overflow-hidden group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest relative z-10">Liquidità Incassata</p>
          <div className="flex items-end gap-3 mt-2 relative z-10">
              <h4 className="text-4xl font-black">€{totaleIncassato}</h4>
              <span className="text-emerald-400 font-black text-sm mb-1">+{percentualeIncasso}%</span>
          </div>
          <div className="mt-5 bg-white/10 rounded-full h-2 w-full overflow-hidden">
            <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 relative overflow-hidden" 
                style={{ width: `${percentualeIncasso}%` }}
            >
                <div className="absolute top-0 left-0 bottom-0 w-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden hover:shadow-lg hover:border-orange-100 transition-all duration-300">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest relative z-10">In Attesa di Saldo</p>
          <h4 className="text-4xl font-black text-orange-500 mt-2 relative z-10">€{inPendenza}</h4>
          <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest">Da sollecitare</p>
          </div>
        </div>
      </div>

      {/* LISTA TRANSAZIONI PREMIUM */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
        
        {/* Tabella Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">🧾</div>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Registro Fatture</h4>
          </div>
          <button 
            onClick={() => caricaDati(true)} 
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:shadow-sm transition-all text-xs font-black text-slate-600 disabled:opacity-50"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>🔄</span> 
            {isRefreshing ? 'AGGIORNAMENTO...' : 'AGGIORNA'}
          </button>
        </div>
        
        {/* Tabella Corpo */}
        <div className="divide-y divide-slate-100">
          {safeFatture.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
                <span className="text-6xl mb-4 grayscale opacity-20">🗄️</span>
                <p className="text-slate-500 font-black text-lg">Nessuna transazione registrata.</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Le fatture appariranno qui non appena i medici referteranno le visite.</p>
            </div>
          ) : (
            safeFatture.map(f => {
              // 🛡️ LO SCUDO ANTI-CRASH (Mantenuto intatto)
              const nomePaziente = String(f?.paziente || "Paziente Ignoto");
              const iniziale = nomePaziente.charAt(0).toUpperCase() || "P";
              const isPagata = f.pagata;

              return (
                <div key={f.id_fattura} className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/80 transition-all duration-300 group gap-4">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-colors duration-300
                        ${isPagata ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-orange-50 text-orange-500 group-hover:bg-orange-100'}`}>
                      {iniziale}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{nomePaziente}</p>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black tracking-widest">FT-{String(f.id_fattura).padStart(4, '0')}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {f.data_emissione ? new Date(f.data_emissione).toLocaleDateString() : '--/--/----'}
                          </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto w-full border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                    <p className="font-black text-slate-900 text-2xl">€{f.importo}</p>
                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest border transition-all shadow-sm
                        ${isPagata ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      <div className={`w-2 h-2 rounded-full ${isPagata ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
                      {isPagata ? 'SALDATA' : 'IN SOSPESO'}
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