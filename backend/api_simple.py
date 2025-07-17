"""
Simplified FastAPI wrapper for testing (without LangChain)
"""

import os
import logging
from typing import List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Technical Researcher Agent API (Simple)",
    description="Simplified API for testing basic functionality",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
AGENT_API_KEY = os.getenv("AGENT_API_KEY", "dev-key-12345")

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify API token"""
    if credentials.credentials != AGENT_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    return True

# Request/Response Models
class TechnicalOpportunity(BaseModel):
    ticker: str
    setup_type: str
    confidence_score: float
    price: float
    volume: int
    key_indicators: Dict[str, Any]
    rationale: str
    timeframe: str = "1-5 days"

class OpportunityRequest(BaseModel):
    max_opportunities: int = 5
    min_volume: int = 100000
    
class OpportunityResponse(BaseModel):
    success: bool
    opportunities: List[TechnicalOpportunity]
    execution_time: float
    timestamp: datetime
    message: str = ""

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0-simple"

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now()
    )

@app.post("/find-opportunities", response_model=OpportunityResponse)
async def find_opportunities(
    request: OpportunityRequest,
    _: bool = Depends(verify_token)
):
    """Find technical trading opportunities (mock implementation)"""
    
    start_time = datetime.now()
    
    # Mock opportunities for testing
    mock_opportunities = [
        TechnicalOpportunity(
            ticker="AAPL",
            setup_type="breakout",
            confidence_score=0.8,
            price=190.50,
            volume=2500000,
            key_indicators={"rsi": 65, "macd": 0.5, "volume_spike": True},
            rationale="Strong breakout above 20-day high with volume confirmation. RSI showing strength but not overbought."
        ),
        TechnicalOpportunity(
            ticker="MSFT",
            setup_type="momentum",
            confidence_score=0.75,
            price=420.25,
            volume=1800000,
            key_indicators={"rsi": 70, "macd": 0.8, "adx": 35},
            rationale="Strong momentum continuation with MACD crossover and high ADX indicating trend strength."
        )
    ]
    
    # Limit results based on request
    opportunities = mock_opportunities[:request.max_opportunities]
    execution_time = (datetime.now() - start_time).total_seconds()
    
    logger.info(f"Mock: Found {len(opportunities)} opportunities in {execution_time:.2f}s")
    
    return OpportunityResponse(
        success=True,
        opportunities=opportunities,
        execution_time=execution_time,
        timestamp=datetime.now(),
        message=f"Found {len(opportunities)} mock opportunities"
    )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Technical Researcher Agent API (Simple)",
        "status": "running",
        "note": "This is a simplified version for testing",
        "endpoints": {
            "health": "/health",
            "find_opportunities": "/find-opportunities"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    port = int(os.getenv("AGENT_PORT", 8001))
    
    logger.info(f"Starting Simple Technical Researcher Agent API on {host}:{port}")
    
    uvicorn.run(
        "api_simple:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    ) 