import { useState, useEffect } from 'react';

export default function DashboardMedico({ utente }) {
  // 🌟 VARIABILE D'AMBIENTE AGGIUNTA
  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const [vista, setVista] = useState('attesa'); // 'attesa' o 'storico'
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [storico, setStorico] = useState([]);
  const [esito, setEsito] = useState('');
  const [prescrizioni, setPrescrizioni] = useState('');
  const [idSelezionato, setIdSelezionato] = useState(null);

  const caricaDati = () => {
    // 🌟 FETCH 1 CORRETTA
    fetch(`${apiUrl}/api/prenotazioni`)
      .then(r => r.json())
      .then(data => setPrenotazioni(data.filter(p => p.stato === 'PROGRAMMATA' && p.id_medico === utente.id_collegato)))
      .catch(err => console.error("Errore prenotazioni:", err));

    // 🌟 FETCH 2 CORRETTA
    fetch(`${apiUrl}/api/medici/${utente.id_collegato}/storico`)
      .then(r => r.json())
      .then(setStorico)
      .catch(err => console.error("Errore storico:", err));
  };

  useEffect(() => { caricaDati(); }, [utente]);

  const inviaReferto = (e) => {
    e.preventDefault();
    // 🌟 FETCH 3 CORRETTA
    fetch(`${apiUrl}/api/referti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id_prenotazione: idSelezionato, 
        esito_visita: esito, 
        prescrizioni: prescrizioni || null 
      })
    }).then(res => {
      if (res.ok) {
        alert('✅ Referto inviato correttamente!');
        setEsito(''); setPrescrizioni(''); setIdSelezionato(null);
        caricaDati();
      } else {
        alert('❌ Errore durante l\'invio del referto.');
      }
    }).catch(err => alert("Errore di rete: " + err.message));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Professionale */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">Area Specialistica</span>
            </div>
            <h2 className="text-3xl font-black">{utente.nome_completo}</h2>
            <p className="text-teal-50/80 font-medium">Specialista in {utente.specializzazione || "Medicina Generale"}</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-8 bg-black/10 p-1.5 rounded-2xl backdrop-blur-md w-fit relative z-10">
          <button onClick={() => setVista('attesa')} className={`px-5 py-2 rounded-xl text-sm font-bold transition ${vista === 'attesa' ? 'bg-white text-teal-700 shadow-sm' : 'hover:bg-white/10 text-white'}`}>📅 Agenda Odierna</button>
          <button onClick={() => setVista('storico')} className={`px-5 py-2 rounded-xl text-sm font-bold transition ${vista === 'storico' ? 'bg-white text-teal-700 shadow-sm' : 'hover:bg-white/10 text-white'}`}>🗄️ Archivio Referti</button>
        </div>

        {/* Decorazione Icona di Sfondo */}
        <div className="absolute right-[-20px] bottom-[-20px] text-white/10 text-[150px] rotate-12 pointer-events-none">🩺</div>
      </div>

      <main>
        
        {/* VIEW: PAZIENTI IN ATTESA */}
        {vista === 'attesa' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Lista Pazienti */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Pazienti pronti</h4>
              {prenotazioni.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                    Nessun paziente in coda.
                </div>
              ) : (
                prenotazioni.map(p => (
                  <div key={p.id_prenotazione} 
                       onClick={() => setIdSelezionato(p.id_prenotazione)}
                       className={`p-5 rounded-3xl border transition-all cursor-pointer ${idSelezionato === p.id_prenotazione ? 'bg-teal-50 border-teal-200 shadow-md scale-[1.02]' : 'bg-white border-slate-100 hover:border-teal-200'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center font-bold">#{p.id_paziente}</div>
                            <div>
                                <p className="font-black text-slate-800">Visita #{p.id_prenotazione}</p>
                                <p className="text-xs font-bold text-teal-600 uppercase tracking-tighter">{new Date(p.data_ora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-lg">LIVE</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form Refertazione */}
            <div className="lg:col-span-7">
                {idSelezionato ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 sticky top-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-black text-slate-800">Referto Medico</h4>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ID SESSIONE: {idSelezionato}</span>
                        </div>

                        <form onSubmit={inviaReferto} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Esame Obiettivo ed Esito</label>
                                <textarea required rows="5" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-teal-500 font-medium placeholder:text-slate-300" placeholder="Descrivi l'esito della visita..." value={esito} onChange={e => setEsito(e.target.value)}></textarea>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Terapia e Prescrizioni</label>
                                <textarea rows="3" className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-teal-500 font-medium placeholder:text-slate-300" placeholder="Inserisci farmaci o indicazioni..." value={prescrizioni} onChange={e => setPrescrizioni(e.target.value)}></textarea>
                            </div>

                            <button type="submit" className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all mt-4">
                                Firma e Salva Referto
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-300 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <span className="text-4xl mb-4">👈</span>
                        <p className="font-bold">Seleziona un paziente per iniziare la visita</p>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* VIEW: STORICO REFERTI */}
        {vista === 'storico' && (
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-2">Visite completate di recente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storico.length === 0 ? (
                    <p className="text-slate-400">Nessun referto archiviato.</p>
                ) : storico.map((s, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition group">
                        <div className="flex justify-between items-start mb-4">
                            <p className="font-black text-slate-800 text-lg">{s.paziente}</p>
                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-widest">{new Date(s.data).toLocaleDateString()}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl text-sm border border-slate-100 mb-3">
                            <p className="font-bold text-slate-400 text-[10px] uppercase mb-1">Esito</p>
                            <p className="text-slate-700 font-medium italic">"{s.esito_visita}"</p>
                        </div>
                        {s.prescrizioni && (
                            <div className="flex items-center gap-2 text-teal-600 font-bold text-xs bg-teal-50 w-fit px-3 py-1 rounded-full">
                                💊 {s.prescrizioni}
                            </div>
                        )}
                    </div>
                ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}