import { useState, useEffect } from 'react';

export default function DashboardAdmin() {
  // 🌟 AGGIUNTA LA VARIABILE D'AMBIENTE QUI
  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const [fatture, setFatture] = useState([]);

  const caricaDati = () => {
    // 🌟 URL DINAMICO: Ora usa apiUrl invece di 127.0.0.1
    fetch(`${apiUrl}/api/fatture/dettagliate`)
      .then(res => res.json())
      .then(setFatture)
      .catch(err => console.error("Errore nel caricamento fatture:", err)); // Aggiunto un catch per sicurezza!
  };

  useEffect(() => { caricaDati(); }, []);

  const totaleEmesso = fatture.reduce((s, f) => s + f.importo, 0);
  const totaleIncassato = fatture.filter(f => f.pagata).reduce((s, f) => s + f.importo, 0);
  const inPendenza = totaleEmesso - totaleIncassato;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header con Titolo e Data */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-slate-900">Finance Overview</h3>
          <p className="text-slate-500 font-medium">Monitoraggio in tempo reale MedCloud</p>
        </div>
        <div className="text-right text-sm text-slate-400 font-bold">
            {new Date().toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase()}
        </div>
      </div>
      
      {/* KPI Cards Modificate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10"></div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest relative z-10">Volume Affari</p>
          <h4 className="text-4xl font-black text-slate-800 mt-2 relative z-10">€ {totaleEmesso}</h4>
        </div>

        <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl shadow-emerald-100 text-white">
          <p className="text-emerald-200 text-xs font-black uppercase tracking-widest">Liquidità Incassata</p>
          <h4 className="text-4xl font-black mt-2">€ {totaleIncassato}</h4>
          <div className="mt-4 bg-emerald-500/30 rounded-full h-2">
            <div className="bg-white h-full rounded-full" style={{ width: `${(totaleIncassato/totaleEmesso)*100}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">In Attesa</p>
          <h4 className="text-4xl font-black text-orange-500 mt-2">€ {inPendenza}</h4>
          <p className="text-[10px] text-slate-400 mt-2">{(inPendenza/totaleEmesso*100).toFixed(1)}% del totale da riscuotere</p>
        </div>
      </div>

      {/* Sezione Transazioni Recenti */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-tighter">Ultime Transazioni</h4>
          <button onClick={caricaDati} className="text-blue-600 text-xs font-bold hover:underline">Aggiorna dati</button>
        </div>
        
        <div className="divide-y divide-slate-50">
          {fatture.map(f => (
            <div key={f.id_fattura} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${f.pagata ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-500'}`}>
                  {f.paziente.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{f.paziente}</p>
                  <p className="text-xs text-slate-400 font-medium">Fattura #{f.id_fattura} • {new Date(f.data_emissione).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-slate-900 text-lg">€ {f.importo}</p>
                <p className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block ${f.pagata ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                  {f.pagata ? 'SUCCESS' : 'PENDING'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}