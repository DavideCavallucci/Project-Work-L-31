import { useState, useEffect } from 'react'
import AreaPaziente from './Components/AreaPaziente'
import DashboardMedico from './Components/DashboardMedico'
import DashboardAdmin from './Components/DashboardAdmin'
import Footer from './Components/Footer'

// 🎨 CONFIGURAZIONE ELITE UX
const UX_CONFIG = {
  paziente: {
    colore: 'blue',
    bgAttivo: 'bg-blue-600',
    textGradient: 'from-blue-600 via-blue-500 to-cyan-400',
    mesh: 'bg-blue-400/20',
    icona: '👤',
    titolo: 'Health Connect',
    desc: 'Gestisci la tua salute con un click.',
    caratteristica: 'Accesso istantaneo ai referti'
  },
  medico: {
    colore: 'teal',
    bgAttivo: 'bg-teal-600',
    textGradient: 'from-teal-600 via-emerald-500 to-teal-400',
    mesh: 'bg-teal-400/20',
    icona: '🩺',
    titolo: 'Clinical Suite',
    desc: 'L’eccellenza medica digitale.',
    caratteristica: 'Refertazione smart in cloud'
  },
  admin: {
    colore: 'indigo',
    bgAttivo: 'bg-indigo-600',
    textGradient: 'from-indigo-600 via-purple-500 to-indigo-400',
    mesh: 'bg-indigo-400/20',
    icona: '📊',
    titolo: 'Management OS',
    desc: 'Il cuore pulsante della struttura.',
    caratteristica: 'Analisi finanziaria real-time'
  }
};

function App() {
  const apiUrl = "https://project-work-l-31.onrender.com";
  const [statoBackend, setStatoBackend] = useState("Sincronizzazione...")
  const [vistaAttiva, setVistaAttiva] = useState('paziente')
  const [utentiLoggati, setUtentiLoggati] = useState({ paziente: null, medico: null, admin: null })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const tema = UX_CONFIG[vistaAttiva];

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
      if (!res.ok) throw new Error("Credenziali non valide.");
      const dati = await res.json();
      if (dati.ruolo.toLowerCase() !== vistaAttiva) {
        alert(`Usa l'accesso dedicato ai ${dati.ruolo}!`);
        return;
      }
      setUtentiLoggati(prev => ({ ...prev, [vistaAttiva]: dati }));
      setEmail(''); setPassword('');
    } catch (err) { alert(err.message); } finally { setIsLoggingIn(false); }
  };

  // 🌟 ECCO IL PEZZO CHE AVEVO PERSO! 🌟
  const eseguiLogout = () => {
    setUtentiLoggati(prev => ({ ...prev, [vistaAttiva]: null }));
  };

  const renderizzaContenuto = () => {
    const utenteCorrente = utentiLoggati[vistaAttiva];

    if (!utenteCorrente && vistaAttiva !== 'admin') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          
          {/* LATO SINISTRO: BRANDING DINAMICO */}
          <div className="hidden lg:block space-y-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tema.mesh} backdrop-blur-md border border-white/20`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tema.bgAttivo}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${tema.bgAttivo}`}></span>
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest text-${tema.colore}-700`}>{tema.caratteristica}</span>
            </div>
            
            <h2 className={`text-7xl font-black tracking-tighter leading-[0.9] bg-gradient-to-br ${tema.textGradient} bg-clip-text text-transparent`}>
              {tema.titolo}
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-md leading-relaxed">
              {tema.desc} Accedi alla piattaforma sanitaria più avanzata del settore.
            </p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm hover:scale-105 transition-transform">
                <p className="text-2xl mb-2">⚡</p>
                <p className="text-xs font-black text-slate-800 uppercase">Velocità</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">Zero attese, dati pronti.</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm hover:scale-105 transition-transform">
                <p className="text-2xl mb-2">🛡️</p>
                <p className="text-xs font-black text-slate-800 uppercase">Sicurezza</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter">Criptazione end-to-end.</p>
              </div>
            </div>
          </div>

          {/* LATO DESTRO: FORM LOGIN */}
          <div className="bg-white/80 backdrop-blur-2xl p-10 md:p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-white relative">
            <div className="lg:hidden text-center mb-10">
               <h3 className={`text-4xl font-black bg-gradient-to-r ${tema.textGradient} bg-clip-text text-transparent`}>{tema.titolo}</h3>
            </div>
            
            <form onSubmit={eseguiLogin} className="space-y-6">
              <div className="group space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-slate-900">Email Aziendale</label>
                <input 
                  type="email" placeholder="nome@esempio.it" required 
                  className={`w-full bg-white border border-slate-100 p-5 rounded-[1.8rem] focus:ring-4 focus:ring-${tema.colore}-500/10 focus:border-${tema.colore}-500 outline-none font-medium transition-all shadow-sm`}
                  value={email} onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div className="group space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-slate-900">Password</label>
                <input 
                  type="password" placeholder="••••••••" required 
                  className={`w-full bg-white border border-slate-100 p-5 rounded-[1.8rem] focus:ring-4 focus:ring-${tema.colore}-500/10 focus:border-${tema.colore}-500 outline-none font-medium transition-all shadow-sm`}
                  value={password} onChange={e => setPassword(e.target.value)} 
                />
              </div>
              
              <button 
                type="submit" disabled={isLoggingIn}
                className={`w-full ${tema.bgAttivo} text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl shadow-${tema.colore}-900/20 hover:scale-[1.02] active:scale-95 transition-all duration-500 disabled:opacity-50 flex justify-center items-center gap-4`}
              >
                {isLoggingIn ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : "ENTRA NEL SISTEMA"}
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (vistaAttiva === 'admin') return <DashboardAdmin />;
    if (vistaAttiva === 'paziente') return <AreaPaziente utente={utenteCorrente} />;
    if (vistaAttiva === 'medico') return <DashboardMedico utente={utenteCorrente} />;
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      
      {/* MESH GRADIENT DYNAMICS */}
      <div className={`fixed top-0 left-0 w-full h-full transition-colors duration-1000 -z-10 ${tema.mesh}`}></div>
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/50 blur-[150px] rounded-full -z-10"></div>

      {/* NAV ELITE */}
      <nav className="sticky top-0 z-[100] bg-white/40 backdrop-blur-3xl border-b border-white/50 px-8 py-6">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl group-hover:rotate-12 transition-transform duration-500">M</div>
            <h1 className="text-3xl font-black tracking-tighter leading-none text-slate-900">MedCloud</h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-3 px-6 py-2.5 bg-white/60 rounded-full border border-white shadow-sm">
              <span className={`w-2 h-2 rounded-full ${statoBackend.includes('🚨') ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{statoBackend}</span>
            </div>

            {utentiLoggati[vistaAttiva] && (
                <div className="flex items-center gap-5 pl-8 border-l border-slate-200">
                    <div className="text-right hidden sm:block leading-none">
                        <p className="text-sm font-black text-slate-900">{utentiLoggati[vistaAttiva].nome_completo}</p>
                        <p className={`text-[9px] font-black text-${tema.colore}-600 uppercase mt-1 tracking-widest`}>{vistaAttiva}</p>
                    </div>
                    <button onClick={eseguiLogout} className="w-12 h-12 bg-white text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-900/5 font-bold">✕</button>
                </div>
            )}
          </div>
        </div>
      </nav>

      {/* LAYOUT PRINCIPALE */}
      <div className="max-w-[1400px] mx-auto px-8 py-16 flex flex-col lg:flex-row gap-16 flex-1 w-full">
        
        {/* SIDEBAR BENTO STYLE */}
        <aside className="w-full lg:w-80 space-y-4 shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 ml-4">Terminal Access</p>
          
          {['paziente', 'medico', 'admin'].map(ruolo => {
            const act = vistaAttiva === ruolo;
            const c = UX_CONFIG[ruolo];
            return (
              <button 
                key={ruolo}
                onClick={() => { setVistaAttiva(ruolo); setEmail(''); setPassword(''); }}
                className={`w-full group p-6 rounded-[2.5rem] transition-all duration-500 border-2 flex flex-col gap-4 text-left
                  ${act ? `bg-white border-${c.colore}-500 shadow-2xl shadow-${c.colore}-900/10 scale-[1.05]` 
                        : 'bg-white/40 border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-white hover:border-white'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-colors duration-500 ${act ? c.bgAttivo + ' text-white' : 'bg-slate-100'}`}>
                  {c.icona}
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest transition-colors ${act ? 'text-' + c.colore + '-600' : 'text-slate-400'}`}>{ruolo}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 line-clamp-1">{c.desc}</p>
                </div>
              </button>
            );
          })}
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