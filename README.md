# 🏥 MedCloud: Project Work - L-31

### Piattaforma Full-Stack per la Gestione Clinica e Amministrativa Sanitaria

**Candidato:** Davide Cavallucci

**Matricola:** 0312500017

**Progetto di Tesi:** Sviluppo di una applicazione full-stack API-based per un’organizzazione del settore sanitario (L-31)

---

## 📋 Indice

1. [Vision del Progetto](#-vision-del-progetto)
2. [Architettura Tecnica](#-architettura-tecnica)
3. [Funzionalità Principali](#-funzionalità-principali)
4. [Infrastruttura e Database](#-infrastruttura-e-database)
5. [Sicurezza e Integrità dei Dati](#-sicurezza-e-integrità-dei-dati)
6. [Progettazione e Modellazione](#-progettazione-e-modellazione)
7. [Guida all'Installazione](#-guida-allinstallazione)
8. [Deployment e Risorse Cloud](#-deployment-e-risorse-cloud)
9. [Credenziali di Accesso per Test](#-credenziali-di-accesso-per-test)

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

## 🔒 Sicurezza e Integrità dei Dati

* **Protezione degli Accessi (CORS):** È stato implementato un sistema di filtri (CORS) che permette al Backend di rispondere esclusivamente alle chiamate provenienti dal nostro Frontend autorizzato. Questo impedisce a siti esterni o malintenzionati di interrogare il server e tentare di sottrarre dati.
* **Privacy e Data Masking:** Per garantire la riservatezza, i dati sensibili non vengono mai esposti inutilmente. Ad esempio, nei log di sistema o nelle anteprime, le informazioni critiche vengono oscurate o sintetizzate, seguendo il principio di "minimizzazione del dato" previsto dal GDPR.
* **Solidità del Database (Vincoli di Integrità):** Grazie all'uso di chiavi esterne (Foreign Keys), il database impedisce errori umani o di sistema che potrebbero corrompere i dati. Ad esempio:
  * Non è possibile eliminare un medico se ci sono visite programmate con lui.
  * Una fattura non può esistere senza un appuntamento collegato.
  * Ogni referto è "blindato" alla specifica prenotazione del paziente, rendendo impossibile lo scambio accidentale di cartelle cliniche tra utenti diversi.

---

## 📐 Progettazione e Modellazione

Il design del sistema è stato preceduto da una fase di modellazione formale per garantire la coerenza dei dati e dei processi.

| Diagramma | Tool | Link |
| :--- | :--- | :--- |
| **Schema E-R (Entity-Relationship)** | dbdiagram.io | [📊 Visualizza lo Schema DB](https://dbdiagram.io/d/Project-Work-Schema-ER-69a6c5a2a3f0aa31e1a5c6b4) |
| **Diagrammi UML (Diagramma delle Classi)** | Mermaid.js | [🔄 Guarda il Diagramma delle Classi](https://mermaid.ai/d/9c4a354b-9ab0-420b-9336-9a7db87bbf4b) |
| **Diagrammi UML (Diagramma di Sequenza)** | Mermaid.js | [🔄 Esplora il Diagramma di Sequenza del Medico](https://mermaid.ai/d/3efba05a-d524-4ba1-987f-3b7e6a9463ee) |
| **Diagrammi UML (Diagramma di Sequenza)** | Mermaid.js | [🔄 Esplora il Diagramma di Sequenza del Paziente](https://mermaid.ai/d/c280a9f3-cd5a-4c91-881f-8efa54152885) |

### Logica di Progettazione
* **Modello E-R:** Lo schema è stato progettato per supportare la coerenza transazionale. Ogni entità (Utente, Paziente, Medico, Prenotazione, Referto, Fattura) rispetta le forme normali per evitare ridondanze e anomalie di aggiornamento.
* **Diagrammi UML:** Sono stati modellati i principali casi d'uso (Use Case Diagram) per definire i permessi degli attori (Paziente vs Medico vs Admin) e i diagrammi di sequenza per mappare il flusso di refertazione e fatturazione elettronica.

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

## 🌐 Deployment e Risorse Cloud

Per facilitare la revisione del progetto, sono stati predisposti i seguenti punti di accesso alle risorse live:

| Risorsa | Piattaforma | Link Diretto |
| :--- | :--- | :--- |
| **Frontend Live** | Netlify | [🚀 Vai all'App](https://medcloud-pw.netlify.app) |
| **Documentazione API** | Swagger UI | [📖 Esplora gli Endpoint](https://project-work-l-31.onrender.com/docs) |
| **Database Console** | Neon.tech | [🐘 Gestione PostgreSQL](https://console.neon.tech/app/projects/dawn-poetry-37386529) |

---

## 🔐 Credenziali di Accesso per Test

Per facilitare la fase di revisione dell'elaborato, il sistema è stato pre-popolato con account di test che riflettono i diversi livelli di autorizzazione previsti dalla logica di business.

* **Nota:** La funzione di registrazione (Sign-up) non è prevista per l'utente finale in quanto, in un contesto aziendale sanitario, la creazione dei profili è di competenza esclusiva dell'Amministratore di sistema.

### 1. Profilo Paziente (Area Prenotazioni)

* **Paziente 1:** mario.rossi@email.it
* **Paziente 2:** laura.bianchi@email.it
* **Paziente 3:** giuseppe.verdi@email.it
* **Paziente 4:** anna.gialli@email.it
* **Paziente 5:** luigi.neri@email.it
* **Paziente 6:** chiara.marrone@email.it
* **Paziente 7:** paolo.blu@email.it

* **Password:** 1234 (valida per tutti i pazienti)

Permessi: Prenotazione visite, visualizzazione storico clinico personale e download referti/fatture.

### 2. Profilo Medico (Area Clinica)

* **Medico 1:** cardiologia@medcloud.it
* **Medico 2:** dermatologia@medcloud.it
* **Medico 3:** ortopedia@medcloud.it
* **Medico 4:** oculistica@medcloud.it
* **Medico 5:** pediatria@medcloud.it
* **Medico 6:** neurologia@medcloud.it
* **Medico 7:** psicologia@medcloud.it

* **Password:** 1234 (valida per tutti i medici)

Permessi: Gestione agenda, accesso alle cartelle cliniche dei pazienti, invio referti e generazione automatica fatture.

