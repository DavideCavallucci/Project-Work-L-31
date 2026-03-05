import { useState, useEffect } from 'react';

export default function DashboardMedico({ utente }) {
  const apiUrl = "https://project-work-l-31.onrender.com"; // Se testi in locale, ricordati di mettere http://127.0.0.1:8000 temporaneamente!

  const [vista, setVista] = useState('attesa');
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [storico, setStorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Feedback visivo sul bottone salva
  
  const [referto, setReferto] = useState({ id: null, paziente: '', esito: '', farmaci: '' });

  const caricaDati = async () => {
    if (!utente?.id_collegato) return;
    setLoading(true);
    try {
      const [resPren, resStor] = await Promise.all([
        fetch(`${apiUrl}/api/prenotazioni`),
        fetch(`${apiUrl}/api/medici/${utente.id_collegato}/storico`)
      ]);
      const dataPren = await resPren.json();
      const dataStor = await resStor.json();

      setPrenotazioni(Array.isArray(dataPren) ? dataPren.filter(p => p.stato === 'PROGRAMMATA' && p.id_medico === utente.id_collegato) : []);
      setStorico(Array.isArray(dataStor) ? dataStor : []);
    } catch (err) {
      console.error("Errore caricamento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { caricaDati(); }, [utente]);

  // 🌟 ECCO LA FUNZIONE MANCANTE CHE FA FUNZIONARE IL TASTO
  const inviaReferto = async (e) => {
    e.preventDefault();
    if (!referto.esito.trim()) return alert("Compila l'esito della visita prima di salvare.");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/referti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_prenotazione: referto.id, 
          esito_visita: referto.esito, 
          prescrizioni: referto.farmaci || "Nessuna terapia farmacologica prescritta." 
        })
      });

      if (res.ok) {
        alert('✅ Referto firmato digitalmente e archiviato!');
        setReferto({ id: null, paziente: '', esito: '', farmaci: '' });
        caricaDati(); // Ricarica la lista per far sparire il paziente refertato
      } else {
        const errorData = await res.json();
        alert(`🚨 Errore: ${errorData.detail || "Impossibile salvare il referto."}`);
      }
    } catch (err) {
      alert("Errore di connessione al server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI di Caricamento Premium
  if (loading && prenotazioni.length === 0 && storico.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-teal-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-teal-600 font-black animate-pulse uppercase tracking-[0.3em] text-xs">Sincronizzazione Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* HEADER PREMIUM GLASSMORPHISM */}
      <header className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10 shadow-inner">
                    Area Medica
                </span>
                <h2 className="text-4xl font-black mt-5 tracking-tight">{utente?.nome_completo || "Dottore"}</h2>
                <p className="text-teal-100 font-medium mt-1 text-sm uppercase tracking-widest">
                    Reparto: {utente?.specializzazione || "Medicina Generale"}
                </p>
            </div>
            
            <div className="flex flex-col items-end">
                <div className="text-right bg-black/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                    <p className="text-5xl font-black leading-none">{prenotazioni.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-teal-100 mt-1">In Sala d'Attesa</p>
                </div>
            </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-10 bg-black/10 p-1.5 rounded-2xl backdrop-blur-md w-fit relative z-10 border border-white/5">
          <button onClick={() => setVista('attesa')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'attesa' ? 'bg-white text-teal-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            📅 AGENDA DI OGGI
          </button>
          <button onClick={() => setVista('storico')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'storico' ? 'bg-white text-teal-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            🗄️ ARCHIVIO PAZIENTI
          </button>
        </div>

        {/* Decorazione di sfondo */}
        <div className="absolute -right-10 -bottom-20 text-white/5 text-[250px] rotate-12 pointer-events-none font-black select-none">🩺</div>
      </header>

      <main className="min-h-[500px]">
        {vista === 'attesa' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLONNA SINISTRA: LISTA PAZIENTI */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between ml-2 mb-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Coda Pazienti</h4>
                  {loading && <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
              
              {prenotazioni.length > 0 ? (
                <div className="space-y-3">
                    {prenotazioni.map(p => {
                        const nomeDisplay = String(p?.paziente_nome || "Paziente Ignoto");
                        const iniziale = nomeDisplay.charAt(0).toUpperCase() || "P";
                        const orario = p.data_ora ? new Date(p.data_ora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--:--";
                        const isActive = referto.id === p.id_prenotazione;
                        
                        return (
                        <button 
                            key={p.id_prenotazione} 
                            onClick={() => setReferto({id: p.id_prenotazione, paziente: nomeDisplay, esito: '', farmaci: ''})}
                            className={`w-full text-left p-5 rounded-[2rem] border-2 transition-all duration-300 flex justify-between items-center group
                            ${isActive ? 'bg-teal-50 border-teal-500 shadow-xl shadow-teal-900/10 scale-[1.02]' : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-md'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-colors
                                    ${isActive ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-100'}`}>
                                    {iniziale}
                                </div>
                                <div>
                                    <p className={`font-black text-lg leading-tight ${isActive ? 'text-teal-900' : 'text-slate-800'}`}>{nomeDisplay}</p>
                                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">{p.tipo_visita || "Visita"}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-black ${isActive ? 'text-teal-700' : 'text-slate-400'}`}>{orario}</p>
                            </div>
                        </button>
                        );
                    })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <span className="text-5xl mb-4">☕</span>
                    <p className="text-slate-500 font-bold">La sala d'attesa è vuota.</p>
                    <p className="text-xs text-slate-400 mt-2">Ottimo lavoro per oggi!</p>
                </div>
              )}
            </div>
            
            {/* COLONNA DESTRA: FORM REFERTO */}
            <div className="lg:col-span-7">
              {referto.id ? (
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 sticky top-24 animate-in slide-in-from-right-8 duration-500">
                    
                    <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-100">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessione Clinica Attiva</p>
                            <h4 className="text-2xl font-black text-slate-900 mt-1">{referto.paziente}</h4>
                        </div>
                    </div>

                    <form onSubmit={inviaReferto} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                📝 Anamnesi ed Esito
                            </label>
                            <textarea 
                                required 
                                rows="6" 
                                className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 font-medium text-slate-700 transition-all resize-none shadow-inner" 
                                placeholder="Descrivi i sintomi, l'esame obiettivo e la diagnosi..." 
                                value={referto.esito} 
                                onChange={e => setReferto({...referto, esito: e.target.value})} 
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                💊 Piano Terapeutico (Opzionale)
                            </label>
                            <input 
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 font-bold text-teal-700 transition-all shadow-inner placeholder:text-slate-300 placeholder:font-medium" 
                                placeholder="Es: Paracetamolo 1000mg, 1 compressa ogni 8 ore" 
                                value={referto.farmaci} 
                                onChange={e => setReferto({...referto, farmaci: e.target.value})} 
                            />
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-teal-700 hover:shadow-teal-900/20 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
                            >
                                {isSubmitting ? (
                                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Salvataggio in corso...</>
                                ) : (
                                    <>🔒 Firma e Genera Referto</>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">L'azione genererà automaticamente la fattura per l'amministrazione</p>
                        </div>
                    </form>
                </div>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 sticky top-24">
                    <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center text-4xl mb-6">🩺</div>
                    <h4 className="text-xl font-black text-slate-700">Pronto per refertare</h4>
                    <p className="text-slate-400 font-medium mt-2 text-sm">Seleziona un paziente dalla coda per iniziare la visita.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISTA STORICO */
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Archivio Clinico</h4>
            {storico.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {storico.map((s, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="font-black text-slate-800 text-xl">{String(s.paziente || "Paziente")}</p>
                                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">
                                    {s.data ? new Date(s.data).toLocaleDateString() : "--/--/----"}
                                </p>
                            </div>
                            <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-xs">✅</span>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl mb-4 relative">
                            <span className="absolute -top-3 -left-2 text-4xl text-slate-200">"</span>
                            <p className="text-sm text-slate-600 font-medium italic relative z-10 line-clamp-3">
                                {String(s.esito_visita || "Nessun dettaglio.")}
                            </p>
                        </div>
                        {s.prescrizioni && s.prescrizioni !== "Nessuna terapia farmacologica prescritta." && (
                            <div className="flex items-start gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-100 p-3 rounded-xl">
                                <span>💊</span> <span className="line-clamp-2">{s.prescrizioni}</span>
                            </div>
                        )}
                    </div>
                    ))}
                </div>
            ) : (
                <div className="p-16 text-center bg-white rounded-[2.5rem] border border-slate-100">
                    <p className="text-slate-400 font-bold">Nessuna visita archiviata finora.</p>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}