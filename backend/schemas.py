from pydantic import BaseModel
from datetime import datetime
from typing import Optional # Importante per i campi non obbligatori

# --- SCHEMI PER IL LOGIN (Invariati) ---
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    id_utente: int
    ruolo: str
    id_collegato: int | None = None
    nome_completo: str
    specializzazione: str | None = None

# --- SCHEMI PER PAZIENTI (Aggiornati con Anamnesi) ---
class PazienteCreate(BaseModel):
    email: str
    password: str
    nome: str
    cognome: str
    codice_fiscale: str
    # 🌟 Nuovi campi anamnesi
    gruppo_sanguigno: Optional[str] = None
    allergie: Optional[str] = None

class PazienteResponse(BaseModel):
    id_paziente: int
    nome: str
    cognome: str
    gruppo_sanguigno: Optional[str]
    allergie: Optional[str]
    
    class Config:
        from_attributes = True

# --- SCHEMI PER PRESTAZIONI (Aggiornati con Soft Delete) ---
class PrestazioneCreate(BaseModel):
    nome_prestazione: str
    costo: int
    is_active: bool = True # 🌟 Default attiva

class PrestazioneResponse(BaseModel):
    id_prestazione: int
    nome_prestazione: str
    costo: int
    is_active: bool # 🌟 Fondamentale per l'Admin

    class Config:
        from_attributes = True

# --- ALTRI SCHEMI (Invariati o leggermente puliti) ---
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
    paziente_nome: Optional[str] = None # Aggiunto per comodità frontend

    class Config:
        from_attributes = True

# ... (Referto e Fattura rimangono uguali a meno che tu non voglia aggiungere altro)

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