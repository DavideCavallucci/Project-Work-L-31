from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

# Carichiamo le variabili dal file .env
load_dotenv()

# Recuperiamo l'URL di connessione
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Creiamo il "motore" che parlerà con PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Creiamo la "fabbrica" delle sessioni (ogni volta che un utente fa una richiesta API)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Questa è la Classe Base da cui erediteranno tutte le nostre tabelle
Base = declarative_base()

# Prende l'URL da Render, se non c'è usa quello locale
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Correzione necessaria per Render/Heroku se l'URL inizia con postgres:// invece di postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)