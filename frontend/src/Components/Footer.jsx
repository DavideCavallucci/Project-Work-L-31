export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 py-20 mt-20 border-t border-slate-800/50 relative overflow-hidden">
      
      {/* EFFETTO GLOW DI SFONDO */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24">
          
          {/* BRAND COLUMN */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3 group cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20">
                M
              </div>
              <span className="text-white font-black text-2xl tracking-tighter">MedCloud</span>
            </div>
            
            <p className="text-sm leading-relaxed text-slate-400 font-medium max-w-sm">
              Semplifichiamo la gestione sanitaria attraverso l'innovazione tecnologica. 
              Garantiamo i più alti standard di sicurezza per i dati sensibili dei pazienti.
            </p>

            {/* BADGES DI CONFORMITÀ */}
            <div className="flex gap-3 pt-2">
                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-[9px] font-black text-slate-500 tracking-widest uppercase">GDPR Compliant</div>
                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-[9px] font-black text-slate-500 tracking-widest uppercase">HL7 Certified</div>
                <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-[9px] font-black text-slate-500 tracking-widest uppercase">SSL Secure</div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Piattaforma</h5>
            <ul className="space-y-4 text-sm font-bold">
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Prenotazioni</li>
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Telemedicina</li>
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Referti Digitali</li>
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">API Docs</li>
            </ul>
          </div>

          {/* LEGAL & SUPPORT */}
          <div className="md:col-span-2 space-y-6">
            <h5 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Supporto</h5>
            <ul className="space-y-4 text-sm font-bold">
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Help Center</li>
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Privacy Policy</li>
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Termini d'uso</li>
              <li className="hover:text-blue-400 hover:translate-x-1 transition-all cursor-pointer inline-block w-full">Audit Log</li>
            </ul>
          </div>

          {/* CONTACT & STATUS */}
          <div className="md:col-span-4 space-y-6">
            <h5 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Contatti Diretti</h5>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-lg">✉️</div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Email Supporto</p>
                        <p className="text-sm font-black text-slate-200">tech@medcloud.it</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-lg">📞</div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Linea d'Emergenza</p>
                        <p className="text-sm font-black text-slate-200">800 123 456</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-20 pt-8 border-t border-slate-900 flex justify-center items-center text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            © {currentYear} MedCloud Health Systems. Built for Excellence.
          </div>
        </div>
      </div>
    </footer>
  );
}