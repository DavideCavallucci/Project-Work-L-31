import { useState, useEffect } from 'react'
import AreaPaziente from './Components/AreaPaziente'
import DashboardMedico from './Components/DashboardMedico'
import DashboardAdmin from './Components/DashboardAdmin'
import Footer from './Components/Footer'

// 🎨 CONFIGURAZIONE DEI TEMI DINAMICI
const UX_CONFIG = {
  paziente: {
    colore: 'blue',
    bgAttivo: 'bg-blue-600',
    ringFocus: 'focus:ring-blue-500',
    textGradient: 'from-blue-600 to-cyan-500',
    icona: '👤',
    titolo: 'Portale Pazienti',
    sottotitolo: 'I tuoi dati sanitari, sempre con te.'
  },
  medico: {
    colore: 'teal',
    bgAttivo: 'bg-teal-600',
    ringFocus: 'focus:ring-teal-500',
    textGradient: 'from-teal-600 to-emerald-500',
    icona: '🩺',
    titolo: 'Area Medica',
    sottotitolo: 'Gestione visite e refertazione clinica.'
  },
  admin: {
    colore: 'indigo',
    bgAttivo: 'bg-indigo-600',
    ringFocus: 'focus:ring-indigo-500',
    textGradient: 'from-indigo-600 to-purple-500',
    icona: '📊',
    titolo: 'Direzione Sanitaria',
    sottotitolo: 'Controllo flussi e amministrazione.'
  }
};

function App() {
  const apiUrl = "https://project-work-l-31.onrender.com";

  const [statoBackend, setStatoBackend] = useState("In connessione...")
  const [vistaAttiva, setVistaAttiva] = useState('paziente')
  const [utentiLoggati, setUtentiLoggati] = useState({ paziente: null, medico: null, admin: null })
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false) // 🌟 Feedback di caricamento per il login

  const temaCorrente = UX_CONFIG[vistaAttiva];

  useEffect(() => {
    fetch(`${apiUrl}/`)
      .then(res => res.json())
      .then(data => setStatoBackend(data.messaggio))
      .catch(() => setStatoBackend("Offline 🚨"))
  }, [])

  const eseguiLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) throw new Error("Credenziali errate!");
      
      const dati = await res.json();
      
      if (!dati || !dati.ruolo) throw new Error("Risposta del server non valida");
      
      if (dati.ruolo.toLowerCase() !== vistaAttiva) {
        alert(`Accesso negato: queste sono credenziali da ${dati.ruolo}!`);
        setIsLoggingIn(false);
        return;
      }

      setUtentiLoggati(prev => ({ ...prev, [vistaAttiva]: dati }));
      setEmail(''); 
      setPassword('');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const eseguiLogout = () => {
    setUtentiLoggati(prev => ({ ...prev, [vistaAttiva]: null }));
  };

  const renderizzaContenuto = () => {
    const utenteCorrente = utentiLoggati[vistaAttiva];

    // FORM DI LOGIN PREMIUM
    if (!utenteCorrente && vistaAttiva !== 'admin') {
      return (
        <div className="w-full max-w-md mx-auto mt-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
            
            {/* Decorazione Sfondo Login */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${temaCorrente.textGradient}`}></div>
            
            <div className="text-center mb-10">
              <div className={`w-20 h-20 ${temaCorrente.bgAttivo}/10 text-${temaCorrente.colore}-600 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner`}>
                {temaCorrente.icona}
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">{temaCorrente.titolo}</h3>
              <p className="text-slate-400 font-medium mt-2 text-sm">{temaCorrente.sottotitolo}</p>
            </div>

            <form onSubmit={eseguiLogin} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                <input 
                  type="email" 
                  placeholder="es. nome@medcloud.it" 
                  required 
                  className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-${temaCorrente.colore}-500/20 ${temaCorrente.ringFocus} font-medium transition-all shadow-inner`} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password di Sicurezza</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className={`w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl focus:ring-4 focus:ring-${temaCorrente.colore}-500/20 ${temaCorrente.ringFocus} font-medium transition-all shadow-inner`} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className={`w-full ${temaCorrente.bgAttivo} text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-${temaCorrente.colore}-900/20 hover:opacity-90 transition-all duration-300 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-3`}
                >
                  {isLoggingIn ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Autenticazione...</>
                  ) : (
                    <>Accedi al Sistema</>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          <p className="text-center text-slate-400 text-xs font-medium mt-6">
            Accesso protetto e crittografato. © {new Date().getFullYear()} MedCloud.
          </p>
        </div>
      );
    }

    if (vistaAttiva === 'admin') return <DashboardAdmin />;
    if (vistaAttiva === 'paziente') return <AreaPaziente utente={utenteCorrente} />;
    if (vistaAttiva === 'medico') return <DashboardMedico utente={utenteCorrente} />;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans selection:bg-slate-200 relative overflow-hidden">
      
      {/* SFONDO DECORATIVO GLOBALE (Ambient Light) */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* NAVBAR GLASSMORPHISM PREMIUM */}
      <nav className="sticky top-0 z-[100] bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-12 h-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:rotate-6 transition-transform duration-300 border border-slate-700">M</div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black tracking-tighter leading-none bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">MedCloud</h1>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Health System</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full border border-slate-100 shadow-sm backdrop-blur-md">
              <div className={`w-2 h-2 rounded-full ${statoBackend.includes('🚨') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{statoBackend}</span>
            </div>

            {/* Profilo Utente Loggato */}
            {utentiLoggati[vistaAttiva] && (
                <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-black text-slate-900 leading-none">{utentiLoggati[vistaAttiva].nome_completo}</p>
                        <p className={`text-[10px] font-bold text-${temaCorrente.colore}-600 uppercase tracking-widest mt-1`}>{vistaAttiva}</p>
                    </div>
                    <button onClick={eseguiLogout} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-[1rem] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-inner" title="Esci">
                        <span className="text-xl">⏻</span>
                    </button>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN LAYOUT */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-10 flex-1 w-full relative z-10">
        
        {/* SIDEBAR DI NAVIGAZIONE */}
        <aside className="w-full lg:w-72 flex flex-col gap-3 shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 ml-4">Seleziona Ruolo</p>
          
          {['paziente', 'medico', 'admin'].map(ruolo => {
            const isAttivo = vistaAttiva === ruolo;
            const config = UX_CONFIG[ruolo];
            
            return (
              <button 
                key={ruolo}
                onClick={() => { setVistaAttiva(ruolo); setEmail(''); setPassword(''); }}
                className={`group flex items-center justify-between p-5 rounded-[1.5rem] font-black text-sm transition-all duration-300 border 
                  ${isAttivo 
                    ? `${config.bgAttivo} text-white shadow-xl shadow-${config.colore}-900/20 border-transparent scale-[1.02]` 
                    : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100 hover:border-slate-200'}`}
              >
                <span className="flex items-center gap-4">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors duration-300 ${isAttivo ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    {config.icona}
                  </span>
                  {ruolo.toUpperCase()}
                </span>
                <span className={`transition-transform duration-300 ${isAttivo ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 text-slate-300'}`}>
                  ➔
                </span>
              </button>
            );
          })}
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {renderizzaContenuto()}
        </main>

      </div>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

export default App