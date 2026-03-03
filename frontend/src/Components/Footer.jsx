export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand & Mission */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="text-white font-black text-xl tracking-tighter">MedCloud</span>
          </div>
          <p className="text-sm leading-relaxed">
            La piattaforma leader nella gestione sanitaria digitale. Sicurezza, velocità e cura del paziente al centro di ogni riga di codice.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Servizi</h5>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-blue-400 cursor-pointer transition">Prenotazioni Online</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Telemedicina</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Cartella Clinica Digitale</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Gestione Referti</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Supporto</h5>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-blue-400 cursor-pointer transition">Centro Assistenza</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Privacy Policy</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Termini di Servizio</li>
            <li className="hover:text-blue-400 cursor-pointer transition">Accessibilità</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h5 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Contatti</h5>
          <p className="text-sm mb-2 font-medium text-slate-300">Supporto Tecnico 24/7</p>
          <p className="text-sm">support@medcloud.com</p>
          <p className="text-sm mt-4">P.IVA 12345678901</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12 pt-8 border-t border-slate-800 text-center text-xs font-medium uppercase tracking-[0.2em]">
        © 2026 MedCloud Health Systems. All Rights Reserved.
      </div>
    </footer>
  );
}