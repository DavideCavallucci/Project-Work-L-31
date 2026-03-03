from pydantic import BaseModel
from datetime import datetime

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