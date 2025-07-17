"""
FastAPI wrapper for the Technical Researcher Agent
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

from agent import TechnicalResearcherAgent, TechnicalOpportunity

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Technical Researcher Agent API",
    description="API for finding technical trading opportunities",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
AGENT_API_KEY = os.getenv("AGENT_API_KEY")

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify API token"""
    if not AGENT_API_KEY:
        logger.warning("AGENT_API_KEY not set - running without authentication")
        return True
        
    if credentials.credentials != AGENT_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    return True

# Request/Response Models
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
    version: str = "1.0.0"

# Initialize agent
try:
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    agent = TechnicalResearcherAgent(openai_api_key)
    logger.info("Technical Researcher Agent initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize agent: {e}")
    agent = None

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if agent else "unhealthy",
        timestamp=datetime.now()
    )

@app.post("/find-opportunities", response_model=OpportunityResponse)
async def find_opportunities(
    request: OpportunityRequest,
    _: bool = Depends(verify_token)
):
    """Find technical trading opportunities"""
    
    if not agent:
        raise HTTPException(
            status_code=503,
            detail="Technical Researcher Agent not available"
        )
    
    start_time = datetime.now()
    
    try:
        logger.info(f"Finding opportunities: max={request.max_opportunities}")
        
        opportunities = agent.find_opportunities(
            max_opportunities=request.max_opportunities
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Found {len(opportunities)} opportunities in {execution_time:.2f}s")
        
        return OpportunityResponse(
            success=True,
            opportunities=opportunities,
            execution_time=execution_time,
            timestamp=datetime.now(),
            message=f"Found {len(opportunities)} opportunities"
        )
        
    except Exception as e:
        logger.error(f"Error finding opportunities: {e}")
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return OpportunityResponse(
            success=False,
            opportunities=[],
            execution_time=execution_time,
            timestamp=datetime.now(),
            message=f"Error: {str(e)}"
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Technical Researcher Agent API",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "find_opportunities": "/find-opportunities"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    port = int(os.getenv("AGENT_PORT", 8001))
    
    logger.info(f"Starting Technical Researcher Agent API on {host}:{port}")
    
    uvicorn.run(
        "api:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    ) 