"""
Database models and connection for Technical Researcher Agent
"""
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel

# Database setup
DATABASE_URL = "sqlite:///./trading_agent.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class OpportunityDB(Base):
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(10), index=True, nullable=False)
    setup_type = Column(String(50), nullable=False)
    confidence_score = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    key_indicators = Column(JSON, nullable=False)  # Store as JSON
    rationale = Column(Text, nullable=False)
    timeframe = Column(String(10), nullable=False)
    
    # Tracking fields
    first_detected = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, closed, expired
    is_new = Column(Boolean, default=True, nullable=False)  # For agent handoff
    
    # Change tracking
    price_change_pct = Column(Float, default=0.0)  # Price change since first detection
    confidence_change = Column(Float, default=0.0)  # Confidence change

class OpportunityHistoryDB(Base):
    __tablename__ = "opportunity_history"
    
    id = Column(Integer, primary_key=True, index=True)
    opportunity_id = Column(Integer, nullable=False)  # Reference to opportunities.id
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # What changed
    field_name = Column(String(50), nullable=False)  # price, confidence_score, etc.
    old_value = Column(String(255))
    new_value = Column(String(255))
    change_type = Column(String(20), nullable=False)  # created, updated, status_change

class AgentActionDB(Base):
    __tablename__ = "agent_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_name = Column(String(50), nullable=False)  # technical_researcher, options_analyst
    action_type = Column(String(50), nullable=False)  # scan, analyze, recommend
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    opportunities_processed = Column(Integer, default=0)
    new_opportunities = Column(Integer, default=0)
    execution_time_seconds = Column(Float)
    status = Column(String(20), nullable=False)  # success, error, partial
    notes = Column(Text)

# Pydantic models for API responses
class OpportunityResponse(BaseModel):
    id: int
    ticker: str
    setup_type: str
    confidence_score: float
    price: float
    volume: int
    key_indicators: Dict[str, Any]
    rationale: str
    timeframe: str
    first_detected: datetime
    last_updated: datetime
    status: str
    is_new: bool
    price_change_pct: float
    confidence_change: float

    class Config:
        from_attributes = True

# Database utility functions
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)

def save_opportunity(db: Session, opportunity_data: Dict[str, Any], is_update: bool = False) -> OpportunityDB:
    """Save or update an opportunity in the database"""
    
    if is_update:
        # Find existing opportunity
        existing = db.query(OpportunityDB).filter(
            OpportunityDB.ticker == opportunity_data["ticker"],
            OpportunityDB.setup_type == opportunity_data["setup_type"],
            OpportunityDB.status == "active"
        ).first()
        
        if existing:
            # Track changes
            changes = []
            for key, new_value in opportunity_data.items():
                if hasattr(existing, key):
                    old_value = getattr(existing, key)
                    if old_value != new_value and key not in ["last_updated"]:
                        changes.append({
                            "field_name": key,
                            "old_value": str(old_value),
                            "new_value": str(new_value),
                            "change_type": "updated"
                        })
                        
                        # Update change tracking
                        if key == "price":
                            existing.price_change_pct = ((new_value - existing.price) / existing.price) * 100
                        elif key == "confidence_score":
                            existing.confidence_change = new_value - existing.confidence_score
                        
                        setattr(existing, key, new_value)
            
            existing.last_updated = datetime.utcnow()
            existing.is_new = len(changes) > 0  # Mark as new if there are changes
            
            # Save change history
            for change in changes:
                history = OpportunityHistoryDB(
                    opportunity_id=existing.id,
                    **change
                )
                db.add(history)
            
            db.commit()
            db.refresh(existing)
            return existing
    
    # Create new opportunity
    opportunity = OpportunityDB(**opportunity_data)
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    
    # Log creation in history
    history = OpportunityHistoryDB(
        opportunity_id=opportunity.id,
        field_name="created",
        new_value=f"New {opportunity.setup_type} opportunity",
        change_type="created"
    )
    db.add(history)
    db.commit()
    
    return opportunity

def get_active_opportunities(db: Session, limit: int = 50) -> List[OpportunityDB]:
    """Get all active opportunities"""
    return db.query(OpportunityDB).filter(
        OpportunityDB.status == "active"
    ).order_by(OpportunityDB.last_updated.desc()).limit(limit).all()

def get_new_opportunities_for_agent(db: Session, agent_name: str) -> List[OpportunityDB]:
    """Get opportunities that haven't been processed by a specific agent"""
    # For now, return all new opportunities
    # Later can track per-agent processing
    return db.query(OpportunityDB).filter(
        OpportunityDB.is_new == True,
        OpportunityDB.status == "active"
    ).all()

def mark_opportunities_processed(db: Session, opportunity_ids: List[int]):
    """Mark opportunities as processed (no longer new)"""
    db.query(OpportunityDB).filter(
        OpportunityDB.id.in_(opportunity_ids)
    ).update({"is_new": False})
    db.commit()

def log_agent_action(db: Session, agent_name: str, action_type: str, **kwargs):
    """Log an agent action for audit trail"""
    action = AgentActionDB(
        agent_name=agent_name,
        action_type=action_type,
        **kwargs
    )
    db.add(action)
    db.commit()
    return action 