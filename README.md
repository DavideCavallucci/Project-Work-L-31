# 🏥 MedCloud: Digital Health Ecosystem

### Piattaforma Full-Stack per la Gestione Clinica e Amministrativa Sanitaria

**Candidato:** Davide Cavallucci

**Matricola:** 0312500017

**Progetto di Tesi:** Sviluppo di una applicazione full-stack API-based per un’organizzazione del settore sanitario (L-31)

---

## 📋 Indice

1. [Vision del Progetto](#vision-del-progetto)
2. [Architettura Tecnica](#architettura-tecnica)
3. [Funzionalità Principali](#funzionalità-principali)
4. [Infrastruttura e Database](#infrastruttura-e-database)
5. [Guida all'Installazione](#guida-all'installazione)
6. [Sicurezza e Integrità dei Dati](#sicurezza-e-integrità-dei-dati)
7. [Struttura del Design](#struttura-del-design)

---

## 🎯 Vision del Progetto

**MedCloud** nasce dall'esigenza di digitalizzare il workflow clinico, abbattendo le barriere comunicative tra paziente, medico e amministrazione. Il progetto simula un ambiente di **e-Health** reale, focalizzandosi sulla centralità del dato clinico e sulla trasparenza amministrativa.

> "L'obiettivo è trasformare il Fascicolo Sanitario Elettronico (FSE) da un semplice archivio a uno strumento attivo di supporto decisionale e gestionale."

---

## 🛠 Architettura Tecnica

Il sistema adotta un'architettura **decoupled** per garantire scalabilità e manutenibilità.

| Layer | Tecnologia | Ruolo |
| --- | --- | --- |
| **Frontend** | React 18 + Tailwind CSS | Interfaccia utente reattiva con design SaaS. |
| **Backend** | FastAPI (Python 3.12+) | RESTful API ad alte prestazioni con documentazione Swagger automatica. |
| **Database** | PostgreSQL (Neon.tech) | Database relazionale con gestione avanzata di vincoli e integrità. |
| **ORM** | SQLAlchemy | Mapping oggetto-relazionale per la manipolazione sicura dei dati. |
| **Deployment** | Render.com | Hosting cloud per il backend e il database distribuito. |
| **PDF Engine** | ReportLab | Generazione dinamica di documenti fiscali certificati. |

---

## ✨ Funzionalità Principali

### 🧬 Area Paziente

* **Tessera Sanitaria Digitale:** Visualizzazione immediata dei dati anagrafici e codice fiscale.
* **Anamnesi Smart:** Monitoraggio in tempo reale di gruppo sanguineo, allergie e patologie pregresse.
* **Booking Engine:** Sistema di prenotazione visite con logica di disponibilità dei medici.
* **Digital Wallet:** Gestione dei pagamenti e download immediato delle fatture in formato PDF.

### 🩺 Area Medica

* **Agenda dinamica:** Visualizzazione della coda pazienti programmata per la giornata.
* **Clinical Summary:** Accesso istantaneo alle allergie e patologie del paziente prima della visita.
* **Refertazione Digitale:** Compilazione assistita di esiti e piani farmacologici con archiviazione storica.

### 🏦 Dashboard Admin

* **Finanza e Controllo:** Monitoraggio in tempo reale del fatturato lordo, incassato e crediti pendenti.
* **Catalogo Servizi:** Gestione del listino prestazioni con logica di **Soft Delete** (Is_Active).
* **Solleciti di Pagamento:** Sistema di monitoraggio degli stati di pagamento.

---

## 📊 Infrastruttura e Database

Il modello ER è stato progettato per garantire la **normalizzazione dei dati** e la prevenzione delle ridondanze.

* **Relazioni:** Uno-a-Molti tra Utenti e Prenotazioni; Uno-a-Uno tra Prenotazioni e Referti/Fatture.
* **Stato Prenotazioni:** Gestione degli stati `PROGRAMMATA`, `COMPLETATA`, `ANNULLATA` per garantire un audit trail completo.

---

## 🚀 Guida all'Installazione

### 1. Requisiti

* Python 3.12+
* Node.js 18+
* PostgreSQL (o istanza Neon.tech)

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Su Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev

```
---

## 🔒 Sicurezza e Integrità dei Dati

* **Protezione degli Accessi (CORS):** È stato implementato un sistema di filtri (CORS) che permette al Backend di rispondere esclusivamente alle chiamate provenienti dal nostro Frontend autorizzato. Questo impedisce a siti esterni o malintenzionati di interrogare il server e tentare di sottrarre dati.
* **Privacy e Data Masking:** Per garantire la riservatezza, i dati sensibili non vengono mai esposti inutilmente. Ad esempio, nei log di sistema o nelle anteprime, le informazioni critiche vengono oscurate o sintetizzate, seguendo il principio di "minimizzazione del dato" previsto dal GDPR.
* **Solidità del Database (Vincoli di Integrità):** Grazie all'uso di chiavi esterne (Foreign Keys), il database impedisce errori umani o di sistema che potrebbero corrompere i dati. Ad esempio:
  * Non è possibile eliminare un medico se ci sono visite programmate con lui.
  * Una fattura non può esistere senza un appuntamento collegato.
  * Ogni referto è "blindato" alla specifica prenotazione del paziente, rendendo impossibile lo scambio accidentale di cartelle cliniche tra utenti diversi.

---

Certamente! Eleviamo il tono di questa sezione parlando di come il design non sia solo "estetica", ma uno strumento fondamentale per prevenire l'errore umano in contesti critici come quello sanitario.

Ecco una versione che mette in risalto la tua competenza in **UX/UI Design** e **Human-Centered Design**:

---

### 🧑‍🎨 Struttura del Design

Il progetto è stato sviluppato adottando i paradigmi del **Human-Centered Design (HCD)**, con l'obiettivo di dimostrare come un'interfaccia curata possa ridurre drasticamente il carico cognitivo dell'operatore sanitario e il rischio clinico per il paziente.

**Punti chiave della progettazione:**

  * **Architettura dell'Informazione e Gerarchia Visiva:** L'uso di card differenziate e di una palette cromatica semantica (es. rosso per le allergie, verde per lo stato saldato) permette una scansione rapida delle informazioni vitali, riducendo i tempi di reazione del medico e prevenendo sviste diagnostiche.
  * **Design Inclusivo e Accessibilità:** Seguendo i principi del **Material Design**, l'interfaccia garantisce elevati contrasti e una leggibilità ottimale dei dati clinici, assicurando che la piattaforma sia fruibile in diverse condizioni di illuminazione e su molteplici dispositivi.
  * **Affordance e Micro-interazioni:** Ogni elemento interattivo (come i toggle switch per l'attivazione dei servizi o i bottoni di firma del referto) è stato progettato per fornire un feedback immediato all'utente, eliminando l'incertezza e migliorando l'efficienza operativa del workflow ospedaliero.

---
