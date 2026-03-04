import { useState, useEffect } from 'react'
import AreaPaziente from './Components/AreaPaziente'
import DashboardMedico from './Components/DashboardMedico'
import DashboardAdmin from './Components/DashboardAdmin'
import Footer from './Components/Footer' // Assicurati di aver creato questo file!

function App() {
  // 🌟 ECCO LA MAGIA: Questa riga decide quale URL usare
  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const [statoBackend, setStatoBackend] = useState("In connessione...")
  const [vistaAttiva, setVistaAttiva] = useState('paziente')
  const [utentiLoggati, setUtentiLoggati] = useState({ paziente: null, medico: null, admin: null })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // 🌟 SOSTITUITO L'URL FISSO CON LA VARIABILE
    fetch(`${apiUrl}/`)
      .then(res => res.json())
      .then(data => setStatoBackend(data.messaggio))
      .catch(() => setStatoBackend("Offline 🚨"))
  }, [])

  const eseguiLogin = (e) => {
    e.preventDefault();
    // 🌟 SOSTITUITO L'URL FISSO CON LA VARIABILE
    fetch(`${apiUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    .then(res => {
      if(res.ok) return res.json();
      throw new Error("Credenziali errate!");
    })
    .then(dati => {
      if (dati.ruolo.toLowerCase() !== vistaAttiva) {
        alert(`Accesso negato: queste sono credenziali da ${dati.ruolo}!`);
        return;
      }
      setUtentiLoggati(prev => ({ ...prev, [vistaAttiva]: dati }));
      setEmail(''); setPassword('');
    })
    .catch(err => alert(err.message));
  };

  const eseguiLogout = () => {
    setUtentiLoggati(prev => ({ ...prev, [vistaAttiva]: null }));
  };

  const renderizzaContenuto = () => {
    const utenteCorrente = utentiLoggati[vistaAttiva];

    if (!utenteCorrente && vistaAttiva !== 'admin') {
      return (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-slate-100 max-w-md mx-auto mt-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🔐</div>
            <h3 className="text-2xl font-black text-slate-900">Area Riservata</h3>
            <p className="text-slate-400 font-medium mt-1">Accedi come {vistaAttiva.toUpperCase()}</p>
          </div>
          <form onSubmit={eseguiLogin} className="space-y-4">
            <input type="email" placeholder="Email aziendale" required className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full bg-slate-50 border-none p-4 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">Entra in MedCloud</button>
          </form>
        </div>
      );
    }

    if (vistaAttiva === 'admin') return <DashboardAdmin />;
    if (vistaAttiva === 'paziente') return <AreaPaziente utente={utenteCorrente} />;
    if (vistaAttiva === 'medico') return <DashboardMedico utente={utenteCorrente} />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* NAVBAR GLASSMORPHISM */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">M</div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">MedCloud</h1>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Health System</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
              <div className={`w-2 h-2 rounded-full animate-pulse ${statoBackend.includes('🚨') ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{statoBackend}</span>
            </div>

            {utentiLoggati[vistaAttiva] && (
                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-black text-slate-900 leading-none">{utentiLoggati[vistaAttiva].nome_completo}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{vistaAttiva}</p>
                    </div>
                    <button onClick={eseguiLogout} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <span className="text-lg">✕</span>
                    </button>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col lg:flex-row gap-12 flex-1 w-full">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-2">Area di Lavoro</p>
          
          {['paziente', 'medico', 'admin'].map(ruolo => (
            <button 
              key={ruolo}
              onClick={() => { setVistaAttiva(ruolo); setEmail(''); setPassword(''); }}
              className={`group flex items-center justify-between p-5 rounded-[1.5rem] font-black text-sm transition-all duration-300 border ${vistaAttiva === ruolo 
                ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 border-slate-900 scale-[1.03]' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100 hover:border-slate-200'}`}
            >
              <span className="flex items-center gap-4">
                <span className="text-xl">{ruolo === 'paziente' ? '👤' : ruolo === 'medico' ? '🩺' : '📊'}</span>
                {ruolo.toUpperCase()}
              </span>
              <span className={`text-blue-500 transition-transform duration-300 group-hover:translate-x-1 ${vistaAttiva === ruolo ? 'opacity-100' : 'opacity-0'}`}>→</span>
            </button>
          ))}
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {renderizzaContenuto()}
        </main>

      </div>

      <Footer />
    </div>
  )
}

export default App