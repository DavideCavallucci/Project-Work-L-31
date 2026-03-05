from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import models
import random

# 1. URL DI NEON
NEON_URL = "postgresql://neondb_owner:npg_t3rS2knKMHUw@ep-morning-frost-als7lugh-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("Inizializzazione MedCloud Data Seeder...")
engine = create_engine(NEON_URL)

# 2. PULIZIA PROFONDA DEL DB
print("Esecuzione Drop Cascade per pulizia DB...")
with engine.connect() as conn:
    tabelle = ["fatture", "referti", "prenotazioni", "prestazioni", "pazienti", "medici", "utenti"]
    for tabella in tabelle:
        conn.execute(text(f"DROP TABLE IF EXISTS {tabella} CASCADE;"))
    conn.commit()
print("Database pulito e pronto per i nuovi dati.")

# 3. CREAZIONE TABELLE
print("Ricostruzione Architettura Relazionale...")
models.Base.metadata.create_all(bind=engine)
print("Tabelle create con successo.")

# 4. POPOLAMENTO DATI
print("Iniezione dati clinici e finanziari...")
with Session(engine) as db:

    # --- PRESTAZIONI ---
    prestazioni_data = [
        ("Visita Cardiologica Completa", 150, True), 
        ("Mappatura Nei Dermatologica", 120, True),
        ("Visita Ortopedica Ginocchio", 130, True), 
        ("Controllo Visivo Oculistico", 100, True),
        ("Bilancio di Salute Pediatrico", 110, True), 
        ("Esame Neurologico", 160, True),
        ("Seduta Psicoterapia (45min)", 90, True), 
        ("Ecografia Addome Completo", 140, True),
        ("Certificato Medico Sportivo", 50, True),
        ("Tampone Rapido COVID-19", 25, False),
        ("Terapia Infiltrativa Ortopedica", 80, False)
    ]
    prestazioni = []
    for nome, costo, active in prestazioni_data:
        p = models.Prestazione(nome_prestazione=nome, costo=costo, is_active=active)
        db.add(p)
        prestazioni.append(p)
    db.flush()

    # --- MEDICI ---
    medici_info = [
        ("cardiologia@medcloud.it", "Andrea", "Cardi", "Cardiologia"),
        ("dermatologia@medcloud.it", "Giulia", "Derma", "Dermatologia"),
        ("ortopedia@medcloud.it", "Marco", "Orto", "Ortopedia"),
        ("oculistica@medcloud.it", "Elena", "Oculi", "Oculistica"),
        ("pediatria@medcloud.it", "Roberto", "Bimbi", "Pediatria"),
        ("neurologia@medcloud.it", "Matteo", "Gallo", "Neurologia"),
        ("psicologia@medcloud.it", "Sofia", "Mente", "Psicoterapia")
    ]
    medici = []
    for email, nome, cognome, spec in medici_info:
        u = models.Utente(email=email, password="1234", ruolo="MEDICO", ultimo_accesso=datetime.now() - timedelta(days=random.randint(0, 3)))
        db.add(u)
        db.flush()
        m = models.Medico(id_utente=u.id_utente, nome=nome, cognome=cognome, specializzazione=spec)
        db.add(m)
        medici.append(m)
    db.flush()

    # --- PAZIENTI ---
    pazienti_dati = [
        ("Mario", "Rossi", "M", "A+", "Nessuna", "Ipertensione lieve, sotto controllo farmacologico."),
        ("Laura", "Bianchi", "F", "0-", "Lattosio, Nichel", "Nessuna patologia pregressa di rilievo."),
        ("Giuseppe", "Verdi", "M", "B+", "Penicillina", "Diabete Mellito Tipo 2. Frattura femore nel 2018."),
        ("Anna", "Gialli", "F", "AB+", "Graminacee, Acari", "Asma bronchiale cronica."),
        ("Luigi", "Neri", "M", "A-", "Nessuna", "Paziente in salute, esegue controlli di routine."),
        ("Chiara", "Marrone", "F", "0+", "Glutine (Celiachia)", "Tiroidite di Hashimoto."),
        ("Paolo", "Blu", "M", "B-", "Punture di vespa", "Pregresso intervento menisco destro (2021)."),
        ("Sofia", "Viola", "F", "A+", "Nessuna", "Gravidanza al quinto mese."),
        ("Alessandro", "Gallo", "M", "0+", "Noccioline", "Sospetta sindrome da tunnel carpale."),
        ("Martina", "Ferri", "F", "AB-", "FANS", "Soggetto emicranico. Frequenti episodi di aura."),
        ("Davide", "Cavallucci", "M", "0-", "Nessuna", "Soggetto sano. Sviluppatore Web sotto stress."),
        ("Beatrice", "Costa", "F", "A+", "Polline", "Lieve scoliosi diagnosticata in età infantile.")
    ]
    
    pazienti = []
    for i, (nome, cognome, sesso, sangue, allergie, patologie) in enumerate(pazienti_dati):
        email = f"{nome.lower()}.{cognome.lower()}@email.it"
        u = models.Utente(email=email, password="1234", ruolo="PAZIENTE", ultimo_accesso=datetime.now() - timedelta(days=random.randint(0, 10)))
        db.add(u)
        db.flush()
        
        # Generazione Codice Fiscale verosimile
        cf_base = f"{cognome[:3].upper()}{nome[:3].upper()}{80+i}M{10+i}H501Z"
        
        p = models.Paziente(
            id_utente=u.id_utente, 
            nome=nome, 
            cognome=cognome, 
            codice_fiscale=cf_base[:16],
            data_nascita=date(1980 + i, (i % 12) + 1, random.randint(1, 28)),
            gruppo_sanguigno=sangue,
            allergie=allergie,
            patologie_pregresse=patologie,
            telefono=f"3{random.randint(100000000, 999999999)}"
        )
        db.add(p)
        pazienti.append(p)
    db.flush()

    # --- 4. CICLO CLINICO ---
    now = datetime.now()

    # A) STORICO (30 Visite Passate COMPLETATE con Referti e Fatture)
    referti_esempi = [
        ("Paziente in ottime condizioni generali. Non si rilevano anomalie.", "Nessuna prescrizione."),
        ("Riscontrata lieve irregolarità del battito sotto sforzo. Si consiglia Holter 24h.", "Bisoprololo 1.25mg / die."),
        ("Quadro clinico compatibile con dermatite da contatto. Evitare agenti irritanti.", "Crema al cortisone 2 volte al giorno per 7gg."),
        ("Mobilità articolare ridotta del 20%. Assenza di versamento intra-articolare.", "Ciclo di 10 sedute di fisioterapia."),
        ("Visus 10/10 in OO con correzione in uso. Pressione intraoculare nella norma.", "Collirio lubrificante al bisogno.")
    ]

    for i in range(30):
        paz = random.choice(pazienti)
        med = random.choice(medici)
        # Scegliamo solo prestazioni attive per le visite passate normali
        pre = random.choice([p for p in prestazioni if p.is_active])
        data_v = now - timedelta(days=random.randint(1, 180), hours=random.randint(9, 17))

        pren = models.Prenotazione(id_paziente=paz.id_paziente, id_medico=med.id_medico, id_prestazione=pre.id_prestazione, data_ora=data_v, stato="COMPLETATA")
        db.add(pren)
        db.flush()

        esito, prescrizione = random.choice(referti_esempi)
        ref = models.Referto(
            id_prenotazione=pren.id_prenotazione,
            esito_visita=f"Referto ufficiale MedCloud: {esito}",
            prescrizioni=prescrizione
        )
        db.add(ref)

        # 70% di probabilità che la fattura sia pagata. Il 30% crea le Prestazioni da pagare per l'Admin
        is_pagata = random.random() > 0.3 
        fatt = models.Fattura(
            id_prenotazione=pren.id_prenotazione, 
            importo=pre.costo, 
            pagata=is_pagata,
            data_emissione=data_v,
            data_pagamento=(data_v + timedelta(days=random.randint(1, 5))) if is_pagata else None
        )
        db.add(fatt)

    # B) AGENDA (12 Visite Future PROGRAMMATE)
    for i in range(12):
        paz = random.choice(pazienti)
        med = random.choice(medici)
        pre = random.choice([p for p in prestazioni if p.is_active])
        data_f = now + timedelta(days=random.randint(1, 30), hours=random.randint(9, 17))

        pren = models.Prenotazione(id_paziente=paz.id_paziente, id_medico=med.id_medico, id_prestazione=pre.id_prestazione, data_ora=data_f, stato="PROGRAMMATA")
        db.add(pren)

    # C) ECCEZIONI (3 Visite ANNULLATE)
    for i in range(3):
        paz = random.choice(pazienti)
        med = random.choice(medici)
        pre = random.choice([p for p in prestazioni if p.is_active])
        data_a = now + timedelta(days=random.randint(-10, 10))

        pren = models.Prenotazione(id_paziente=paz.id_paziente, id_medico=med.id_medico, id_prestazione=pre.id_prestazione, data_ora=data_a, stato="ANNULLATA")
        db.add(pren)

    db.commit()

print("\nDATABASE PRONTO E POPOLATO CON SUCCESSO")
print("====================================================")
print("DATI INSERITI:")
print(f"   - {len(pazienti)} Pazienti (Anamnesi completa inclusa)")
print(f"   - {len(medici)} Medici Specialisti")
print(f"   - {len(prestazioni)} Servizi (inclusi 2 nascosti)")
print("   - 45 Appuntamenti (30 Completati, 12 Programmati, 3 Annullati)")
print("   - 30 Fatture (con mix di saldate e da saldare)")
print("Accesso Globale: password '1234' per qualsiasi email.")
print("====================================================")