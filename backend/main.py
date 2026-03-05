from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas
from database import engine, SessionLocal, Base
from fastapi.middleware.cors import CORSMiddleware

# Crea le tabelle se non esistono
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedCloud")

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
    return {"messaggio": "MedCloud Online"}

# --- LOGIN ---
@app.post("/api/login", response_model=schemas.LoginResponse, tags=["Autenticazione"])
def login_utente(credenziali: schemas.LoginRequest, db: Session = Depends(get_db)):
    utente = db.query(models.Utente).filter(models.Utente.email == credenziali.email).first()
    
    if not utente or utente.password != credenziali.password:
        raise HTTPException(status_code=401, detail="Email o password errati")

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
    # JOIN fondamentale per mandare i nomi dei pazienti al medico
    risultati = db.query(
        models.Prenotazione, 
        models.Paziente.nome, 
        models.Paziente.cognome,
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
            "tipo_visita": nome_prestazione
        } for p, nome, cognome, nome_prestazione in risultati
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

# --- PAZIENTE: CARTELLA E FATTURE ---

@app.get("/api/pazienti/{id_paziente}/cartella", tags=["Area Paziente"])
def get_cartella_clinica(id_paziente: int, db: Session = Depends(get_db)):
    prenotazioni = db.query(models.Prenotazione).filter(models.Prenotazione.id_paziente == id_paziente).all()
    storico = []
    for p in prenotazioni:
        medico = db.query(models.Medico).filter(models.Medico.id_medico == p.id_medico).first()
        prestazione = db.query(models.Prestazione).filter(models.Prestazione.id_prestazione == p.id_prestazione).first()
        referto = db.query(models.Referto).filter(models.Referto.id_prenotazione == p.id_prenotazione).first()
        storico.append({
            "id_prenotazione": p.id_prenotazione,
            "data": p.data_ora,
            "stato": p.stato,
            "medico": f"Dott. {medico.cognome}" if medico else "",
            "prestazione": prestazione.nome_prestazione if prestazione else "",
            "esito_visita": referto.esito_visita if referto else "In attesa di referto",
            "prescrizioni": referto.prescrizioni if referto else ""
        })
    return storico

@app.get("/api/pazienti/{id_paziente}/fatture", tags=["Area Paziente"])
def get_fatture_paziente(id_paziente: int, db: Session = Depends(get_db)):
    return db.query(models.Fattura).join(models.Prenotazione).filter(models.Prenotazione.id_paziente == id_paziente).all()

# --- ADMIN: FATTURE ---

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

# --- AZIONI: PRENOTAZIONI, REFERTI, REGISTRAZIONE ---

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

@app.post("/api/referti", tags=["Area Medica"]) # Tolto response_model per evitare blocchi
def compila_referto(referto_in: schemas.RefertoCreate, db: Session = Depends(get_db)):
    
    prenotazione = db.query(models.Prenotazione).filter(models.Prenotazione.id_prenotazione == referto_in.id_prenotazione).first()
    if not prenotazione:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata.")
    
    # 🌟 PROTEZIONE: Se arriva null, lo trasformiamo in stringa vuota
    prescrizioni_sicure = referto_in.prescrizioni if referto_in.prescrizioni else "Nessuna terapia prescritta."

    nuovo_referto = models.Referto(
        id_prenotazione=referto_in.id_prenotazione,
        esito_visita=referto_in.esito_visita,
        prescrizioni=prescrizioni_sicure
    )
    db.add(nuovo_referto)
    
    prenotazione.stato = "COMPLETATA"
    
    # 🌟 PROTEZIONE: Se la prestazione non si trova, mettiamo un costo standard
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
    
    nuovo_paziente = models.Paziente(id_utente=nuovo_utente.id_utente, nome=paziente_in.nome, cognome=paziente_in.cognome, codice_fiscale=paziente_in.codice_fiscale)
    db.add(nuovo_paziente)
    db.commit()
    db.refresh(nuovo_paziente)
    return nuovo_paziente

# --- UTILITIES ---

@app.get("/api/medici", tags=["Medici"])
def get_medici(db: Session = Depends(get_db)):
    return db.query(models.Medico).all()

@app.get("/api/prestazioni", tags=["Prestazioni"])
def get_prestazioni(db: Session = Depends(get_db)):
    return db.query(models.Prestazione).all()

@app.patch("/api/fatture/{id_fattura}/paga", tags=["Amministrazione"])
def registra_pagamento(id_fattura: int, db: Session = Depends(get_db)):
    fattura = db.query(models.Fattura).filter(models.Fattura.id_fattura == id_fattura).first()
    if fattura:
        fattura.pagata = True
        db.commit()
    return {"id_fattura": id_fattura}

@app.post("/api/promemoria", tags=["Pazienti"])
def imposta_promemoria(promemoria_in: schemas.PromemoriaCreate, db: Session = Depends(get_db)):
    nuovo = models.Promemoria(id_prenotazione=promemoria_in.id_prenotazione)
    db.add(nuovo)
    db.commit()
    return {"status": "ok"}