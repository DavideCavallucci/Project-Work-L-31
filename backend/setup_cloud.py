from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
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

print("🌱 Generazione massiva dei dati ospedalieri in corso...")
with Session(engine) as db:

    # --- 1. PRESTAZIONI ---
    prestazioni_data = [
        ("Visita Cardiologica", 150),
        ("Visita Dermatologica", 120),
        ("Visita Ortopedica", 130),
        ("Visita Oculistica", 100),
        ("Visita Pediatrica", 110),
        ("Visita Neurologica", 160),
        ("Seduta Psicologica", 90),
        ("Ecografia Generale", 140)
    ]
    prestazioni = []
    for nome, costo in prestazioni_data:
        p = models.Prestazione(nome_prestazione=nome, costo=costo)
        db.add(p)
        prestazioni.append(p)
    
    db.commit() # Salviamo per generare gli ID

    # --- 2. MEDICI ---
    medici_data = [
        ("cardiologia@medcloud.it", "Andrea", "Cardi", "Cardiologia"),
        ("dermatologia@medcloud.it", "Giulia", "Derma", "Dermatologia"),
        ("ortopedia@medcloud.it", "Marco", "Orto", "Ortopedia"),
        ("oculistica@medcloud.it", "Elena", "Oculi", "Oculistica"),
        ("pediatria@medcloud.it", "Roberto", "Ped", "Pediatria")
    ]
    medici = []
    for email, nome, cognome, spec in medici_data:
        u = models.Utente(email=email, password="1234", ruolo="MEDICO")
        db.add(u)
        db.flush() # flush() assegna l'ID senza chiudere la transazione
        m = models.Medico(id_utente=u.id_utente, nome=nome, cognome=cognome, specializzazione=spec)
        db.add(m)
        medici.append(m)
    
    db.commit()

    # --- 3. PAZIENTI ---
    pazienti_data = [
        ("mario.rossi@email.it", "Mario", "Rossi", "RSSMRA80A01H501Z"),
        ("laura.bianchi@email.it", "Laura", "Bianchi", "BNCLRA85B41H501Y"),
        ("giuseppe.verdi@email.it", "Giuseppe", "Verdi", "VRDGPP90C01H501X"),
        ("anna.gialli@email.it", "Anna", "Gialli", "GLLNNA95D41H501W"),
        ("luigi.neri@email.it", "Luigi", "Neri", "NRILGI70E01H501V"),
        ("chiara.marrone@email.it", "Chiara", "Marrone", "MRRCHR88F41H501U"),
        ("paolo.blu@email.it", "Paolo", "Blu", "BLUPLA82G01H501T"),
        ("sofia.viola@email.it", "Sofia", "Viola", "VLSSFA91H41H501S")
    ]
    pazienti = []
    for email, nome, cognome, cf in pazienti_data:
        u = models.Utente(email=email, password="1234", ruolo="PAZIENTE")
        db.add(u)
        db.flush()
        p = models.Paziente(id_utente=u.id_utente, nome=nome, cognome=cognome, codice_fiscale=cf)
        db.add(p)
        pazienti.append(p)
    
    db.commit()

    # --- 4. PRENOTAZIONI, REFERTI E FATTURE ---
    now = datetime.now()

    # A) Storico: Visite passate (COMPLETATE)
    for i in range(10): 
        paziente = pazienti[i % len(pazienti)]
        medico = medici[i % len(medici)]
        prestazione = prestazioni[i % len(prestazioni)]
        # Scaliamo le date all'indietro
        data_visita = now - timedelta(days=i+1, hours=i)

        pren = models.Prenotazione(
            id_paziente=paziente.id_paziente,
            id_medico=medico.id_medico,
            id_prestazione=prestazione.id_prestazione,
            data_ora=data_visita,
            stato="COMPLETATA"
        )
        db.add(pren)
        db.flush()

        # Generiamo il Referto
        ref = models.Referto(
            id_prenotazione=pren.id_prenotazione,
            esito_visita=f"Paziente in buone condizioni cliniche. L'esame obiettivo per {prestazione.nome_prestazione} non ha evidenziato anomalie di rilievo.",
            prescrizioni="Riposo e idratazione." if i % 2 == 0 else "Nessuna terapia farmacologica prescritta."
        )
        db.add(ref)

        # Generiamo la Fattura (Alcune le lasciamo da pagare per i test dell'Admin)
        fatt = models.Fattura(
            id_prenotazione=pren.id_prenotazione,
            importo=prestazione.costo,
            pagata=(i % 3 != 0), # Circa il 66% saranno pagate, il 33% in pendenza
            data_emissione=data_visita + timedelta(minutes=30) # Emessa 30 min dopo la visita
        )
        db.add(fatt)

    # B) Futuro: Visite in programma (PROGRAMMATE)
    for i in range(8): 
        # Mescoliamo un po' gli indici per non avere sempre le stesse coppie
        paziente = pazienti[(i+3) % len(pazienti)]
        medico = medici[(i+2) % len(medici)]
        prestazione = prestazioni[(i+1) % len(prestazioni)]
        data_visita = now + timedelta(days=i+1, hours=2)

        pren = models.Prenotazione(
            id_paziente=paziente.id_paziente,
            id_medico=medico.id_medico,
            id_prestazione=prestazione.id_prestazione,
            data_ora=data_visita,
            stato="PROGRAMMATA"
        )
        db.add(pren)

    db.commit()

print("✅ Operazione conclusa! 🏥")
print("Utenti per testare l'app (Password per tutti: 1234):")
print("- Paziente: mario.rossi@email.it")
print("- Paziente: laura.bianchi@email.it")
print("- Medico: cardiologia@medcloud.it")
print("- Medico: ortopedia@medcloud.it")
print("- Admin: (Basta cliccare sulla tab Admin!)")
print("🚀 Il sistema MedCloud è ONLINE e completamente popolato.")