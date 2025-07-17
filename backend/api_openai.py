"""
OpenAI-powered Technical Researcher Agent API
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import yfinance as yf
import pandas as pd

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Initialize OpenAI client
from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize FastAPI app
app = FastAPI(
    title="Technical Researcher Agent API (OpenAI)",
    description="Technical analysis powered by OpenAI GPT-4",
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

class ResearchRequest(BaseModel):
    query: str = "Find swing trading opportunities with strong momentum"
    lookback_days: int = 30
    min_volume: int = 100000
    max_opportunities: int = 5

class ResearchResponse(BaseModel):
    success: bool
    opportunities: List[TechnicalOpportunity]
    execution_time: float
    timestamp: datetime
    message: str = ""

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0-openai"

# Helper functions
def get_market_data(ticker: str, period: str = "60d") -> Optional[pd.DataFrame]:
    """Get market data for a ticker"""
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period)
        return data
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {e}")
        return None

def analyze_with_openai(ticker: str, market_data: pd.DataFrame, query: str) -> Optional[Dict]:
    """Analyze market data using OpenAI"""
    try:
        # Prepare market data summary
        latest = market_data.iloc[-1]
        recent_5d = market_data.tail(5)
        
        # Calculate basic indicators
        sma_20 = market_data['Close'].rolling(20).mean().iloc[-1]
        volume_avg = market_data['Volume'].rolling(20).mean().iloc[-1]
        price_change_5d = ((latest['Close'] - recent_5d.iloc[0]['Close']) / recent_5d.iloc[0]['Close']) * 100
        
        # Prepare prompt
        data_summary = f"""
        Ticker: {ticker}
        Current Price: ${latest['Close']:.2f}
        Volume: {latest['Volume']:,}
        20-day SMA: ${sma_20:.2f}
        5-day price change: {price_change_5d:.2f}%
        Average volume (20d): {volume_avg:,.0f}
        
        Recent 5-day data:
        {recent_5d[['Close', 'Volume']].to_string()}
        """
        
        prompt = f"""
        As a technical analysis expert, analyze this stock data for trading opportunities:

        {data_summary}

        Query: {query}

        Provide analysis in this exact JSON format:
        {{
            "setup_type": "breakout|momentum|reversal|consolidation",
            "confidence_score": 0.0-1.0,
            "key_indicators": {{"rsi": null, "macd": null, "volume_spike": true/false, "price_vs_sma": "above/below"}},
            "rationale": "detailed explanation of the setup",
            "suitable_for_options": true/false,
            "timeframe": "1-3 days|3-7 days|1-2 weeks"
        }}

        Only respond with valid JSON, no other text.
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional technical analyst. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=500
        )
        
        analysis = json.loads(response.choices[0].message.content)
        return analysis
        
    except Exception as e:
        logger.error(f"OpenAI analysis error for {ticker}: {e}")
        return None

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now()
    )

@app.post("/research", response_model=ResearchResponse)
async def research_opportunities(
    request: ResearchRequest,
    _: bool = Depends(verify_token)
):
    """Research technical trading opportunities using OpenAI analysis"""
    
    start_time = datetime.now()
    opportunities = []
    
    try:
        # Common swing trading tickers for analysis
        tickers = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA", "AMD", "META", "AMZN", "NFLX", "CRM"]
        
        for ticker in tickers[:request.max_opportunities + 2]:  # Get extra in case some fail
            try:
                # Get market data
                data = get_market_data(ticker)
                if data is None or len(data) < 20:
                    continue
                    
                # Check volume threshold
                recent_volume = data['Volume'].tail(5).mean()
                if recent_volume < request.min_volume:
                    continue
                
                # Analyze with OpenAI
                analysis = analyze_with_openai(ticker, data, request.query)
                if not analysis:
                    continue
                
                # Create opportunity
                latest = data.iloc[-1]
                opportunity = TechnicalOpportunity(
                    ticker=ticker,
                    setup_type=analysis.get("setup_type", "unknown"),
                    confidence_score=analysis.get("confidence_score", 0.5),
                    price=float(latest['Close']),
                    volume=int(latest['Volume']),
                    key_indicators=analysis.get("key_indicators", {}),
                    rationale=analysis.get("rationale", "No rationale provided"),
                    timeframe=analysis.get("timeframe", "1-5 days")
                )
                
                opportunities.append(opportunity)
                
                # Stop if we have enough good opportunities
                if len(opportunities) >= request.max_opportunities:
                    break
                    
            except Exception as e:
                logger.error(f"Error analyzing {ticker}: {e}")
                continue
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"OpenAI: Found {len(opportunities)} opportunities in {execution_time:.2f}s")
        
        return ResearchResponse(
            success=True,
            opportunities=opportunities,
            execution_time=execution_time,
            timestamp=datetime.now(),
            message=f"Found {len(opportunities)} opportunities using OpenAI analysis"
        )
        
    except Exception as e:
        logger.error(f"Research error: {e}")
        execution_time = (datetime.now() - start_time).total_seconds()
        
        return ResearchResponse(
            success=False,
            opportunities=[],
            execution_time=execution_time,
            timestamp=datetime.now(),
            message=f"Error during research: {str(e)}"
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Technical Researcher Agent API (OpenAI)",
        "status": "running",
        "note": "This version uses OpenAI for technical analysis",
        "endpoints": {
            "health": "/health",
            "research": "/research"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    port = int(os.getenv("AGENT_PORT", 8001))
    
    logger.info(f"Starting OpenAI Technical Researcher Agent API on {host}:{port}")
    
    uvicorn.run(
        "api_openai:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    ) 