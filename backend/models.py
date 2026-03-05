from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Utente(Base):
    __tablename__ = "utenti"

    id_utente = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    ruolo = Column(String, default="PAZIENTE") # PAZIENTE, MEDICO, ADMIN
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # 🌟 Campo extra per logica di sessione (facoltativo ma professionale)
    ultimo_accesso = Column(DateTime, nullable=True)

    paziente = relationship("Paziente", back_populates="utente", uselist=False)

class Paziente(Base):
    __tablename__ = "pazienti"

    id_paziente = Column(Integer, primary_key=True, index=True)
    id_utente = Column(Integer, ForeignKey("utenti.id_utente"), unique=True)
    nome = Column(String, nullable=False)
    cognome = Column(String, nullable=False)
    codice_fiscale = Column(String, unique=True, index=True)
    
    # 🌟 NUOVI CAMPI ANAGRAFICI E CLINICI (Anamnesi)
    data_nascita = Column(Date, nullable=True)
    telefono = Column(String, nullable=True)
    gruppo_sanguigno = Column(String, nullable=True) # Es: "A+", "0-"
    allergie = Column(Text, nullable=True) # Text permette descrizioni lunghe
    patologie_pregresse = Column(Text, nullable=True)

    utente = relationship("Utente", back_populates="paziente")

class Medico(Base):
    __tablename__ = "medici"

    id_medico = Column(Integer, primary_key=True, index=True)
    id_utente = Column(Integer, ForeignKey("utenti.id_utente"), unique=True)
    nome = Column(String, nullable=False)
    cognome = Column(String, nullable=False)
    specializzazione = Column(String, nullable=False)
    # 🌟 Aggiunta matricola per realismo accademico
    matricola_ordine = Column(String, unique=True, nullable=True)

    utente = relationship("Utente")
    prenotazioni = relationship("Prenotazione", back_populates="medico")

class Prestazione(Base):
    __tablename__ = "prestazioni"

    id_prestazione = Column(Integer, primary_key=True, index=True)
    nome_prestazione = Column(String, nullable=False)
    costo = Column(Integer, nullable=False)
    # 🌟 SOFT DELETE: Permette di "ritirare" una prestazione senza rompere lo storico
    is_active = Column(Boolean, default=True)

    prenotazioni = relationship("Prenotazione", back_populates="prestazione")

class Prenotazione(Base):
    __tablename__ = "prenotazioni"

    id_prenotazione = Column(Integer, primary_key=True, index=True)
    id_paziente = Column(Integer, ForeignKey("pazienti.id_paziente"), nullable=False)
    id_medico = Column(Integer, ForeignKey("medici.id_medico"), nullable=False)
    id_prestazione = Column(Integer, ForeignKey("prestazioni.id_prestazione"), nullable=False)
    data_ora = Column(DateTime, nullable=False)
    stato = Column(String, default="PROGRAMMATA") # PROGRAMMATA, COMPLETATA, ANNULLATA

    paziente = relationship("Paziente")
    medico = relationship("Medico", back_populates="prenotazioni")
    prestazione = relationship("Prestazione", back_populates="prenotazioni")

class Referto(Base):
    __tablename__ = "referti"

    id_referto = Column(Integer, primary_key=True, index=True)
    id_prenotazione = Column(Integer, ForeignKey("prenotazioni.id_prenotazione"), unique=True, nullable=False)
    esito_visita = Column(Text, nullable=False) # Cambiato in Text per referti lunghi
    prescrizioni = Column(Text, nullable=True)
    # 🌟 Placeholder per il file (fondamentale nello schema ER)
    file_path_pdf = Column(String, nullable=True)

    prenotazione = relationship("Prenotazione")

class Fattura(Base):
    __tablename__ = "fatture"

    id_fattura = Column(Integer, primary_key=True, index=True)
    id_prenotazione = Column(Integer, ForeignKey("prenotazioni.id_prenotazione"), unique=True, nullable=False)
    importo = Column(Integer, nullable=False)
    pagata = Column(Boolean, default=False)
    data_emissione = Column(DateTime, default=datetime.utcnow)
    data_pagamento = Column(DateTime, nullable=True) # Traccia quando è stata pagata

    prenotazione = relationship("Prenotazione")