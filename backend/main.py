from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas
from database import engine, SessionLocal, Base

# Crea le tabelle se non esistono
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedCloud")

# Funzione per aprire e chiudere la connessione al DB ad ogni richiesta
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
async def root():
    return {"messaggio": "MedCloud Online"}

# --- ROTTA PER REGISTRARE UN PAZIENTE ---
@app.post("/api/pazienti", response_model=schemas.PazienteResponse, tags=["Pazienti"])
def registra_paziente(paziente_in: schemas.PazienteCreate, db: Session = Depends(get_db)):
    
    # 1. Controlliamo se l'email esiste già nel DB
    utente_esistente = db.query(models.Utente).filter(models.Utente.email == paziente_in.email).first()
    if utente_esistente:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # 2. Creiamo l'Utente (Credenziali)
    nuovo_utente = models.Utente(
        email=paziente_in.email,
        password_hash=paziente_in.password, # Nel mondo reale qui si usa un hash!
        ruolo="PAZIENTE"
    )
    db.add(nuovo_utente)
    db.commit()
    db.refresh(nuovo_utente) # Otteniamo l'ID appena generato
    
    # 3. Creiamo il Paziente collegandolo all'Utente
    nuovo_paziente = models.Paziente(
        id_utente=nuovo_utente.id_utente,
        nome=paziente_in.nome,
        cognome=paziente_in.cognome,
        codice_fiscale=paziente_in.codice_fiscale
    )
    db.add(nuovo_paziente)
    db.commit()
    db.refresh(nuovo_paziente)
    
    # 4. Restituiamo i dati di successo
    return nuovo_paziente

# --- ROTTE PER LEGGERE I DATI (Serviranno al Frontend) ---

@app.get("/api/medici", tags=["Medici"])
def get_medici(db: Session = Depends(get_db)):
    return db.query(models.Medico).all()

@app.get("/api/prestazioni", tags=["Prestazioni"])
def get_prestazioni(db: Session = Depends(get_db)):
    return db.query(models.Prestazione).all()


# --- ROTTA PER CREARE UNA PRENOTAZIONE (Corazzata!) ---

@app.post("/api/prenotazioni", response_model=schemas.PrenotazioneResponse, tags=["Prenotazioni"])
def crea_prenotazione(prenotazione_in: schemas.PrenotazioneCreate, db: Session = Depends(get_db)):
    
    # 1. Controllo Data nel passato
    if prenotazione_in.data_ora < datetime.now():
        raise HTTPException(status_code=400, detail="Impossibile prenotare una visita nel passato.")

    # 2. Controllo Esistenza Entità (Paziente, Medico, Prestazione)
    paziente = db.query(models.Paziente).filter(models.Paziente.id_paziente == prenotazione_in.id_paziente).first()
    if not paziente:
        raise HTTPException(status_code=404, detail="Paziente non trovato.")
        
    medico = db.query(models.Medico).filter(models.Medico.id_medico == prenotazione_in.id_medico).first()
    if not medico:
        raise HTTPException(status_code=404, detail="Medico non trovato.")
        
    prestazione = db.query(models.Prestazione).filter(models.Prestazione.id_prestazione == prenotazione_in.id_prestazione).first()
    if not prestazione:
        raise HTTPException(status_code=404, detail="Prestazione non trovata.")

    # 3. Controllo Sovrapposizione Appuntamenti
    medico_occupato = db.query(models.Prenotazione).filter(
        models.Prenotazione.id_medico == prenotazione_in.id_medico,
        models.Prenotazione.data_ora == prenotazione_in.data_ora,
        models.Prenotazione.stato != "ANNULLATA" # Ignoriamo le visite annullate
    ).first()
    
    if medico_occupato:
        raise HTTPException(status_code=409, detail="Il medico selezionato è già occupato in questo orario.")
    
    # 4. Se tutti i controlli passano, salviamo la prenotazione!
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