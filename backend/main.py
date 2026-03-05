from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import Response 
from sqlalchemy.orm import Session
from datetime import datetime
import os

import models, schemas
from database import engine, SessionLocal, Base
from fastapi.middleware.cors import CORSMiddleware

# --- IMPORT PER LA GENERAZIONE DEL PDF ---
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from io import BytesIO

# Crea le tabelle se non esistono
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedCloud - Digital Health System")

# --- CONFIGURAZIONE CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Funzione per gestire la connessione al DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"messaggio": "MedCloud Online - Backend Operativo"}

# --- LOGIN ---
@app.post("/api/login", response_model=schemas.LoginResponse, tags=["Autenticazione"])
def login_utente(credenziali: schemas.LoginRequest, db: Session = Depends(get_db)):
    utente = db.query(models.Utente).filter(models.Utente.email == credenziali.email).first()
    
    if not utente or utente.password != credenziali.password:
        raise HTTPException(status_code=401, detail="Email o password errati")

    # Registriamo l'ultimo accesso
    utente.ultimo_accesso = datetime.utcnow()
    db.commit()

    id_collegato = None
    nome_completo = "Amministratore"
    spec = None

    if utente.ruolo == "PAZIENTE":
        paziente = db.query(models.Paziente).filter(models.Paziente.id_utente == utente.id_utente).first()
        if paziente:
            id_collegato = paziente.id_paziente
            nome_completo = f"{paziente.nome} {paziente.cognome}"
            
    elif utente.ruolo == "MEDICO":
        medico = db.query(models.Medico).filter(models.Medico.id_utente == utente.id_utente).first()
        if medico:
            id_collegato = medico.id_medico
            nome_completo = f"Dott. {medico.cognome} {medico.nome}"
            spec = medico.specializzazione

    return {
        "id_utente": utente.id_utente,
        "ruolo": utente.ruolo,
        "id_collegato": id_collegato,
        "nome_completo": nome_completo,
        "specializzazione": spec
    }

# --- MEDICO: AGENDA E STORICO ---
@app.get("/api/prenotazioni", tags=["Prenotazioni"])
def get_prenotazioni(db: Session = Depends(get_db)):
    risultati = db.query(
        models.Prenotazione, 
        models.Paziente.nome, 
        models.Paziente.cognome,
        models.Paziente.gruppo_sanguigno, 
        models.Paziente.allergie,         
        models.Prestazione.nome_prestazione
    ).join(models.Paziente, models.Prenotazione.id_paziente == models.Paziente.id_paziente)\
     .join(models.Prestazione, models.Prenotazione.id_prestazione == models.Prestazione.id_prestazione).all()
    
    return [
        {
            "id_prenotazione": p.id_prenotazione,
            "id_paziente": p.id_paziente,
            "id_medico": p.id_medico,
            "data_ora": p.data_ora,
            "stato": p.stato,
            "paziente_nome": f"{nome} {cognome}",
            "paziente_gruppo_sangue": gruppo_sanguigno, 
            "paziente_allergie": allergie,               
            "tipo_visita": nome_prestazione
        } for p, nome, cognome, gruppo_sanguigno, allergie, nome_prestazione in risultati
    ]

@app.get("/api/medici/{id_medico}/storico", tags=["Area Medica"])
def get_storico_medico(id_medico: int, db: Session = Depends(get_db)):
    prenotazioni = db.query(models.Prenotazione).filter(
        models.Prenotazione.id_medico == id_medico,
        models.Prenotazione.stato == "COMPLETATA"
    ).all()
    
    storico = []
    for p in prenotazioni:
        paziente = db.query(models.Paziente).filter(models.Paziente.id_paziente == p.id_paziente).first()
        referto = db.query(models.Referto).filter(models.Referto.id_prenotazione == p.id_prenotazione).first()
        storico.append({
            "data": p.data_ora,
            "paziente": f"{paziente.nome} {paziente.cognome}" if paziente else "Paziente",
            "esito_visita": referto.esito_visita if referto else "",
            "prescrizioni": referto.prescrizioni if referto else ""
        })
    return storico

# --- PAZIENTE E CARTELLA CLINICA ---
@app.get("/api/pazienti/{id_paziente}/cartella", tags=["Area Paziente"])
def get_cartella_clinica(id_paziente: int, db: Session = Depends(get_db)):
    prenotazioni = db.query(models.Prenotazione).filter(models.Prenotazione.id_paziente == id_paziente).all()
    
    storico = []
    for p in prenotazioni:
        medico = db.query(models.Medico).filter(models.Medico.id_medico == p.id_medico).first()
        prestazione = db.query(models.Prestazione).filter(models.Prestazione.id_prestazione == p.id_prestazione).first()
        referto = db.query(models.Referto).filter(models.Referto.id_prenotazione == p.id_prenotazione).first()
        
        paz = p.paziente 
        
        dati_visita = {
            "id_prenotazione": p.id_prenotazione,
            "data": p.data_ora,
            "stato": p.stato,
            "medico": f"Dott. {medico.cognome}" if medico else "Medico",
            "prestazione": prestazione.nome_prestazione if prestazione else "Visita",
            "esito_visita": referto.esito_visita if referto else "In attesa di referto",
            "prescrizioni": referto.prescrizioni if referto else "",
            "allergie": paz.allergie if paz else "Nessuna",
            "gruppo_sanguigno": paz.gruppo_sanguigno if paz else "N.D.",
            "codice_fiscale": paz.codice_fiscale if paz else "N.A."
        }
        storico.append(dati_visita)
        
    return storico

# --- GESTIONE FATTURE E PDF ---
@app.get("/api/pazienti/{id_paziente}/fatture", tags=["Area Paziente"])
def get_fatture_paziente(id_paziente: int, db: Session = Depends(get_db)):
    return db.query(models.Fattura).join(models.Prenotazione).filter(models.Prenotazione.id_paziente == id_paziente).all()

@app.get("/api/fatture/dettagliate", tags=["Amministrazione"])
def get_fatture_dettagliate(db: Session = Depends(get_db)):
    risultati = db.query(
        models.Fattura, 
        models.Paziente.nome, 
        models.Paziente.cognome
    ).join(models.Prenotazione, models.Fattura.id_prenotazione == models.Prenotazione.id_prenotazione)\
     .join(models.Paziente, models.Prenotazione.id_paziente == models.Paziente.id_paziente).all()
    
    return [
        {
            "id_fattura": f.id_fattura,
            "id_prenotazione": f.id_prenotazione,
            "importo": f.importo,
            "pagata": f.pagata,
            "data_emissione": f.data_emissione,
            "paziente": f"{cognome} {nome}"
        } for f, nome, cognome in risultati
    ]

@app.patch("/api/fatture/{id_fattura}/paga", tags=["Amministrazione"])
def registra_pagamento(id_fattura: int, db: Session = Depends(get_db)):
    fattura = db.query(models.Fattura).filter(models.Fattura.id_fattura == id_fattura).first()
    if fattura:
        fattura.pagata = True
        fattura.data_pagamento = datetime.utcnow()
        db.commit()
    return {"id_fattura": id_fattura}

@app.get("/api/fatture/{id_fattura}/pdf", tags=["Area Paziente"])
def download_fattura_pdf(id_fattura: int, db: Session = Depends(get_db)):
    fattura = db.query(models.Fattura).filter(models.Fattura.id_fattura == id_fattura).first()
    if not fattura:
        raise HTTPException(status_code=404, detail="Fattura non trovata")
    
    if not fattura.pagata:
        raise HTTPException(status_code=403, detail="Azione negata. La fattura deve essere saldata.")
    
    paziente = fattura.prenotazione.paziente
    medico = fattura.prenotazione.medico
    prestazione = fattura.prenotazione.prestazione
    
    font_regular = "Helvetica"
    font_bold = "Helvetica-Bold"
    font_oblique = "Helvetica-Oblique"

    buffer = BytesIO()
    p = canvas.Canvas(buffer)
    
    slate_900 = colors.HexColor("#0f172a")
    slate_500 = colors.HexColor("#64748b")
    slate_100 = colors.HexColor("#f1f5f9")
    emerald_500 = colors.HexColor("#10b981")
    
    # Header
    p.setFillColor(slate_900)
    p.rect(0, 722, 600, 120, fill=1, stroke=0) 
    
    p.setFillColor(colors.white)
    p.setFont(font_bold, 28)
    p.drawString(50, 780, "MedCloud")
    p.setFillColor(colors.HexColor("#94a3b8"))
    p.setFont(font_regular, 10)
    p.drawString(50, 760, "Digital Health System")
    
    p.setFont(font_bold, 10)
    p.setFillColor(colors.white)
    p.drawRightString(545, 780, "MedCloud Health S.p.A.")
    p.setFont(font_regular, 9)
    p.setFillColor(colors.HexColor("#94a3b8"))
    p.drawRightString(545, 765, "Via Roma 1, Milano (MI)")
    p.drawRightString(545, 750, "P.IVA: IT 12345678901")

    # Titolo
    p.setFillColor(slate_900)
    p.setFont(font_bold, 24)
    p.drawString(50, 660, "Fattura Elettronica")
    p.setFillColor(slate_500)
    p.setFont(font_regular, 12)
    p.drawString(50, 640, f"Documento N° {str(fattura.id_fattura).zfill(5)} — Emesso il {fattura.data_emissione.strftime('%d/%m/%Y')}")

    # Intestatario
    p.setFillColor(slate_100)
    p.setStrokeColor(slate_100)
    p.roundRect(50, 500, 250, 110, radius=10, fill=1, stroke=1)
    
    p.setFillColor(slate_500)
    p.setFont(font_bold, 9)
    p.drawString(70, 580, "FATTURATO A:")
    p.setFillColor(slate_900)
    p.setFont(font_bold, 14)
    p.drawString(70, 560, f"{paziente.nome} {paziente.cognome}")
    p.setFont(font_regular, 11)
    p.setFillColor(slate_500)
    p.drawString(70, 540, f"C.F.: {paziente.codice_fiscale.upper()}")
    
    # Tabella
    p.setFillColor(slate_900)
    p.roundRect(50, 440, 495, 30, radius=5, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont(font_bold, 10)
    p.drawString(65, 450, "DESCRIZIONE PRESTAZIONE")
    p.drawRightString(530, 450, "IMPORTO")

    p.setFillColor(slate_900)
    p.setFont(font_bold, 11)
    p.drawString(65, 410, prestazione.nome_prestazione.upper())
    p.setFont(font_regular, 10)
    p.setFillColor(slate_500)
    p.drawString(65, 395, f"Specialista: Dott. {medico.cognome} - Data: {fattura.prenotazione.data_ora.strftime('%d/%m/%Y')}")
    
    p.setFont(font_bold, 12)
    p.setFillColor(slate_900)
    p.drawRightString(530, 410, f"€ {fattura.importo}.00")
    
    p.setStrokeColor(slate_100)
    p.setLineWidth(2)
    p.line(50, 370, 545, 370)

    # Totale
    p.setFont(font_bold, 18)
    p.setFillColor(slate_900)
    p.drawString(380, 330, "TOTALE:")
    p.setFont(font_bold, 24)
    p.drawRightString(530, 328, f"€ {fattura.importo}.00")

    # Badge
    p.setFillColor(colors.HexColor("#ecfdf5"))
    p.setStrokeColor(emerald_500)
    p.roundRect(50, 315, 200, 40, radius=8, fill=1, stroke=1)
    p.setFillColor(emerald_500)
    p.setFont(font_bold, 12)
    p.drawString(65, 335, "✓ PAGAMENTO SALDATO")

    # Footer
    p.setStrokeColor(slate_100)
    p.line(50, 100, 545, 100)
    p.setFillColor(slate_500)
    p.setFont(font_bold, 8)
    p.drawCentredString(297, 80, "MEDCLOUD HEALTH SYSTEMS — Documento Informatico Generato Elettronicamente")

    p.showPage()
    p.save()
    
    buffer.seek(0)
    return Response(content=buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=Fattura_MedCloud_{str(id_fattura).zfill(5)}.pdf"})

# --- AZIONI E REGISTRAZIONI ---
@app.post("/api/prenotazioni", response_model=schemas.PrenotazioneResponse, tags=["Prenotazioni"])
def crea_prenotazione(prenotazione_in: schemas.PrenotazioneCreate, db: Session = Depends(get_db)):
    nuova_prenotazione = models.Prenotazione(
        id_paziente=prenotazione_in.id_paziente,
        id_medico=prenotazione_in.id_medico,
        id_prestazione=prenotazione_in.id_prestazione,
        data_ora=prenotazione_in.data_ora,
        stato="PROGRAMMATA"
    )
    db.add(nuova_prenotazione)
    db.commit()
    db.refresh(nuova_prenotazione)
    return nuova_prenotazione

@app.post("/api/referti", tags=["Area Medica"])
def compila_referto(referto_in: schemas.RefertoCreate, db: Session = Depends(get_db)):
    prenotazione = db.query(models.Prenotazione).filter(models.Prenotazione.id_prenotazione == referto_in.id_prenotazione).first()
    if not prenotazione:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata.")
    
    prescrizioni_sicure = referto_in.prescrizioni if referto_in.prescrizioni else "Nessuna terapia prescritta."

    nuovo_referto = models.Referto(
        id_prenotazione=referto_in.id_prenotazione,
        esito_visita=referto_in.esito_visita,
        prescrizioni=prescrizioni_sicure
    )
    db.add(nuovo_referto)
    
    prenotazione.stato = "COMPLETATA"
    
    prestazione = db.query(models.Prestazione).filter(models.Prestazione.id_prestazione == prenotazione.id_prestazione).first()
    costo_fattura = prestazione.costo if prestazione else 50 
    
    nuova_fattura = models.Fattura(
        id_prenotazione=prenotazione.id_prenotazione,
        importo=costo_fattura,
        pagata=False
    )
    db.add(nuova_fattura)
    db.commit()
    db.refresh(nuovo_referto)
    
    return {"messaggio": "Referto salvato e fattura generata", "id_referto": nuovo_referto.id_referto}

@app.post("/api/pazienti", response_model=schemas.PazienteResponse, tags=["Pazienti"])
def registra_paziente(paziente_in: schemas.PazienteCreate, db: Session = Depends(get_db)):
    nuovo_utente = models.Utente(email=paziente_in.email, password=paziente_in.password, ruolo="PAZIENTE")
    db.add(nuovo_utente)
    db.commit()
    db.refresh(nuovo_utente)
    
    nuovo_paziente = models.Paziente(
        id_utente=nuovo_utente.id_utente, 
        nome=paziente_in.nome, 
        cognome=paziente_in.cognome, 
        codice_fiscale=paziente_in.codice_fiscale,
        gruppo_sanguigno=paziente_in.gruppo_sanguigno,
        allergie=paziente_in.allergie,
        patologie_pregresse=paziente_in.patologie_pregresse
    )
    db.add(nuovo_paziente)
    db.commit()
    db.refresh(nuovo_paziente)
    return nuovo_paziente

# --- LISTINO PRESTAZIONI E MEDICI ---
@app.get("/api/medici", tags=["Medici"])
def get_medici(db: Session = Depends(get_db)):
    return db.query(models.Medico).all()

@app.get("/api/prestazioni", tags=["Prestazioni"])
def get_prestazioni(admin: bool = False, db: Session = Depends(get_db)):
    if admin:
        return db.query(models.Prestazione).order_by(models.Prestazione.id_prestazione.desc()).all()
    else:
        return db.query(models.Prestazione).filter(models.Prestazione.is_active == True).all()

@app.post("/api/prestazioni", response_model=schemas.PrestazioneResponse, tags=["Amministrazione"])
def crea_prestazione(prestazione_in: schemas.PrestazioneCreate, db: Session = Depends(get_db)):
    nuova_prestazione = models.Prestazione(
        nome_prestazione=prestazione_in.nome_prestazione,
        costo=prestazione_in.costo,
        is_active=True
    )
    db.add(nuova_prestazione)
    db.commit()
    db.refresh(nuova_prestazione)
    return nuova_prestazione

@app.patch("/api/prestazioni/{id_prestazione}/toggle", tags=["Amministrazione"])
def toggle_prestazione(id_prestazione: int, db: Session = Depends(get_db)):
    prestazione = db.query(models.Prestazione).filter(models.Prestazione.id_prestazione == id_prestazione).first()
    if not prestazione:
        raise HTTPException(status_code=404, detail="Prestazione non trovata")
    
    prestazione.is_active = not prestazione.is_active
    db.commit()
    return {"messaggio": "Stato aggiornato", "id_prestazione": prestazione.id_prestazione, "is_active": prestazione.is_active}