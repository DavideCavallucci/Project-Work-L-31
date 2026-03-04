from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import models, schemas
from database import engine, SessionLocal, Base

# Crea le tabelle se non esistono
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedCloud")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MedCloud API")

# --- INIZIO BLOCCO CORS ---
# Diciamo al backend di accettare le chiamate che arrivano dal nostro frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # L'indirizzo di Vite/React
    allow_credentials=True,
    allow_methods=["*"], # Permette tutti i metodi (GET, POST, PUT, DELETE)
    allow_headers=["*"], # Permette tutti gli header
)
# --- FINE BLOCCO CORS ---

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

# ==========================================
# ROTTE AVANZATE (LOGIN E STORICO)
# ==========================================

@app.post("/api/login", response_model=schemas.LoginResponse, tags=["Autenticazione"])
def login_utente(credenziali: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Cerchiamo l'utente nel DB
    utente = db.query(models.Utente).filter(models.Utente.email == credenziali.email).first()
    
    # 2. Controlliamo se esiste e se la password combacia
    if not utente or utente.password != credenziali.password:
        raise HTTPException(status_code=401, detail="Email o password errati")

    id_collegato = None
    nome_completo = "Amministratore"

    # 3. Se è un Paziente, peschiamo il suo ID Paziente
    if utente.ruolo == "PAZIENTE":
        paziente = db.query(models.Paziente).filter(models.Paziente.id_utente == utente.id_utente).first()
        if paziente:
            id_collegato = paziente.id_paziente
            nome_completo = f"{paziente.nome} {paziente.cognome}"
            
    # 4. Se è un Medico, peschiamo il suo ID Medico
    elif utente.ruolo == "MEDICO":
        medico = db.query(models.Medico).filter(models.Medico.id_utente == utente.id_utente).first()
        if medico:
            id_collegato = medico.id_medico
            nome_completo = f"Dott. {medico.cognome} {medico.nome}"
            specializzazione = medico.specializzazione

    return {
        "id_utente": utente.id_utente,
        "ruolo": utente.ruolo,
        "id_collegato": id_collegato,
        "nome_completo": nome_completo,
        "specializzazione": specializzazione if utente.ruolo == "MEDICO" else None # <-- Invialo
    }

@app.get("/api/pazienti/{id_paziente}/cartella", tags=["Area Paziente"])
def get_cartella_clinica(id_paziente: int, db: Session = Depends(get_db)):
    # Peschiamo tutte le prenotazioni di questo paziente
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

@app.get("/api/medici/{id_medico}/storico", tags=["Area Medica"])
def get_storico_medico(id_medico: int, db: Session = Depends(get_db)):
    # Peschiamo tutte le visite COMPLETATE da questo medico
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
            "paziente": f"{paziente.nome} {paziente.cognome}" if paziente else "",
            "esito_visita": referto.esito_visita if referto else "",
            "prescrizioni": referto.prescrizioni if referto else ""
        })
    return storico

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
        password=paziente_in.password, # Nel mondo reale qui si usa un hash!
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

# --- ROTTA PER REGISTRARE UN MEDICO ---
@app.post("/api/medici", response_model=schemas.MedicoResponse, tags=["Medici"])
def registra_medico(medico_in: schemas.MedicoCreate, db: Session = Depends(get_db)):
    
    # Controlliamo l'email
    utente_esistente = db.query(models.Utente).filter(models.Utente.email == medico_in.email).first()
    if utente_esistente:
        raise HTTPException(status_code=400, detail="Email già registrata")
    
    # Creiamo le credenziali
    nuovo_utente = models.Utente(
        email=medico_in.email,
        password=medico_in.password, 
        ruolo="MEDICO"
    )
    db.add(nuovo_utente)
    db.commit()
    db.refresh(nuovo_utente)
    
    # Creiamo il profilo del medico
    nuovo_medico = models.Medico(
        id_utente=nuovo_utente.id_utente,
        nome=medico_in.nome,
        cognome=medico_in.cognome,
        specializzazione=medico_in.specializzazione
    )
    db.add(nuovo_medico)
    db.commit()
    db.refresh(nuovo_medico)
    
    return nuovo_medico


# --- ROTTA PER AGGIUNGERE UNA PRESTAZIONE ---
@app.post("/api/prestazioni", response_model=schemas.PrestazioneResponse, tags=["Prestazioni"])
def crea_prestazione(prestazione_in: schemas.PrestazioneCreate, db: Session = Depends(get_db)):
    
    nuova_prestazione = models.Prestazione(
        nome_prestazione=prestazione_in.nome_prestazione,
        costo=prestazione_in.costo
    )
    db.add(nuova_prestazione)
    db.commit()
    db.refresh(nuova_prestazione)
    
    return nuova_prestazione

# --- ROTTA PER IL MEDICO: COMPILARE IL REFERTO E GENERARE FATTURA ---
@app.post("/api/referti", response_model=schemas.RefertoResponse, tags=["Area Medica"])
def compila_referto(referto_in: schemas.RefertoCreate, db: Session = Depends(get_db)):
    
    # 1. Controlliamo che la prenotazione esista
    prenotazione = db.query(models.Prenotazione).filter(models.Prenotazione.id_prenotazione == referto_in.id_prenotazione).first()
    if not prenotazione:
        raise HTTPException(status_code=404, detail="Prenotazione non trovata.")
        
    # 2. Controlliamo che non esista già un referto per questa visita
    referto_esistente = db.query(models.Referto).filter(models.Referto.id_prenotazione == referto_in.id_prenotazione).first()
    if referto_esistente:
        raise HTTPException(status_code=400, detail="Esiste già un referto per questa prenotazione.")

    # 3. Creiamo e salviamo il Referto
    nuovo_referto = models.Referto(
        id_prenotazione=referto_in.id_prenotazione,
        esito_visita=referto_in.esito_visita,
        prescrizioni=referto_in.prescrizioni
    )
    db.add(nuovo_referto)

    # 4. Cambiamo lo stato della prenotazione
    prenotazione.stato = "COMPLETATA"

    # 5. Generiamo la Fattura automaticamente
    # Per farlo, ci serve sapere il costo della prestazione
    prestazione = db.query(models.Prestazione).filter(models.Prestazione.id_prestazione == prenotazione.id_prestazione).first()
    
    nuova_fattura = models.Fattura(
        id_prenotazione=prenotazione.id_prenotazione,
        importo=prestazione.costo,
        pagata=False
    )
    db.add(nuova_fattura)

    # Salviamo tutto il blocco (Transazione unica: se fallisce una cosa, annulla tutto)
    db.commit()
    db.refresh(nuovo_referto)
    
    return nuovo_referto

# --- ROTTE PER LEGGERE I DATI (Serviranno al Frontend) ---

@app.get("/api/medici", tags=["Medici"])
def get_medici(db: Session = Depends(get_db)):
    return db.query(models.Medico).all()

@app.get("/api/prestazioni", tags=["Prestazioni"])
def get_prestazioni(db: Session = Depends(get_db)):
    return db.query(models.Prestazione).all()

# --- ROTTA PER VEDERE TUTTE LE PRENOTAZIONI ---
@app.get("/api/prenotazioni", response_model=list[schemas.PrenotazioneResponse], tags=["Prenotazioni"])
def get_prenotazioni(db: Session = Depends(get_db)):
    return db.query(models.Prenotazione).all()

# --- ROTTA PER VEDERE TUTTI I REFERTI ---
@app.get("/api/referti", response_model=list[schemas.RefertoResponse], tags=["Area Medica"])
def get_referti(db: Session = Depends(get_db)):
    return db.query(models.Referto).all()

@app.get("/api/fatture/dettagliate", tags=["Amministrazione"])
def get_fatture_dettagliate(db: Session = Depends(get_db)):
    # Facciamo una join tra Fattura, Prenotazione e Paziente
    risultati = db.query(
        models.Fattura, 
        models.Paziente.nome, 
        models.Paziente.cognome
    ).join(models.Prenotazione, models.Fattura.id_prenotazione == models.Prenotazione.id_prenotazione)\
     .join(models.Paziente, models.Prenotazione.id_paziente == models.Paziente.id_paziente).all()
    
    return [
        {
            **f.__dict__, 
            "paziente": f"{cognome} {nome}"
        } for f, nome, cognome in risultati
    ]

# --- ROTTA PER VEDERE TUTTI I PAZIENTI (Mancante) ---
@app.get("/api/pazienti", response_model=list[schemas.PazienteResponse], tags=["Pazienti"])
def get_pazienti(db: Session = Depends(get_db)):
    return db.query(models.Paziente).all()

# --- ROTTA PER IL "DOWNLOAD" FATTURA (Simulazione) ---
@app.get("/api/fatture/{id_fattura}/download", tags=["Amministrazione"])
def download_fattura(id_fattura: int, db: Session = Depends(get_db)):
    fattura = db.query(models.Fattura).filter(models.Fattura.id_fattura == id_fattura).first()
    if not fattura:
        raise HTTPException(status_code=404, detail="Fattura non trovata")
    
    # In un'app reale qui useremmo ReportLab o FPDF per generare un file.
    # Per il Project Work, restituiamo i dati pronti per essere impaginati dal frontend.
    return {"messaggio": "Generazione PDF in corso...", "id": id_fattura, "importo": fattura.importo}

@app.patch("/api/fatture/{id_fattura}/paga", tags=["Amministrazione"])
def registra_pagamento(id_fattura: int, db: Session = Depends(get_db)):
    fattura = db.query(models.Fattura).filter(models.Fattura.id_fattura == id_fattura).first()
    if not fattura:
        raise HTTPException(status_code=404, detail="Fattura non trovata")
    
    fattura.pagata = True
    db.commit()
    return {"messaggio": "Pagamento registrato con successo", "id_fattura": id_fattura}

@app.get("/api/pazienti/{id_paziente}/fatture", tags=["Area Paziente"])
def get_fatture_paziente(id_paziente: int, db: Session = Depends(get_db)):
    # Join tra Fattura e Prenotazione per filtrare per paziente
    return db.query(models.Fattura).join(models.Prenotazione).filter(models.Prenotazione.id_paziente == id_paziente).all()

@app.post("/api/promemoria", response_model=schemas.PromemoriaResponse, tags=["Pazienti"])
def imposta_promemoria(promemoria_in: schemas.PromemoriaCreate, db: Session = Depends(get_db)):
    # Controlliamo se esiste già
    esistente = db.query(models.Promemoria).filter(models.Promemoria.id_prenotazione == promemoria_in.id_prenotazione).first()
    if esistente:
        return esistente
    
    nuovo = models.Promemoria(id_prenotazione=promemoria_in.id_prenotazione)
    db.add(nuovo)
    db.commit()
    db.refresh(nuovo)
    return nuovo