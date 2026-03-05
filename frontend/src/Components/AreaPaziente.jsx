import { useState, useEffect } from 'react';

// --- MOTORE DI LOGICA DINAMICA ---

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

const getTitoloMedico = (nome) => {
    if (!nome) return "Dott.";
    const n = nome.trim().toLowerCase();
    const eccezioniMaschili = ['andrea', 'luca', 'mattia', 'nicola', 'elia', 'battista', 'giammaria'];
    if (eccezioniMaschili.includes(n)) return "Dott.";
    if (n.endsWith('a')) return "Dott.ssa";
    return "Dott.";
};

const getIconaMedico = (nome) => {
    if (!nome) return '🧑‍⚕️';
    const titolo = getTitoloMedico(nome);
    return titolo === "Dott.ssa" ? '👩‍⚕️' : '👨‍⚕️';
};

export default function AreaPaziente({ utente }) {
  // LOGICA TESI: Gestione dinamica dell'URL API
  const apiUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://127.0.0.1:8000" 
  : "https://project-work-l-31.onrender.com";

  const [vista, setVista] = useState('prenota');
  const [dati, setDati] = useState({ medici: [], prestazioni: [], cartella: [], fatture: [], anamnesi: null });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);
  
  const [selezione, setSelezione] = useState({ medico: null, prestazione: null, giorno: '', ora: '' });

  const orariDisponibili = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00", "18:00"];

  const caricaDatiIniziali = async () => {
    if (!utente?.id_collegato) return;
    try {
      setLoading(true);
      const [resMed, resPre, resCar, resFat] = await Promise.all([
        fetch(`${apiUrl}/api/medici`),
        fetch(`${apiUrl}/api/prestazioni`),
        fetch(`${apiUrl}/api/pazienti/${utente.id_collegato}/cartella`),
        fetch(`${apiUrl}/api/pazienti/${utente.id_collegato}/fatture`)
      ]);
      
      const cartellaDati = await resCar.json();
      
      // Estrazione Anamnesi (Sangue, Allergie, CF) dal backend
      let anamnesiEstratta = { sangue: "N.D.", allergie: "Nessuna allergia nota", codiceFiscale: "N.A." };
      
      if (Array.isArray(cartellaDati) && cartellaDati.length > 0) {
           const recordValido = cartellaDati.find(c => c.gruppo_sanguigno !== undefined || c.allergie !== undefined);
           
           if(recordValido){
               anamnesiEstratta = { 
                   sangue: recordValido.gruppo_sanguigno || "N.D.", 
                   allergie: recordValido.allergie || "Nessuna allergia nota",
                   codiceFiscale: recordValido.codice_fiscale || "NON PRESENTE"
                };
           }
      }

      setDati({
        medici: await resMed.json(),
        prestazioni: await resPre.json(),
        cartella: cartellaDati,
        fatture: await resFat.json(),
        anamnesi: anamnesiEstratta
      });
    } catch (err) {
      console.error("Errore caricamento dati:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    caricaDatiIniziali();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [utente]);

  const confermaPrenotazione = async () => {
    const { medico, prestazione, giorno, ora } = selezione;
    if(!medico || !prestazione || !giorno || !ora) {
        alert("Completa tutti i passaggi prima di confermare!");
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
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Errore di connessione al server.");
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
        alert("💳 Pagamento elaborato!");
        await caricaDatiIniziali();
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Errore durante il pagamento.");
    } finally {
      setPayingId(null);
    }
  };

  // 🌟 FUNZIONE PDF CORRETTA (Ora è dentro il componente!)
  const scaricaPDF = (idFattura) => {
    window.open(`${apiUrl}/api/fatture/${idFattura}/pdf`, '_blank');
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
  const cognomePaziente = nomePaziente.split(' ').slice(1).join(' ') || "Utente";
  const soloNome = nomePaziente.split(' ')[0] || "Paziente";
  const iniziale = nomePaziente.charAt(0).toUpperCase() || "U";
  
  // Utilizziamo il CF dal backend (anamnesi), o quello dell'utente, o uno di fallback
  const cfPaziente = dati.anamnesi?.codiceFiscale || utente?.codice_fiscale || "CARICAMENTO...";
  
  const visiteFuture = Array.isArray(dati.cartella) ? dati.cartella.filter(c => c.stato === 'PROGRAMMATA').length : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* HEADER GLASSMORPHISM */}
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
                    <h2 className="text-4xl font-black mt-4 tracking-tight">Ciao, {soloNome}</h2>
                    <p className="text-blue-100 font-medium mt-1 text-sm uppercase tracking-widest">
                        Paziente ID: {String(utente?.id_collegato).padStart(5, '0')}
                    </p>
                </div>
            </div>

            {/* Glass Card Statistiche */}
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
          <button onClick={() => setVista('profilo')} className={`px-6 md:px-8 py-3 rounded-xl text-xs font-black transition-all duration-300 ${vista === 'profilo' ? 'bg-white text-blue-800 shadow-xl scale-105' : 'text-white hover:bg-white/10'}`}>
            🧬 PROFILO CLINICO
          </button>
        </div>
      </header>

      <main className="min-h-[500px]">
        
        {/* --- VISTA PROFILO CLINICO E ANAMNESI (TESSERA SANITARIA) --- */}
        {vista === 'profilo' && (
           <div className="space-y-8 animate-in fade-in duration-500">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Il tuo Profilo Sanitario</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    
                    {/* 🇮🇹 TESSERA SANITARIA DIGITALE */}
                    <div className="relative group perspective-1000">
                        <div className="relative w-full aspect-[1.6/1] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-[1.5rem] p-6 text-white shadow-2xl overflow-hidden border-b-4 border-blue-800 transition-transform duration-500 group-hover:-translate-y-2">
                            
                            {/* Texture Sfondo finta tessera */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                            
                            {/* Header Tessera */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-2 items-center">
                                    <div className="w-8 h-6 bg-blue-800 rounded-sm flex items-center justify-center font-bold text-[8px] border border-blue-300">IT</div>
                                    <div className="leading-none">
                                        <p className="text-[10px] font-black uppercase tracking-tighter">Repubblica Italiana</p>
                                        <p className="text-[8px] font-bold text-blue-100 uppercase italic">Tessera Sanitaria</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase">Carta Regionale dei Servizi</p>
                                </div>
                            </div>

                            {/* Chip Dorato */}
                            <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-md border border-yellow-700 shadow-inner flex flex-col justify-around p-1 mb-6">
                                <div className="h-px bg-yellow-800/30 w-full"></div>
                                <div className="h-px bg-yellow-800/30 w-full"></div>
                                <div className="h-px bg-yellow-800/30 w-full"></div>
                            </div>

                            {/* Dati Tessera */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[8px] font-bold uppercase text-blue-100 opacity-80">Codice Fiscale</p>
                                    <p className="text-xl md:text-2xl font-mono font-black tracking-[0.2em]">{cfPaziente.toUpperCase()}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[8px] font-bold uppercase text-blue-100 opacity-80">Cognome / Surname</p>
                                        <p className="text-sm font-black uppercase">{cognomePaziente}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold uppercase text-blue-100 opacity-80">Nome / Name</p>
                                        <p className="text-sm font-black uppercase">{soloNome}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Tessera */}
                            <div className="absolute bottom-6 right-6 flex flex-col items-end">
                                <p className="text-[8px] font-bold text-blue-100">Scadenza / Expiry</p>
                                <p className="text-xs font-black">31/12/2030</p>
                            </div>
                            
                            <div className="absolute bottom-4 left-6">
                                <div className="w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                                <p className="text-[8px] font-black tracking-widest opacity-40 uppercase">MedCloud Health Data</p>
                            </div>
                        </div>
                        {/* Ombra dinamica */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-12 bg-blue-900/20 blur-2xl -z-10"></div>
                    </div>

                    {/* ANAMNESI CLINICA (Card Destra) */}
                    <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                <span className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-sm">🧬</span>
                                Profilo Clinico Digitale
                            </h3>
                            
                            <div className="space-y-6">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Gruppo Sanguigno</p>
                                    <div className="flex items-center gap-4">
                                        <p className="text-5xl font-black tracking-tighter text-white">{dati.anamnesi?.sangue || "N.D."}</p>
                                        <div className="h-10 w-px bg-white/10"></div>
                                        <p className="text-xs text-slate-400 leading-tight">Dato verificato dal<br/>laboratorio centrale.</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Allergie e Intolleranze</p>
                                    {dati.anamnesi?.allergie && dati.anamnesi.allergie.toLowerCase() !== "nessuna" ? (
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl animate-pulse">⚠️</span>
                                            <p className="text-xl font-black text-red-400 uppercase">{dati.anamnesi.allergie}</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 text-emerald-400">
                                            <span className="text-3xl">🛡️</span>
                                            <p className="text-lg font-black uppercase tracking-tight">Nessuna allergia rilevata</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <p className="mt-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed">
                                I dati sono protetti da crittografia end-to-end conforme agli standard sanitari internazionali.
                            </p>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                    </div>
                </div>
           </div>
        )}

        {/* --- VISTA PRENOTA --- */}
        {vista === 'prenota' && (
          <div className="space-y-12">
            {/* STEP 1: PRESTAZIONE */}
            <section className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-6 ml-2">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shadow-inner">1</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tipo di Visita</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dati.prestazioni.map(p => {
                        const isSelected = selezione.prestazione?.id_prestazione === p.id_prestazione;
                        return (
                            <button key={p.id_prestazione} onClick={() => setSelezione({...selezione, prestazione: isSelected ? null : p})}
                                className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden
                                ${isSelected ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-900/10' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                                <span className="text-4xl">{getIconaPrestazione(p.nome_prestazione)}</span>
                                <p className={`font-black text-xs text-center ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{p.nome_prestazione}</p>
                                <p className={`text-[10px] font-black px-4 py-1.5 rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>€{p.costo}</p>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* STEP 2: MEDICO */}
            <section className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="flex items-center gap-4 mb-6 ml-2">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shadow-inner">2</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Scegli lo Specialista</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dati.medici.map(m => {
                        const isSelected = selezione.medico?.id_medico === m.id_medico;
                        return (
                            <button key={m.id_medico} onClick={() => setSelezione({...selezione, medico: isSelected ? null : m})}
                                className={`p-5 rounded-3xl border-2 transition-all duration-300 flex items-center gap-4 text-left relative overflow-hidden
                                ${isSelected ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl shadow-blue-900/10' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {getIconaMedico(m.nome)}
                                </div>
                                <div>
                                    <p className={`font-black text-lg ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {getTitoloMedico(m.nome)} {m.cognome}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{m.specializzazione}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* STEP 3: CALENDARIO */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="flex items-center gap-4 mb-8">
                    <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm shadow-inner">3</span>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Data e Ora</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Giorno</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]}
                               className="w-full bg-white border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none font-black text-slate-700 shadow-sm" 
                               value={selezione.giorno} onChange={e => setSelezione({...selezione, giorno: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-3">Orario</label>
                        <div className="grid grid-cols-4 gap-2">
                          {orariDisponibili.map(ora => {
                            const isSelected = selezione.ora === ora;
                            return (
                                <button key={ora} type="button" onClick={() => setSelezione({...selezione, ora: isSelected ? '' : ora})}
                                    className={`p-3 rounded-xl text-xs font-black transition-all border 
                                    ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
                                    {ora}
                                </button>
                            );
                          })}
                        </div>
                    </div>
                </div>

                <button onClick={confermaPrenotazione} disabled={isSubmitting || !selezione.medico || !selezione.prestazione || !selezione.giorno || !selezione.ora}
                    className="w-full mt-10 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                    {isSubmitting ? <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> Attendere...</> : <>Conferma Appuntamento</>}
                </button>
            </section>
          </div>
        )}

        {/* --- CARTELLA CLINICA --- */}
        {vista === 'cartella' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Storico Salute</h4>
            {!dati.cartella || dati.cartella.length === 0 ? (
                <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100"><p className="text-slate-400 font-black">Nessun documento.</p></div>
            ) : (
                <div className="space-y-4">
                    {dati.cartella.map(c => {
                        const isCompletata = c.stato === 'COMPLETATA';
                        const medicoPuro = c.medico?.replace('Dott. ', '').replace('Dott.ssa ', '').trim();
                        return (
                            <div key={c.id_prenotazione} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
                                <div className="flex gap-6 items-center">
                                    <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center text-4xl shadow-inner
                                        ${isCompletata ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {isCompletata ? getIconaPrestazione(c.prestazione) : '⏳'}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-slate-800">{c.prestazione}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black tracking-widest">
                                                {getTitoloMedico(medicoPuro)} {medicoPuro}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                {c.data ? new Date(c.data).toLocaleDateString('it-IT', {day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit'}) : "--"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {isCompletata ? (
                                    <div className="bg-slate-50 p-4 rounded-2xl md:max-w-xs w-full text-sm font-medium text-slate-600 italic border border-slate-100">
                                        <span className="text-xs font-black text-emerald-600 uppercase block mb-1">Esito:</span>
                                        {c.esito_visita}
                                    </div>
                                ) : (
                                    <div className="bg-blue-50 text-blue-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Programmata
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
          </div>
        )}

        {/* --- PAGAMENTI --- */}
        {vista === 'pagamenti' && (
            <div className="space-y-6 animate-in fade-in duration-500">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Pagamenti</h4>
                {!dati.fatture || dati.fatture.length === 0 ? (
                    <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100"><p className="text-slate-400 font-black">Nessuna fattura.</p></div>
                ) : (
                    <div className="space-y-4">
                        {dati.fatture.map(f => {
                            const isPagata = f.pagata;
                            return (
                                <div key={f.id_fattura} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner
                                            ${isPagata ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                                            {isPagata ? '✓' : '🧾'}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 text-xl">Fattura #{String(f.id_fattura).padStart(4, '0')}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Emessa il: {new Date(f.data_emissione).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        <p className="text-3xl font-black text-slate-900">€{f.importo}</p>
                                        
                                        
                                        
                                        <div className="flex items-center gap-2">
                                            {isPagata ? (
                                                <>
                                                    {/* Mostra il Badge Verde E il Bottone PDF */}
                                                    <span className="flex items-center justify-center bg-emerald-50 text-emerald-700 text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest border border-emerald-200 h-12">Saldata ✓</span>
                                                    <button 
                                                        onClick={() => scaricaPDF(f.id_fattura)}
                                                        className="px-5 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-black text-lg hover:bg-slate-50 transition-all h-12 flex items-center justify-center"
                                                        title="Scarica Fattura PDF"
                                                    >
                                                        📄
                                                    </button>
                                                </>
                                            ) : (
                                                /* Se non è pagata, mostra SOLO il bottone per pagare */
                                                <button onClick={() => pagaFattura(f.id_fattura)} disabled={payingId === f.id_fattura}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-600 transition-all h-12">
                                                    {payingId === f.id_fattura ? 'Elaborazione...' : 'Paga Ora'}
                                                </button>
                                            )}
                                        </div>
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