import { useState, useEffect } from 'react';

export default function DashboardMedico({ utente }) {

  const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000" 
    : "https://project-work-l-31.onrender.com";

  const [vista, setVista] = useState('attesa');
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [storico, setStorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  // Stato del referto con tutti i dati clinici
  const [referto, setReferto] = useState({ 
    id: null, 
    paziente: '', 
    esito: '', 
    farmaci: '',
    sangue: '', 
    allergie: '',
    patologie: '', 
    telefono: '' 
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
      const dataStor = await resStor.json();

      // Filtriamo solo le prenotazioni programmate per questo specifico medico
      setPrenotazioni(Array.isArray(dataPren) ? dataPren.filter(p => p.stato === 'PROGRAMMATA' && p.id_medico === utente.id_collegato) : []);
      setStorico(Array.isArray(dataStor) ? dataStor : []);
    } catch (err) {
      console.error("Errore caricamento dati clinici:", err);
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
        alert('Referto firmato digitalmente e archiviato!');
        // Resettiamo la vista per tornare alla schermata di selezione paziente
        setReferto({ id: null, paziente: '', esito: '', farmaci: '', sangue: '', allergie: '', patologie: '', telefono: '' });
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
        <p className="text-teal-600 font-black animate-pulse text-xs uppercase tracking-widest">Sincronizzazione Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* HEADER MEDICO */}
      <header className="bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">

        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

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
            
            <div className="bg-black/10 backdrop-blur-md p-5 px-8 rounded-[2rem] border border-white/10 text-right shadow-inner">
                <p className="text-5xl font-black leading-none">{prenotazioni.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-100 mt-1">Pazienti in Coda</p>
            </div>
        </div>
        
        <div className="flex gap-2 mt-10 bg-black/10 p-1.5 rounded-2xl backdrop-blur-md w-fit relative z-10 border border-white/5">
          <button onClick={() => setVista('attesa')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${vista === 'attesa' ? 'bg-white text-teal-800 shadow-xl' : 'text-white hover:bg-white/10'}`}>
            📅 AGENDA DI OGGI
          </button>
          <button onClick={() => setVista('storico')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${vista === 'storico' ? 'bg-white text-teal-800 shadow-xl' : 'text-white hover:bg-white/10'}`}>
            🗄️ ARCHIVIO PAZIENTI
          </button>
        </div>
      </header>

      <main className="min-h-[500px]">
        {vista === 'attesa' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* COLONNA SINISTRA: LISTA PAZIENTI (CODA) */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-6">Pazienti in attesa</h4>
              
              {prenotazioni.length === 0 ? (
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center shadow-sm">
                      <span className="text-4xl mb-3 block">☕</span>
                      <p className="font-black text-slate-700">Nessun paziente</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">La sala d'attesa è vuota.</p>
                  </div>
              ) : (
                  prenotazioni.map(p => (
                    <button 
                      key={p.id_prenotazione} 
                      onClick={() => setReferto({
                          id: p.id_prenotazione, 
                          paziente: p.paziente_nome, 
                          esito: '', 
                          farmaci: '',
                          sangue: p.paziente_gruppo_sangue,
                          allergie: p.paziente_allergie,
                          patologie: p.paziente_patologie,
                          telefono: p.paziente_telefono
                      })}
                      className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-2 group
                      ${referto.id === p.id_prenotazione ? 'bg-teal-50 border-teal-500 shadow-xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-md'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${referto.id === p.id_prenotazione ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-600 group-hover:bg-teal-100'}`}>
                                {p.paziente_nome.charAt(0)}
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-lg tracking-tight">{p.paziente_nome}</p>
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-0.5">{p.tipo_visita}</p>
                            </div>
                        </div>
                    </button>
                  ))
              )}
            </div>
            
            {/* COLONNA DESTRA: DASHBOARD CLINICA / REFERTAZIONE */}
            <div className="lg:col-span-8">
              {referto.id ? (
                <div className="space-y-6 sticky top-8 animate-in slide-in-from-right-8 duration-500">
                    
                    {/* INFO BAR: ANAMNESI RAPIDA */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-5">
                            <div>
                                <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{referto.paziente}</h4>
                                <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest inline-block mt-2 border border-slate-200">
                                    ID Sessione: {String(referto.id).padStart(5, '0')}
                                </span>
                            </div>
                            
                            <div className="flex gap-3">
                                <div className="bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-100 flex flex-col items-center justify-center min-w-[70px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gruppo</p>
                                    <p className="text-lg font-black text-slate-800">{referto.sangue || "N.D."}</p>
                                </div>
                                
                                {referto.telefono && referto.telefono !== "Non inserito" && (
                                    <a href={`tel:${referto.telefono}`} className="bg-teal-50/50 hover:bg-teal-600 hover:text-white transition-all px-5 py-2.5 rounded-xl border border-teal-100 flex items-center gap-3 group">
                                        <span className="text-xl">📞</span>
                                        <div className="text-left">
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Contatto</p>
                                            <p className="text-sm font-black tracking-tight">{referto.telefono}</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* BOX ALLERGIE */}
                        <div className={`p-6 rounded-[2rem] border-2 flex flex-col justify-center h-full ${referto.allergie && referto.allergie.toLowerCase() !== "nessuna" ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                            <div className="flex items-start gap-4">
                                <span className={`text-4xl ${referto.allergie && referto.allergie.toLowerCase() !== "nessuna" ? 'animate-pulse' : ''}`}>
                                    {referto.allergie && referto.allergie.toLowerCase() !== "nessuna" ? '⚠️' : '🛡️'}
                                </span>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${referto.allergie && referto.allergie.toLowerCase() !== "nessuna" ? 'text-red-500' : 'text-emerald-500'}`}>
                                        Stato Allergologico
                                    </p>
                                    <p className={`text-lg font-black leading-tight ${referto.allergie && referto.allergie.toLowerCase() !== "nessuna" ? 'text-red-700' : 'text-emerald-700'}`}>
                                        {referto.allergie || "Nessuna allergia nota"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOX: PATOLOGIE PREGRESSE */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                        <div className="relative z-10 flex items-start gap-6">
                            <div className="w-14 h-14 rounded-[1.2rem] bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl border border-white/10 shrink-0">📋</div>
                            <div className="flex-1 pt-1">
                                <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em] mb-2">Anamnesi Remota / Patologie Pregresse</p>
                                <p className="text-lg font-medium text-slate-200 leading-relaxed italic">
                                    {referto.patologie || "Nessun dato clinico pregresso inserito nel sistema."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FORM DI REFERTAZIONE */}
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl">
                        <form onSubmit={inviaReferto} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">📝 Note dell'Esame Obiettivo</label>
                                <textarea required rows="5" className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-[2rem] focus:bg-white focus:border-teal-500/30 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-inner" 
                                    placeholder="Scrivi qui i risultati della visita e l'esito diagnostico..." value={referto.esito} onChange={e => setReferto({...referto, esito: e.target.value})} 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">💊 Prescrizioni e Terapie</label>
                                <input type="text" className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-2xl font-bold text-teal-700 focus:bg-white focus:border-teal-500/30 outline-none transition-all shadow-inner placeholder:text-teal-200" 
                                    placeholder="Es: Cardirene 75mg, 1 compressa dopo i pasti" value={referto.farmaci} onChange={e => setReferto({...referto, farmaci: e.target.value})} 
                                />
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-slate-200 hover:from-teal-600 hover:to-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                                {isSubmitting ? "Elaborazione in corso..." : <>🔒 Firma Referto Digitale e Chiudi Cartella</>}
                            </button>
                        </form>
                    </div>
                </div>
              ) : (
                /* STATO VUOTO: NESSUN PAZIENTE SELEZIONATO */
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-sm mb-6 animate-bounce">🩺</div>
                    <h4 className="text-2xl font-black text-slate-700 tracking-tight">Punto di Refertazione</h4>
                    <p className="text-slate-400 text-sm max-w-sm text-center mt-3 font-medium leading-relaxed">
                        Seleziona un paziente dalla coda laterale per visualizzare l'anamnesi completa, le patologie pregresse e iniziare la visita medica.
                    </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 🗄️ VISTA STORICO E ARCHIVIO REFERTI */
          <div className="space-y-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-6">Archivio Visite Effettuate</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                {storico.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                        <span className="text-4xl mb-4 block">📭</span>
                        <p className="text-slate-500 font-black text-xl">Nessun referto archiviato.</p>
                        <p className="text-sm text-slate-400 mt-2">Le visite completate appariranno qui.</p>
                    </div>
                ) : (
                    storico.map((s, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📄</div>
                                <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">
                                    {new Date(s.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <p className="font-black text-slate-800 text-2xl mb-1 tracking-tight">{s.paziente}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Esito Clinico</p>
                            
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
                                <span className="absolute -top-3 left-4 text-2xl opacity-20">"</span>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium italic relative z-10">{s.esito_visita}</p>
                            </div>
                        </div>
                        
                        {s.prescrizioni && s.prescrizioni !== "Nessuna terapia farmacologica prescritta." && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 flex items-center gap-2">💊 Prescrizione</p>
                                <p className="text-sm font-bold text-slate-700">{s.prescrizioni}</p>
                            </div>
                        )}
                    </div>
                    ))
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}