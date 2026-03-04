from sqlalchemy import create_engine
from sqlalchemy.orm import Session
import models

# 1. INCOLLA QUI IL TUO URL DI NEON
NEON_URL = "postgresql://neondb_owner:npg_t3rS2knKMHUw@ep-morning-frost-als7lugh-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("🔄 Connessione a Neon in corso...")
engine = create_engine(NEON_URL)

print("🧹 Pulizia del database (Eliminazione vecchie tabelle)...")
models.Base.metadata.drop_all(bind=engine)

print("🏗️ Creazione delle tabelle pulite...")
models.Base.metadata.create_all(bind=engine)
print("✅ Struttura tabelle perfettamente allineata!")

print("👤 Inserimento dei dati di prova...")
with Session(engine) as db:
    # --- 1. CREAZIONE ADMIN ---
    admin = models.Utente(
        email="admin@medcloud.it",
        password="password123", 
        ruolo="ADMIN"
    )
    db.add(admin)

    # --- 2. CREAZIONE MEDICO ---
    utente_medico = models.Utente(
        email="medico@medcloud.it",
        password="password123", 
        ruolo="MEDICO"
    )
    db.add(utente_medico)
    db.commit() # Salviamo per fargli generare l'id_utente

    medico = models.Medico(
        id_utente=utente_medico.id_utente,
        nome="Gregory",
        cognome="House",
        specializzazione="Diagnostica"
    )
    db.add(medico)

    # --- 3. CREAZIONE PAZIENTE ---
    utente_paziente = models.Utente(
        email="paziente@medcloud.it",
        password="password123", 
        ruolo="PAZIENTE"
    )
    db.add(utente_paziente)
    db.commit()

    paziente = models.Paziente(
        id_utente=utente_paziente.id_utente,
        nome="Mario",
        cognome="Rossi",
        codice_fiscale="RSSMRA80A01H501Z"
    )
    db.add(paziente)

    # --- 4. CREAZIONE PRESTAZIONE ---
    prestazione = models.Prestazione(
        nome_prestazione="Visita Specialistica Avanzata",
        costo=150
    )
    db.add(prestazione)

    db.commit()
    print("✅ Dati caricati! Hai un Admin, un Medico, un Paziente e una Prestazione pronti.")

print("🚀 Database Cloud configurato con successo! Il sistema è ONLINE.")