import { useState, useEffect } from 'react';

export default function AreaPaziente({ utente }) {
  // Stati per la navigazione e i dati
  const [vista, setVista] = useState('prenota'); // 'prenota', 'cartella', 'pagamenti'
  const [medici, setMedici] = useState([]);
  const [prestazioni, setPrestazioni] = useState([]);
  const [cartella, setCartella] = useState([]);
  const [fatture, setFatture] = useState([]);
  
  // Stato per la nuova selezione grafica (addio vecchie tendine!)
  const [selezione, setSelezione] = useState({ medico: null, prestazione: null, data: '' });

  // 1. Funzioni di Caricamento Dati
  const caricaTutto = () => {
    // Carica lo storico clinico
    fetch(`http://127.0.0.1:8000/api/pazienti/${utente.id_collegato}/cartella`)
      .then(r => r.json())
      .then(setCartella);
    
    // Carica le fatture personali
    fetch(`http://127.0.0.1:8000/api/pazienti/${utente.id_collegato}/fatture`)
      .then(r => r.json())
      .then(setFatture);
  };

  useEffect(() => {
    // Carica medici e prestazioni disponibili per tutti
    fetch('http://127.0.0.1:8000/api/medici').then(r => r.json()).then(setMedici);
    fetch('http://127.0.0.1:8000/api/prestazioni').then(r => r.json()).then(setPrestazioni);
    caricaTutto();
  }, [utente]);

  // 2. Azioni (Logica di Business)

  const confermaPrenotazione = () => {
    if(!selezione.medico || !selezione.prestazione || !selezione.data) {
        alert("Per favore, seleziona tutti i campi prima di confermare!");
        return;
    }

    fetch('http://127.0.0.1:8000/api/prenotazioni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_paziente: utente.id_collegato,
        id_medico: selezione.medico.id_medico,
        id_prestazione: selezione.prestazione.id_prestazione,
        data_ora: selezione.data
      })
    }).then(res => {
      if (res.ok) {
        alert("✨ Appuntamento confermato! Ti aspettiamo in clinica.");
        caricaTutto();
        setVista('cartella'); // Vai a vedere la visita appena creata
        setSelezione({ medico: null, prestazione: null, data: '' });
      } else { 
        alert("🚨 Spiacenti, il medico è già occupato in questo orario."); 
      }
    });
  };

  const attivaPromemoriaBackend = (idPrenotazione) => {
    fetch('http://127.0.0.1:8000/api/promemoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_prenotazione: idPrenotazione })
    }).then(res => {
      if(res.ok) alert("🔔 Promemoria attivato! Riceverai una notifica prima della visita.");
    });
  };

  const pagaFattura = (id) => {
    fetch(`http://127.0.0.1:8000/api/fatture/${id}/paga`, { 
      method: 'PATCH' 
    })
    .then(res => {
      if (res.ok) {
        alert("💳 Pagamento completato con successo! Grazie.");
        caricaTutto();
      } else {
        alert("🚨 Errore durante il processo di pagamento.");
      }
    });
  };

  // 3. Interfaccia Utente (Rendering)
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER PREMIUM */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">MedCloud Center</h2>
            <p className="text-slate-400 font-medium">Gestione Salute: {utente.nome_completo}</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {['prenota', 'cartella', 'pagamenti'].map(t => (
            <button 
              key={t} 
              onClick={() => setVista(t)} 
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${vista === t ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main>
        {/* VIEW: PRENOTAZIONE (Design a Card) */}
        {vista === 'prenota' && (
          <div className="space-y-8">
            <section>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">1. Tipo di Visita</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {prestazioni.map(p => (
                        <button 
                            key={p.id_prestazione}
                            onClick={() => setSelezione({...selezione, prestazione: p})}
                            className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selezione.prestazione?.id_prestazione === p.id_prestazione ? 'border-blue-500 bg-blue-50/50 scale-105' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                            <span className="text-3xl">🩺</span>
                            <p className="font-bold text-slate-800 text-sm text-center">{p.nome_prestazione}</p>
                            <p className="text-xs font-black text-blue-500">€{p.costo}</p>
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">2. Scegli lo Specialista</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {medici.map(m => (
                        <button 
                            key={m.id_medico}
                            onClick={() => setSelezione({...selezione, medico: m})}
                            className={`p-5 rounded-3xl border-2 transition-all flex items-center gap-4 text-left ${selezione.medico?.id_medico === m.id_medico ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl">👨‍⚕️</div>
                            <div>
                                <p className="font-black text-slate-800">Dott. {m.cognome}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{m.specializzazione}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <section className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="w-full md:w-1/2">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">3. Orario Visita</h4>
                    <input type="datetime-local" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" value={selezione.data} onChange={e => setSelezione({...selezione, data: e.target.value})} />
                </div>
                <button onClick={confermaPrenotazione} className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
                    CONFERMA ORA
                </button>
            </section>
          </div>
        )}

        {/* VIEW: CARTELLA CLINICA */}
        {vista === 'cartella' && (
          <div className="grid grid-cols-1 gap-4">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Storico Appuntamenti</h4>
            {cartella.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-3xl border border-dashed border-slate-300 text-slate-400 font-medium italic">Nessun dato in archivio.</div>
            ) : cartella.map(c => (
              <div key={c.id_prenotazione} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-6 items-center">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl ${c.stato === 'COMPLETATA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {c.stato === 'COMPLETATA' ? '✅' : '📅'}
                    </div>
                    <div>
                        <p className="text-xl font-black text-slate-800">{c.prestazione}</p>
                        <p className="text-sm font-bold text-slate-400">{new Date(c.data).toLocaleString()} • {c.medico}</p>
                    </div>
                </div>
                {c.stato === 'PROGRAMMATA' && (
                    <button onClick={() => attivaPromemoriaBackend(c.id_prenotazione)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition">
                        Attiva Alert 🔔
                    </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VIEW: PAGAMENTI */}
        {vista === 'pagamenti' && (
            <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-2">Centro Pagamenti</h4>
                {fatture.length === 0 ? (
                    <p className="ml-2 text-slate-400">Nessuna fattura emessa.</p>
                ) : fatture.map(f => (
                    <div key={f.id_fattura} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-3xl">🧾</span>
                            <div>
                                <p className="font-black text-slate-800">Fattura #{f.id_fattura}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{new Date(f.data_emissione).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <p className="text-2xl font-black">€{f.importo}</p>
                            {f.pagata ? (
                                <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">Paid</span>
                            ) : (
                                <button onClick={() => pagaFattura(f.id_fattura)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100">Pay Now</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}