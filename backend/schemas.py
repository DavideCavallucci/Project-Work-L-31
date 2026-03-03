from pydantic import BaseModel
from datetime import datetime

# --- SCHEMI PER IL LOGIN ---
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    id_utente: int
    ruolo: str
    id_collegato: int | None = None  # Sarà l'ID del Paziente o l'ID del Medico
    nome_completo: str
    specializzazione: str | None = None

# Questo è il formato dei dati che il frontend ci manderà per registrare un paziente
class PazienteCreate(BaseModel):
    email: str
    password: str
    nome: str
    cognome: str
    codice_fiscale: str

# Questo è il formato dei dati che noi restituiremo (senza inviare indietro la password!)
class PazienteResponse(BaseModel):
    id_paziente: int
    nome: str
    cognome: str
    
    class Config:
        from_attributes = True

class PrenotazioneCreate(BaseModel):
    id_paziente: int
    id_medico: int
    id_prestazione: int
    data_ora: datetime

class PrenotazioneResponse(BaseModel):
    id_prenotazione: int
    id_paziente: int
    id_medico: int
    id_prestazione: int
    data_ora: datetime
    stato: str

    class Config:
        from_attributes = True

# --- SCHEMI PER MEDICI ---
class MedicoCreate(BaseModel):
    email: str
    password: str
    nome: str
    cognome: str
    specializzazione: str

class MedicoResponse(BaseModel):
    id_medico: int
    nome: str
    cognome: str
    specializzazione: str

    class Config:
        from_attributes = True

# --- SCHEMI PER PRESTAZIONI ---
class PrestazioneCreate(BaseModel):
    nome_prestazione: str
    costo: int

class PrestazioneResponse(BaseModel):
    id_prestazione: int
    nome_prestazione: str
    costo: int

    class Config:
        from_attributes = True

# --- SCHEMI PER REFERTI ---
class RefertoCreate(BaseModel):
    id_prenotazione: int
    esito_visita: str
    prescrizioni: str | None = None # Il | None significa che è opzionale

class RefertoResponse(BaseModel):
    id_referto: int
    id_prenotazione: int
    esito_visita: str
    prescrizioni: str | None

    class Config:
        from_attributes = True

# --- SCHEMI PER FATTURE ---
class FatturaResponse(BaseModel):
    id_fattura: int
    id_prenotazione: int
    importo: int
    pagata: bool
    data_emissione: datetime

    class Config:
        from_attributes = True

class PromemoriaCreate(BaseModel):
    id_prenotazione: int

class PromemoriaResponse(BaseModel):
    id_promemoria: int
    id_prenotazione: int
    attivo: bool
    class Config:
        from_attributes = True