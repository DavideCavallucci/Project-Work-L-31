from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import models
import random

# 1. URL DI NEON
NEON_URL = "postgresql://neondb_owner:npg_t3rS2knKMHUw@ep-morning-frost-als7lugh-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("🔄 Connessione a Neon in corso...")
engine = create_engine(NEON_URL)

# 2. PULIZIA PROFONDA (CASCADE)
# Necessaria perché SQLAlchemy drop_all a volte fallisce con le dipendenze esterne (es. promemoria)
print("🧹 Pulizia radicale del database (DROP CASCADE)...")
with engine.connect() as conn:
    tabelle = ["promemoria", "fatture", "referti", "prenotazioni", "prestazioni", "pazienti", "medici", "utenti"]
    for tabella in tabelle:
        conn.execute(text(f"DROP TABLE IF EXISTS {tabella} CASCADE;"))
    conn.commit()
print("✨ Database pronto per la nuova struttura (Laurea Edition).")

# 3. CREAZIONE TABELLE
print("🏗️ Creazione delle tabelle in corso...")
models.Base.metadata.create_all(bind=engine)
print("✅ Tabelle create con successo.")

# 4. POPOLAMENTO DATI
print("🌱 Generazione dati clinici e finanziari...")
with Session(engine) as db:

    # --- 1. PRESTAZIONI (Con Soft Delete) ---
    prestazioni_data = [
        ("Visita Cardiologica", 150), ("Visita Dermatologica", 120),
        ("Visita Ortopedica", 130), ("Visita Oculistica", 100),
        ("Visita Pediatrica", 110), ("Visita Neurologica", 160),
        ("Seduta Psicologica", 90), ("Ecografia Generale", 140)
    ]
    prestazioni = []
    for nome, costo in prestazioni_data:
        p = models.Prestazione(nome_prestazione=nome, costo=costo, is_active=True)
        db.add(p)
        prestazioni.append(p)
    db.flush()

    # --- 2. MEDICI (Con Matricola e Titolo) ---
    medici_info = [
        ("cardiologia@medcloud.it", "Andrea", "Cardi", "Cardiologia"),
        ("dermatologia@medcloud.it", "Giulia", "Derma", "Dermatologia"),
        ("ortopedia@medcloud.it", "Marco", "Orto", "Ortopedia"),
        ("oculistica@medcloud.it", "Elena", "Oculi", "Oculistica"),
        ("pediatria@medcloud.it", "Roberto", "Ped", "Pediatria"),
        ("neurologia@medcloud.it", "Matteo", "Gallo", "Neurologia")
    ]
    medici = []
    for email, nome, cognome, spec in medici_info:
        u = models.Utente(email=email, password="1234", ruolo="MEDICO")
        db.add(u)
        db.flush()
        m = models.Medico(id_utente=u.id_utente, nome=nome, cognome=cognome, specializzazione=spec)
        db.add(m)
        medici.append(m)
    db.flush()

    # --- 3. PAZIENTI (Con Anamnesi Completa) ---
    paz_nomi = ["Mario", "Laura", "Giuseppe", "Anna", "Luigi", "Chiara", "Paolo", "Sofia"]
    paz_cognomi = ["Rossi", "Bianchi", "Verdi", "Gialli", "Neri", "Marrone", "Blu", "Viola"]
    gruppi = ["A+", "0-", "B+", "AB+", "A-"]
    allergie_lista = ["Nessuna", "Graminacee", "Lattosio", "Penicillina", "Nichel", "Glutine"]
    
    pazienti = []
    for i in range(len(paz_nomi)):
        email = f"{paz_nomi[i].lower()}.{paz_cognomi[i].lower()}@email.it"
        u = models.Utente(email=email, password="1234", ruolo="PAZIENTE")
        db.add(u)
        db.flush()
        p = models.Paziente(
            id_utente=u.id_utente, 
            nome=paz_nomi[i], 
            cognome=paz_cognomi[i], 
            codice_fiscale=f"CF{i}XYZ{random.randint(100,999)}",
            data_nascita=date(1980 + i, (i % 12) + 1, 10),
            gruppo_sanguigno=random.choice(gruppi),
            allergie=random.choice(allergie_lista)
        )
        db.add(p)
        pazienti.append(p)
    db.flush()

    # --- 4. CICLO CLINICO (Visite, Referti, Fatture) ---
    now = datetime.now()

    # A) STORICO (12 Visite Passate)
    for i in range(12):
        paz = pazienti[i % len(pazienti)]
        med = medici[i % len(medici)]
        pre = prestazioni[i % len(prestazioni)]
        data_v = now - timedelta(days=i+5)

        pren = models.Prenotazione(id_paziente=paz.id_paziente, id_medico=med.id_medico, id_prestazione=pre.id_prestazione, data_ora=data_v, stato="COMPLETATA")
        db.add(pren)
        db.flush()

        ref = models.Referto(
            id_prenotazione=pren.id_prenotazione,
            esito_visita=f"Referto clinico per {pre.nome_prestazione}. Paziente stabile.",
            prescrizioni="Tachipirina al bisogno" if i % 4 == 0 else "Nessuna prescrizione necessaria."
        )
        db.add(ref)

        fatt = models.Fattura(
            id_prenotazione=pren.id_prenotazione, 
            importo=pre.costo, 
            pagata=(i % 2 == 0), # 50% Pagate, 50% Sospese
            data_emissione=data_v
        )
        db.add(fatt)

    # B) AGENDA (8 Visite Future)
    for i in range(8):
        paz = pazienti[(i+2) % len(pazienti)]
        med = medici[(i+1) % len(medici)]
        pre = prestazioni[i % len(prestazioni)]
        data_f = now + timedelta(days=i+1, hours=i)

        pren = models.Prenotazione(id_paziente=paz.id_paziente, id_medico=med.id_medico, id_prestazione=pre.id_prestazione, data_ora=data_f, stato="PROGRAMMATA")
        db.add(pren)

    db.commit()

print("\n🚀 DATABASE PRONTO E POPOLATO (TESI EDITION) 🚀")
print("---------------------------------------------------")
print("✅ Allergie e Gruppi Sanguigni inseriti per ogni paziente.")
print("✅ Prestazioni attive e medici con matricola registrati.")
print("✅ Fatture sospese generate per test dashboard Admin.")
print("✅ Password universale: 1234")