# backend/db/models.py
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, Enum, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
from db.database import Base
import enum


class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(Integer, primary_key=True)
    filename = Column(String)
    status = Column(String)
    result_path = Column(String)
    
# --- Table definitions ---

class SpeedEnum(enum.Enum):
    fast = "fast"
    medium = "medium"
    slow = "slow"

class Model(Base):
    __tablename__ = "models"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    speed = Column(Enum(SpeedEnum), nullable=False)
    recommended = Column(Integer, default=0)  # 1 = True, 0 = False
    accuracy = Column(Float, nullable=True)
    description = Column(String, nullable=True)

    attributes = relationship("ModelAttribute", back_populates="model", cascade="all, delete-orphan")
    applications = relationship("Application", secondary="application_models", back_populates="models")

class ModelAttribute(Base):
    __tablename__ = "modelattributes"
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    attribute = Column(String, nullable=False)

    __table_args__ = (PrimaryKeyConstraint("model_id", "attribute"),)

    model = relationship("Model", back_populates="attributes")
    
class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    time_estimation_min = Column(Integer, nullable=True)  # Estimated time in minutes
    time_estimation_max = Column(Integer, nullable=True)  # Estimated time in minutes
    is_new = Column(Boolean, default=True)  # Indicates if the application is new
    
    attributes = relationship("ApplicationAttribute", back_populates="application", cascade="all, delete-orphan")
    models = relationship("Model", secondary="application_models", back_populates="applications")

class ApplicationAttribute(Base):
    __tablename__ = "application_attributes"
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    attribute = Column(String, nullable=False)

    __table_args__ = (PrimaryKeyConstraint("application_id", "attribute"),)

    application = relationship("Application", back_populates="attributes")

class ApplicationModel(Base):
    __tablename__ = "application_models"
    application_id = Column(Integer, ForeignKey("applications.id"), primary_key=True)
    model_id = Column(Integer, ForeignKey("models.id"), primary_key=True)

    application = relationship("Application", back_populates="models")
    model = relationship("Model", back_populates="applications")
    

class RunHistory(Base):
    __tablename__ = "run_history"
    id = Column(Integer, primary_key=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    model_id = Column(Integer, ForeignKey("models.id"))
    application_id = Column(Integer, ForeignKey("applications.id"))
    timestamp = Column(String, nullable=False)
    result_path = Column(String, nullable=True)  # Path to stored results
    status = Column(String, nullable=False)  # e.g., 'success', 'failed'
    user_note = Column(String, nullable=True)

    workflow = relationship("Workflow")
    model = relationship("Model")
    application = relationship("Application")
    metadata = relationship("ResultMetadata", back_populates="run", cascade="all, delete-orphan")
    
class ResultMetadata(Base):
    __tablename__ = "result_metadata"
    id = Column(Integer, primary_key=True)
    run_id = Column(Integer, ForeignKey("run_history.id"))
    key = Column(String, nullable=False)
    value = Column(String, nullable=True)

    run = relationship("RunHistory", back_populates="metadata")
