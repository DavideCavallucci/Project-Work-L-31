from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Utente(Base):
    __tablename__ = "utenti"

    id_utente = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    ruolo = Column(String, default="PAZIENTE")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relazione 1-a-1 col Paziente
    paziente = relationship("Paziente", back_populates="utente", uselist=False)


class Paziente(Base):
    __tablename__ = "pazienti"

    id_paziente = Column(Integer, primary_key=True, index=True)
    id_utente = Column(Integer, ForeignKey("utenti.id_utente"), unique=True)
    nome = Column(String, nullable=False)
    cognome = Column(String, nullable=False)
    codice_fiscale = Column(String, unique=True, index=True)

    # Relazione inversa
    utente = relationship("Utente", back_populates="paziente")

class Medico(Base):
    __tablename__ = "medici"

    id_medico = Column(Integer, primary_key=True, index=True)
    id_utente = Column(Integer, ForeignKey("utenti.id_utente"), unique=True)
    nome = Column(String, nullable=False)
    cognome = Column(String, nullable=False)
    specializzazione = Column(String, nullable=False)

    utente = relationship("Utente")
    prenotazioni = relationship("Prenotazione", back_populates="medico")


class Prestazione(Base):
    __tablename__ = "prestazioni"

    id_prestazione = Column(Integer, primary_key=True, index=True)
    nome_prestazione = Column(String, nullable=False)
    costo = Column(Integer, nullable=False)

    prenotazioni = relationship("Prenotazione", back_populates="prestazione")


class Prenotazione(Base):
    __tablename__ = "prenotazioni"

    id_prenotazione = Column(Integer, primary_key=True, index=True)
    id_paziente = Column(Integer, ForeignKey("pazienti.id_paziente"), nullable=False)
    id_medico = Column(Integer, ForeignKey("medici.id_medico"), nullable=False)
    id_prestazione = Column(Integer, ForeignKey("prestazioni.id_prestazione"), nullable=False)
    data_ora = Column(DateTime, nullable=False)
    stato = Column(String, default="PROGRAMMATA") # Può essere PROGRAMMATA, COMPLETATA, ANNULLATA

    paziente = relationship("Paziente")
    medico = relationship("Medico", back_populates="prenotazioni")
    prestazione = relationship("Prestazione", back_populates="prenotazioni")

class Referto(Base):
    __tablename__ = "referti"

    id_referto = Column(Integer, primary_key=True, index=True)
    id_prenotazione = Column(Integer, ForeignKey("prenotazioni.id_prenotazione"), unique=True, nullable=False)
    esito_visita = Column(String, nullable=False)
    prescrizioni = Column(String, nullable=True) # Può essere vuoto se non ci sono medicine da prescrivere

    prenotazione = relationship("Prenotazione")


class Fattura(Base):
    __tablename__ = "fatture"

    id_fattura = Column(Integer, primary_key=True, index=True)
    id_prenotazione = Column(Integer, ForeignKey("prenotazioni.id_prenotazione"), unique=True, nullable=False)
    importo = Column(Integer, nullable=False)
    pagata = Column(Boolean, default=False)
    data_emissione = Column(DateTime, default=datetime.utcnow)

    prenotazione = relationship("Prenotazione")

class Promemoria(Base):
    __tablename__ = "promemoria"

    id_promemoria = Column(Integer, primary_key=True, index=True)
    id_prenotazione = Column(Integer, ForeignKey("prenotazioni.id_prenotazione"), unique=True)
    attivo = Column(Boolean, default=True)
    data_creazione = Column(DateTime, default=datetime.utcnow)

    prenotazione = relationship("Prenotazione")