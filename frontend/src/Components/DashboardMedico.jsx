import { useState, useEffect } from 'react';

export default function DashboardMedico({ utente }) {
  const apiUrl = "https://project-work-l-31.onrender.com";

  const [vista, setVista] = useState('attesa');
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [storico, setStorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  // 🌟 AGGIORNATO: lo stato ora include i dati clinici del paziente selezionato
  const [referto, setReferto] = useState({ 
    id: null, 
    paziente: '', 
    esito: '', 
    farmaci: '',
    sangue: '', 
    allergie: '' 
  });

  const caricaDati = async () => {
    if (!utente?.id_collegato) return;
    setLoading(true);
    try {
      const [resPren, resStor] = await Promise.all([
        fetch(`${apiUrl}/api/prenotazioni`),
        fetch(`${apiUrl}/api/medici/${utente.id_collegato}/storico`)
      ]);
      const dataPren = await resPren.json();
      
      // 🌟 AGGIUNGI QUESTA RIGA QUI:
      console.log("Dati ricevuti dal backend per le prenotazioni:", dataPren);

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
        setReferto({ id: null, paziente: '', esito: '', farmaci: '', sangue: '', allergie: '' });
        caricaDati(); 
      } else {
        const errorData = await res.json();
        alert(`🚨 Errore: ${errorData.detail || "Impossibile salvare il referto."}`);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Errore di connessione al server.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      {/* HEADER PREMIUM */}
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
        
        <div className="flex gap-2 mt-10 bg-black/10 p-1.5 rounded-2xl backdrop-blur-md w-fit relative z-10 border border-white/5">
          <button onClick={() => setVista('attesa')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'attesa' ? 'bg-white text-teal-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            📅 AGENDA DI OGGI
          </button>
          <button onClick={() => setVista('storico')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'storico' ? 'bg-white text-teal-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            🗄️ ARCHIVIO PAZIENTI
          </button>
        </div>
      </header>

      <main className="min-h-[500px]">
        {vista === 'attesa' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LISTA PAZIENTI */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-6">Coda Pazienti</h4>
              {prenotazioni.map(p => {
                const isActive = referto.id === p.id_prenotazione;
                return (
                  <button 
                    key={p.id_prenotazione} 
                    // 🌟 AGGIORNATO: Passiamo anche sangue e allergie allo stato referto
                    onClick={() => setReferto({
                        id: p.id_prenotazione, 
                        paziente: p.paziente_nome, 
                        esito: '', 
                        farmaci: '',
                        sangue: p.paziente_gruppo_sangue,
                        allergie: p.paziente_allergie
                    })}
                    className={`w-full text-left p-5 rounded-[2rem] border-2 transition-all duration-300 flex justify-between items-center
                    ${isActive ? 'bg-teal-50 border-teal-500 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-teal-200'}`}
                  >
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${isActive ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-600'}`}>
                            {p.paziente_nome.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black text-slate-800">{p.paziente_nome}</p>
                            <p className="text-[10px] font-black text-teal-600 uppercase mt-1">{p.tipo_visita}</p>
                        </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* FORM REFERTO E ANAMNESI */}
            <div className="lg:col-span-7">
              {referto.id ? (
                <div className="space-y-6 sticky top-24 animate-in slide-in-from-right-8 duration-500">
                    
                    {/* 🌟 NUOVA: CLINICAL INTELLIGENCE CARD (Laurea Point) */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                                <p className="text-[8px] font-black text-slate-400 uppercase">Gruppo Sanguigno</p>
                                <p className="text-lg font-black text-slate-900">{referto.sangue || "N.D."}</p>
                            </div>
                            
                            {/* ALLERTA ALLERGIE DINAMICA */}
                            {referto.allergie && referto.allergie.toLowerCase() !== "nessuna" ? (
                                <div className="bg-red-50 border border-red-200 px-5 py-2 rounded-2xl flex items-center gap-3 animate-pulse">
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <p className="text-[8px] font-black text-red-600 uppercase">Allerta Allergie</p>
                                        <p className="text-sm font-black text-red-700">{referto.allergie}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-100 px-5 py-2 rounded-2xl flex items-center gap-3">
                                    <span className="text-emerald-500 text-xl">🛡️</span>
                                    <div>
                                        <p className="text-[8px] font-black text-emerald-600 uppercase">Anamnesi Farmacologica</p>
                                        <p className="text-xs font-black text-emerald-700 uppercase">Nessuna allergia nota</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                             <h4 className="text-xl font-black text-slate-900 leading-none">{referto.paziente}</h4>
                             <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">ID Sessione: {referto.id}</p>
                        </div>
                    </div>

                    {/* FORM DI REFERTAZIONE */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl">
                        <form onSubmit={inviaReferto} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">📝 Esito Visita</label>
                                <textarea required rows="5" className="w-full bg-slate-50 border border-slate-200 p-6 rounded-[2rem] focus:ring-4 focus:ring-teal-500/10 outline-none" 
                                    placeholder="Annotazioni cliniche..." value={referto.esito} onChange={e => setReferto({...referto, esito: e.target.value})} 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">💊 Piano Farmacologico</label>
                                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-6 rounded-2xl font-bold text-teal-700 outline-none" 
                                    placeholder="Prescrizioni..." value={referto.farmaci} onChange={e => setReferto({...referto, farmaci: e.target.value})} 
                                />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-teal-700 transition-all">
                                {isSubmitting ? "Salvataggio..." : "🔒 Firma e Chiudi Cartella"}
                            </button>
                        </form>
                    </div>
                </div>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <span className="text-4xl mb-4">🩺</span>
                    <h4 className="text-xl font-black text-slate-700">Seleziona un paziente</h4>
                    <p className="text-slate-400 text-sm">Pronto per la visita.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISTA STORICO (Invariata) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {storico.map((s, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <p className="font-black text-slate-800 text-xl">{s.paziente}</p>
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">{new Date(s.data).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500 italic mt-4">"{s.esito_visita}"</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}