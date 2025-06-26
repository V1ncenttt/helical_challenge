# backend/db/init_db.py
from sqlalchemy import create_engine, Column, Integer, String, Enum, ForeignKey, Float
from sqlalchemy.orm import declarative_base, relationship
from db.database import Base, engine
from db.models import Base, Model, ModelAttribute, SpeedEnum
import enum



Base.metadata.create_all(bind=engine)

from sqlalchemy.orm import sessionmaker


def init_database():
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    Base.metadata.create_all(bind=engine)

    if not db.query(Model).first():
        geneformer = Model(name="Geneformer", speed=SpeedEnum.fast, recommended=1, accuracy=94)
        geneformer.attributes = [
            ModelAttribute(attribute="Pre-trained"),
            ModelAttribute(attribute="High accuracy"),
            ModelAttribute(attribute="Cell type annotation")
        ]

        scgpt = Model(name="scGPT", speed=SpeedEnum.slow, recommended=0, accuracy=93)
        scgpt.attributes = [
            ModelAttribute(attribute="Generative"),
            ModelAttribute(attribute="Multi-task"),
            ModelAttribute(attribute="State-of-the-art")
        ]

        db.add_all([geneformer, scgpt])
        db.commit()
    db.close()
    print("✅ Database initialized successfully----------.")

init_database()