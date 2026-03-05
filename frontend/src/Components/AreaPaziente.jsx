import { useState, useEffect } from 'react';

// --- MOTORE DI ICONE DINAMICHE ---
const getIconaPrestazione = (nome) => {
    const n = nome.toLowerCase();
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
    return '🩺'; // Default
};

const getIconaMedico = (nome) => {
    if (!nome) return '🧑‍⚕️';
    const n = nome.trim().toLowerCase();
    // Eccezioni maschili italiane che finiscono in 'a'
    const eccezioniMaschili = ['andrea', 'luca', 'mattia', 'nicola', 'elia', 'battista', 'giammaria'];
    if (eccezioniMaschili.includes(n)) return '👨‍⚕️';
    if (n.endsWith('a')) return '👩‍⚕️';
    return '👨‍⚕️'; // Default maschile per gli altri
};

export default function AreaPaziente({ utente }) {
  const apiUrl = "https://project-work-l-31.onrender.com";

  const [vista, setVista] = useState('prenota');
  const [dati, setDati] = useState({ medici: [], prestazioni: [], cartella: [], fatture: [] });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);
  
  const [selezione, setSelezione] = useState({ medico: null, prestazione: null, giorno: '', ora: '' });

  const orariDisponibili = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00"];

  const caricaDatiIniziali = async () => {
    try {
      setLoading(true);
      const [resMed, resPre, resCar, resFat] = await Promise.all([
        fetch(`${apiUrl}/api/medici`),
        fetch(`${apiUrl}/api/prestazioni`),
        fetch(`${apiUrl}/api/pazienti/${utente.id_collegato}/cartella`),
        fetch(`${apiUrl}/api/pazienti/${utente.id_collegato}/fatture`)
      ]);

      setDati({
        medici: await resMed.json(),
        prestazioni: await resPre.json(),
        cartella: await resCar.json(),
        fatture: await resFat.json()
      });
    } catch (err) {
      console.error("Errore caricamento dati:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (utente?.id_collegato) {
      caricaDatiIniziali();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utente]);

  const confermaPrenotazione = async () => {
    const { medico, prestazione, giorno, ora } = selezione;
    if(!medico || !prestazione || !giorno || !ora) {
        alert("Completa tutti e 3 i passaggi prima di confermare l'appuntamento!");
        return;
    }

    setIsSubmitting(true);
    const dataCompleta = `${giorno}T${ora}:00`;

    try {
      const res = await fetch(`${apiUrl}/api/prenotazioni`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_paziente: utente.id_collegato,
          id_medico: medico.id_medico,
          id_prestazione: prestazione.id_prestazione,
          data_ora: dataCompleta
        })
      });

      if (res.ok) {
        alert("✨ Prenotazione registrata con successo!");
        setSelezione({ medico: null, prestazione: null, giorno: '', ora: '' });
        await caricaDatiIniziali();
        setVista('cartella');
      } else {
        const errorData = await res.json();
        alert(`🚨 Attenzione: ${errorData.detail || "Errore nella prenotazione"}`);
      }
    } catch (err) {
      alert("Errore di connessione: il server non risponde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pagaFattura = async (id) => {
    if(!window.confirm("Confermi l'autorizzazione al pagamento?")) return;
    setPayingId(id);
    try {
      const res = await fetch(`${apiUrl}/api/fatture/${id}/paga`, { method: 'PATCH' });
      if (res.ok) {
        alert("💳 Pagamento elaborato con successo!");
        await caricaDatiIniziali();
      }
    } catch (err) {
      alert("Errore durante l'elaborazione del pagamento.");
    } finally {
      setPayingId(null);
    }
  };

  if (loading && dati.prestazioni.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-blue-600 font-black animate-pulse uppercase tracking-[0.3em] text-xs">Accesso Cartella Clinica...</p>
      </div>
    );
  }

  const nomePaziente = String(utente?.nome_completo || "Paziente");
  const iniziale = nomePaziente.charAt(0).toUpperCase() || "U";
  
  // Calcolo KPI per la nuova Glass Card
  const visiteFuture = dati.cartella.filter(c => c.stato === 'PROGRAMMATA').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* HEADER GLASSMORPHISM PREMIUM */}
      <header className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[1.8rem] flex items-center justify-center text-white text-3xl shadow-inner border border-white/20 font-black">
                    {iniziale}
                </div>
                <div>
                    <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-white/10 shadow-inner">
                        Area Privata
                    </span>
                    <h2 className="text-4xl font-black mt-4 tracking-tight">Ciao, {nomePaziente.split(' ')[0]}</h2>
                    <p className="text-blue-100 font-medium mt-1 text-sm uppercase tracking-widest">
                        Codice ID: {String(utente?.id_collegato).padStart(5, '0')}
                    </p>
                </div>
            </div>

            {/* NUOVA GLASS CARD SOSTITUTIVA AL CUORE */}
            <div className="flex flex-col items-end">
                <div className="text-right bg-black/10 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-inner">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-1">Prossime Visite</p>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <p className="text-3xl font-black tracking-widest">{visiteFuture}</p>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-10 bg-black/10 p-1.5 rounded-2xl backdrop-blur-md w-fit relative z-10 border border-white/5">
          <button onClick={() => setVista('prenota')} className={`px-6 md:px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'prenota' ? 'bg-white text-blue-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            📅 NUOVA VISITA
          </button>
          <button onClick={() => setVista('cartella')} className={`px-6 md:px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'cartella' ? 'bg-white text-blue-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            🏥 STORICO SALUTE
          </button>
          <button onClick={() => setVista('pagamenti')} className={`px-6 md:px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'pagamenti' ? 'bg-white text-blue-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            💳 PAGAMENTI
          </button>
        </div>
      </header>

      <main className="min-h-[500px]">
        {/* --- VISTA PRENOTAZIONE --- */}
        {vista === 'prenota' && (
          <div className="space-y-12">
            {/* STEP 1: PRESTAZIONE */}
            <section className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6 ml-2">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shadow-inner">1</span>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Seleziona la Prestazione</h4>
                        <p className="text-xs text-slate-400 font-medium">Scegli il tipo di visita o clicca di nuovo per deselezionare</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dati.prestazioni.map(p => {
                        const isSelected = selezione.prestazione?.id_prestazione === p.id_prestazione;
                        return (
                            <button 
                                key={p.id_prestazione} 
                                // 🌟 AGGIUNTO IL TOGGLE PER LA DESELEZIONE
                                onClick={() => setSelezione({...selezione, prestazione: isSelected ? null : p})}
                                className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden
                                ${isSelected ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-900/10' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'}`}>
                                {isSelected && <div className="absolute top-4 right-4 text-blue-500 text-lg">✅</div>}
                                <span className="text-4xl transition-transform group-hover:scale-110">
                                    {getIconaPrestazione(p.nome_prestazione)}
                                </span>
                                <p className={`font-black text-xs text-center ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{p.nome_prestazione}</p>
                                <p className={`text-[10px] font-black px-4 py-1.5 rounded-full ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>€{p.costo}</p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* STEP 2: MEDICO */}
            <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="flex items-center gap-4 mb-6 ml-2">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shadow-inner">2</span>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Scegli lo Specialista</h4>
                        <p className="text-xs text-slate-400 font-medium">I nostri medici a tua disposizione</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dati.medici.map(m => {
                        const isSelected = selezione.medico?.id_medico === m.id_medico;
                        return (
                            <button 
                                key={m.id_medico} 
                                // 🌟 AGGIUNTO IL TOGGLE PER LA DESELEZIONE
                                onClick={() => setSelezione({...selezione, medico: isSelected ? null : m})}
                                className={`p-5 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 text-left relative overflow-hidden
                                ${isSelected ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-900/10' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-md'}`}>
                                {isSelected && <div className="absolute top-4 right-4 text-blue-500 text-sm">✅</div>}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {getIconaMedico(m.nome)}
                                </div>
                                <div>
                                    <p className={`font-black text-lg ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>Dott. {m.cognome}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{m.specializzazione}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* STEP 3: CALENDARIO & CONFERMA */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="flex items-center gap-4 mb-8">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shadow-inner">3</span>
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Data e Ora</h4>
                        <p className="text-xs text-slate-400 font-medium">Quando preferisci effettuare la visita?</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Giorno</label>
                        <input type="date" 
                               min={new Date().toISOString().split('T')[0]}
                               className="w-full bg-white border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-black text-slate-700 shadow-sm transition-all outline-none" 
                               value={selezione.giorno} 
                               onChange={e => setSelezione({...selezione, giorno: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Orario</label>
                        <div className="grid grid-cols-4 gap-2">
                          {orariDisponibili.map(ora => {
                            const isSelected = selezione.ora === ora;
                            return (
                                <button
                                key={ora}
                                type="button"
                                // 🌟 AGGIUNTO IL TOGGLE PER LA DESELEZIONE ORARIO
                                onClick={() => setSelezione({...selezione, ora: isSelected ? '' : ora})}
                                className={`p-3 rounded-xl text-xs font-black transition-all duration-300 border 
                                    ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}
                                >
                                {ora}
                                </button>
                            );
                          })}
                        </div>
                    </div>
                </div>

                <button 
                    onClick={confermaPrenotazione} 
                    disabled={isSubmitting || !selezione.medico || !selezione.prestazione || !selezione.giorno || !selezione.ora}
                    className="w-full mt-10 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isSubmitting ? (
                        <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> Registrazione in corso...</>
                    ) : (
                        <>Conferma Appuntamento</>
                    )}
                </button>
            </section>
          </div>
        )}

        {/* --- VISTA CARTELLA CLINICA --- */}
        {vista === 'cartella' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Il tuo percorso clinico</h4>
            {dati.cartella.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <span className="text-6xl mb-4 grayscale opacity-20">📁</span>
                    <p className="text-slate-500 font-black text-lg">Nessun documento in archivio.</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">Le tue visite e i referti appariranno qui.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {dati.cartella.map(c => {
                        const isCompletata = c.stato === 'COMPLETATA';
                        return (
                            <div key={c.id_prenotazione} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between md:items-center gap-6 group">
                                <div className="flex gap-6 items-center">
                                    <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-4xl shadow-inner transition-colors
                                        ${isCompletata ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                                        {isCompletata ? getIconaPrestazione(c.prestazione) : '⏳'}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-800">{String(c.prestazione || "Visita Medica")}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black tracking-widest">{String(c.medico || "Medico")}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {c.data ? new Date(c.data).toLocaleDateString('it-IT', {day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit'}) : "--"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {isCompletata ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl md:max-w-xs w-full text-sm font-medium text-slate-600 border border-slate-100 italic relative">
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest not-italic block mb-1">Esito Clinico:</span>
                                        <span className="line-clamp-2">{c.esito_visita}</span>
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-100 text-blue-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        Visita Programmata
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        )}

        {/* --- VISTA PAGAMENTI --- */}
        {vista === 'pagamenti' && (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Centro Amministrativo</h4>
                {dati.fatture.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                        <span className="text-6xl mb-4 grayscale opacity-20">💳</span>
                        <p className="text-slate-500 font-black text-lg">Nessuna fattura presente.</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">Sei in regola con tutti i pagamenti.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {dati.fatture.map(f => {
                            const isPagata = f.pagata;
                            const isPayingThis = payingId === f.id_fattura;

                            return (
                                <div key={f.id_fattura} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner
                                            ${isPagata ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                                            {isPagata ? '✓' : '🧾'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-xl">Fattura #{String(f.id_fattura).padStart(4, '0')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                Emessa il: {f.data_emissione ? new Date(f.data_emissione).toLocaleDateString() : '--'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-8 border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                                        <p className="text-3xl font-black text-slate-900">€{f.importo}</p>
                                        {isPagata ? (
                                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest border border-emerald-200 shadow-sm flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Saldata
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => pagaFattura(f.id_fattura)} 
                                                disabled={isPayingThis}
                                                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isPayingThis ? (
                                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Elaborazione...</>
                                                ) : (
                                                    <>Paga Ora →</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
}