from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, create_engine
from sqlalchemy.orm import relationship, declarative_base, sessionmaker, Session

Base = declarative_base()

DATABASE_URL = "sqlite:///./app.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
