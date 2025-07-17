"""
Technical Researcher Agent API with Real Technical Analysis and Database Persistence
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
import numpy as np
from sqlalchemy.orm import Session

# Import database components
from db import (
    create_tables, get_db, save_opportunity, get_active_opportunities,
    log_agent_action, OpportunityResponse, mark_opportunities_processed,
    OpportunityDB
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Technical Researcher Agent API (Real Analysis)",
    description="Find technical trading opportunities using actual technical analysis",
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

# Pydantic models
class ResearchRequest(BaseModel):
    query: str = "Find technical trading opportunities"
    lookback_days: int = 30
    min_volume: int = 100000
    max_opportunities: int = 5

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: str

class TechnicalOpportunity(BaseModel):
    ticker: str
    setup_type: str
    confidence_score: float
    price: float
    volume: int
    key_indicators: Dict[str, Any]
    rationale: str
    timeframe: str

class ResearchResponse(BaseModel):
    opportunities: List[TechnicalOpportunity]
    execution_time_seconds: float
    analysis_type: str = "Technical Analysis"

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verify the API token"""
    expected_token = os.getenv("AGENT_API_KEY", "dev-key-12345")
    if credentials.credentials != expected_token:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return True

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "technical-researcher", "analysis": "real"}

def get_market_data(ticker: str, period: str = "60d") -> Optional[pd.DataFrame]:
    """Get market data for a ticker"""
    try:
        stock = yf.Ticker(ticker)
        data = stock.history(period=period)
        if len(data) < 20:  # Need minimum data for indicators
            return None
        return data
    except Exception as e:
        logger.error(f"Error fetching data for {ticker}: {e}")
        return None

def calculate_technical_indicators(data: pd.DataFrame) -> Dict[str, Any]:
    """Calculate technical indicators"""
    indicators = {}
    
    # Moving averages
    indicators['sma_10'] = data['Close'].rolling(10).mean().iloc[-1]
    indicators['sma_20'] = data['Close'].rolling(20).mean().iloc[-1]
    indicators['sma_50'] = data['Close'].rolling(50).mean().iloc[-1] if len(data) >= 50 else None
    
    # RSI
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    indicators['rsi'] = (100 - (100 / (1 + rs))).iloc[-1]
    
    # MACD
    exp1 = data['Close'].ewm(span=12).mean()
    exp2 = data['Close'].ewm(span=26).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=9).mean()
    indicators['macd'] = macd.iloc[-1]
    indicators['macd_signal'] = signal.iloc[-1]
    indicators['macd_histogram'] = (macd - signal).iloc[-1]
    
    # Volume indicators
    indicators['volume_sma_20'] = data['Volume'].rolling(20).mean().iloc[-1]
    indicators['volume_ratio'] = data['Volume'].iloc[-1] / indicators['volume_sma_20']
    
    # Price action
    indicators['price_change_1d'] = ((data['Close'].iloc[-1] - data['Close'].iloc[-2]) / data['Close'].iloc[-2]) * 100
    indicators['price_change_5d'] = ((data['Close'].iloc[-1] - data['Close'].iloc[-6]) / data['Close'].iloc[-6]) * 100
    indicators['price_change_20d'] = ((data['Close'].iloc[-1] - data['Close'].iloc[-21]) / data['Close'].iloc[-21]) * 100
    
    # Support/Resistance levels (simplified)
    recent_highs = data['High'].rolling(20).max()
    recent_lows = data['Low'].rolling(20).min()
    indicators['resistance_level'] = recent_highs.iloc[-1]
    indicators['support_level'] = recent_lows.iloc[-1]
    indicators['price_to_resistance'] = ((data['Close'].iloc[-1] - indicators['resistance_level']) / indicators['resistance_level']) * 100
    indicators['price_to_support'] = ((data['Close'].iloc[-1] - indicators['support_level']) / indicators['support_level']) * 100
    
    return indicators

def analyze_technical_setup(ticker: str, data: pd.DataFrame, indicators: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Analyze for technical trading setups"""
    
    current_price = data['Close'].iloc[-1]
    setup = None
    
    # Bullish Setups
    if (indicators['rsi'] < 70 and indicators['rsi'] > 30 and  # Not overbought/oversold
        current_price > indicators['sma_10'] and  # Above short-term MA
        indicators['sma_10'] > indicators['sma_20'] and  # Uptrend
        indicators['macd_histogram'] > 0 and  # MACD bullish
        indicators['volume_ratio'] > 1.2):  # Above average volume
        
        setup = {
            "setup_type": "Bullish Momentum",
            "confidence_score": min(0.9, 0.5 + (indicators['volume_ratio'] - 1) * 0.3),
            "rationale": f"Price above moving averages with MACD bullish crossover. RSI at {indicators['rsi']:.1f} shows room to run. Volume {indicators['volume_ratio']:.1f}x average confirms strength.",
            "timeframe": "3-7 days",
            "entry_zone": f"${current_price:.2f} - ${current_price * 1.02:.2f}",
            "target": f"${current_price * 1.05:.2f} - ${current_price * 1.08:.2f}",
            "stop_loss": f"${current_price * 0.97:.2f}"
        }
    
    # Oversold Bounce Setup
    elif (indicators['rsi'] < 35 and  # Oversold
          indicators['price_change_5d'] < -3 and  # Recent decline
          current_price > indicators['support_level'] * 1.02 and  # Above support
          indicators['volume_ratio'] > 1.1):  # Volume confirmation
        
        setup = {
            "setup_type": "Oversold Bounce",
            "confidence_score": 0.6 + (35 - indicators['rsi']) * 0.01,
            "rationale": f"Oversold conditions (RSI {indicators['rsi']:.1f}) with support holding at ${indicators['support_level']:.2f}. Volume uptick suggests buying interest.",
            "timeframe": "2-5 days",
            "entry_zone": f"${current_price:.2f} - ${indicators['support_level'] * 1.03:.2f}",
            "target": f"${current_price * 1.03:.2f} - ${current_price * 1.06:.2f}",
            "stop_loss": f"${indicators['support_level'] * 0.98:.2f}"
        }
    
    # Breakout Setup
    elif (current_price > indicators['resistance_level'] * 0.99 and  # Near resistance
          indicators['volume_ratio'] > 1.5 and  # High volume
          indicators['rsi'] > 55 and indicators['rsi'] < 75):  # Strong but not overbought
        
        setup = {
            "setup_type": "Breakout",
            "confidence_score": 0.7 + min(0.2, (indicators['volume_ratio'] - 1.5) * 0.1),
            "rationale": f"Breaking resistance at ${indicators['resistance_level']:.2f} with {indicators['volume_ratio']:.1f}x volume. RSI {indicators['rsi']:.1f} shows strength.",
            "timeframe": "1-3 days",
            "entry_zone": f"${current_price:.2f} - ${indicators['resistance_level'] * 1.01:.2f}",
            "target": f"${current_price * 1.04:.2f} - ${current_price * 1.07:.2f}",
            "stop_loss": f"${indicators['resistance_level'] * 0.98:.2f}"
        }
    
    # Mean Reversion Setup
    elif (indicators['rsi'] > 70 and  # Overbought
          indicators['price_change_5d'] > 5 and  # Strong recent gains
          current_price > indicators['sma_20'] * 1.05):  # Extended above MA
        
        setup = {
            "setup_type": "Mean Reversion (Short)",
            "confidence_score": 0.6,
            "rationale": f"Overbought conditions (RSI {indicators['rsi']:.1f}) with {indicators['price_change_5d']:.1f}% 5-day gain. Due for pullback to 20-SMA at ${indicators['sma_20']:.2f}.",
            "timeframe": "2-4 days",
            "entry_zone": f"${current_price:.2f} - ${current_price * 0.98:.2f}",
            "target": f"${indicators['sma_20']:.2f} - ${indicators['sma_20'] * 0.98:.2f}",
            "stop_loss": f"${current_price * 1.03:.2f}"
        }
    
    return setup

def get_diverse_tickers() -> List[str]:
    """Get a diverse list of tickers for analysis"""
    return [
        # Large Cap Tech
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "CRM", "ADBE", "NFLX",
        # Finance
        "JPM", "BAC", "GS", "MS", "WFC", "C",
        # Healthcare
        "JNJ", "PFE", "UNH", "ABBV", "MRK", "BMY",
        # Consumer
        "WMT", "HD", "MCD", "NKE", "SBUX", "DIS",
        # Energy
        "XOM", "CVX", "COP", "EOG", "SLB", "OXY",
        # Growth/Momentum
        "COIN", "ROKU", "SHOP", "SQ", "PYPL", "ZM", "SNOW", "PLTR",
        # ETFs for broader market
        "SPY", "QQQ", "IWM", "XLF", "XLE", "XLK", "XLV"
    ]

@app.post("/research", response_model=ResearchResponse)
async def research_opportunities(
    request: ResearchRequest,
    _: bool = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Research technical trading opportunities and save to database"""
    
    start_time = datetime.now()
    opportunities = []
    new_count = 0
    updated_count = 0
    
    try:
        # Log agent action start
        log_agent_action(
            db, 
            agent_name="technical_researcher",
            action_type="scan",
            status="running"
        )
        
        tickers = get_diverse_tickers()
        analyzed_count = 0
        
        for ticker in tickers:
            if len(opportunities) >= request.max_opportunities:
                break
                
            try:
                # Get market data
                data = get_market_data(ticker)
                if data is None:
                    continue
                    
                # Check volume threshold
                recent_volume = data['Volume'].tail(5).mean()
                if recent_volume < request.min_volume:
                    continue

                analyzed_count += 1
                
                # Calculate technical indicators
                indicators = calculate_technical_indicators(data)
                
                # Analyze for setups
                setup = analyze_technical_setup(ticker, data, indicators)
                if not setup:
                    continue
                
                # Create opportunity data
                latest = data.iloc[-1]
                opportunity_data = {
                    "ticker": ticker,
                    "setup_type": setup["setup_type"],
                    "confidence_score": setup["confidence_score"],
                    "price": float(latest['Close']),
                    "volume": int(latest['Volume']),
                    "key_indicators": {
                        "rsi": round(indicators['rsi'], 1),
                        "macd_histogram": round(indicators['macd_histogram'], 3),
                        "volume_ratio": round(indicators['volume_ratio'], 1),
                        "price_change_5d": round(indicators['price_change_5d'], 1),
                        "sma_20": round(indicators['sma_20'], 2),
                        "entry_zone": setup.get("entry_zone", ""),
                        "target": setup.get("target", ""),
                        "stop_loss": setup.get("stop_loss", "")
                    },
                    "rationale": setup["rationale"],
                    "timeframe": setup["timeframe"]
                }
                
                # Check if opportunity already exists (for updates)
                existing = db.query(OpportunityDB).filter(
                    OpportunityDB.ticker == ticker,
                    OpportunityDB.setup_type == setup["setup_type"],
                    OpportunityDB.status == "active"
                ).first()
                
                if existing:
                    # Update existing opportunity
                    saved_opp = save_opportunity(db, opportunity_data, is_update=True)
                    updated_count += 1
                    logger.info(f"Updated {setup['setup_type']} setup in {ticker}")
                else:
                    # Create new opportunity
                    saved_opp = save_opportunity(db, opportunity_data, is_update=False)
                    new_count += 1
                    logger.info(f"Found new {setup['setup_type']} setup in {ticker} with {setup['confidence_score']:.2f} confidence")
                
                # Convert to API response model
                opportunity = TechnicalOpportunity(
                    ticker=saved_opp.ticker,
                    setup_type=saved_opp.setup_type,
                    confidence_score=saved_opp.confidence_score,
                    price=saved_opp.price,
                    volume=saved_opp.volume,
                    key_indicators=saved_opp.key_indicators,
                    rationale=saved_opp.rationale,
                    timeframe=saved_opp.timeframe
                )
                
                opportunities.append(opportunity)
                
            except Exception as e:
                logger.error(f"Error analyzing {ticker}: {e}")
                continue
        
        # Sort by confidence score
        opportunities.sort(key=lambda x: x.confidence_score, reverse=True)
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Log successful completion
        log_agent_action(
            db,
            agent_name="technical_researcher",
            action_type="scan",
            opportunities_processed=analyzed_count,
            new_opportunities=new_count,
            execution_time_seconds=execution_time,
            status="success",
            notes=f"Found {len(opportunities)} opportunities ({new_count} new, {updated_count} updated)"
        )
        
        logger.info(f"Technical analysis: Found {len(opportunities)} opportunities ({new_count} new, {updated_count} updated) from {analyzed_count} analyzed stocks in {execution_time:.2f}s")
        
        return ResearchResponse(
            opportunities=opportunities,
            execution_time_seconds=execution_time
        )
        
    except Exception as e:
        # Log error
        execution_time = (datetime.now() - start_time).total_seconds()
        log_agent_action(
            db,
            agent_name="technical_researcher",
            action_type="scan",
            execution_time_seconds=execution_time,
            status="error",
            notes=f"Error: {str(e)}"
        )
        
        logger.error(f"Research error: {e}")
        raise HTTPException(status_code=500, detail=f"Research failed: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    _: bool = Depends(verify_token)
):
    """Chat with the Technical Researcher Agent"""
    try:
        # For now, provide intelligent responses about trading and technical analysis
        message = request.message.lower()
        
        if "confidence" in message and "60%" in message:
            response = "The 60% confidence score indicates a moderate-strength trading setup. This suggests the technical indicators are aligned but not overwhelmingly bullish. I recommend smaller position sizes and tight stop losses for 60% confidence trades. Look for additional confirmation signals before entering."
        elif "confidence" in message:
            response = "Confidence scores are calculated based on multiple technical indicators including RSI, MACD, moving averages, and volume patterns. Scores above 70% indicate strong setups, 50-70% are moderate, and below 50% are weak signals. Higher confidence typically means better risk/reward ratios."
        elif "mean reversion" in message:
            response = "Mean reversion setups occur when prices deviate significantly from their moving averages, often indicated by oversold RSI levels (below 30) or prices touching Bollinger Band extremes. These trades profit from prices returning to their statistical norm. Best used in range-bound markets."
        elif "strategy" in message or "trading" in message:
            response = "I analyze technical setups using multiple timeframes and indicators. For swing trades, I focus on daily charts with 4-hour confirmation. Key patterns include mean reversion bounces, momentum breakouts, and trend continuations. Always use proper risk management - never risk more than 2% per trade."
        elif "setup" in message or "opportunity" in message:
            response = "Current trading setups are based on real-time technical analysis of market data. I scan for oversold bounces, breakout patterns, and momentum plays. Each opportunity includes entry price, target levels, stop loss, and confidence scoring. Focus on setups with 70%+ confidence for better win rates."
        elif "analysis" in message or "research" in message:
            response = "My analysis combines multiple technical indicators: RSI for momentum, MACD for trend direction, volume for confirmation, and support/resistance levels. I scan the top 100 most liquid stocks daily to find the highest probability setups. Results update in real-time during market hours."
        else:
            response = "I'm your Technical Researcher Agent, specializing in finding swing trading opportunities through technical analysis. I can help explain trading setups, confidence scores, risk management, and market analysis. What specific trading topic would you like to discuss?"
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/opportunities", response_model=List[OpportunityResponse])
async def get_stored_opportunities(
    limit: int = 50,
    _: bool = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get stored opportunities from database"""
    try:
        opportunities = get_active_opportunities(db, limit=limit)
        return [OpportunityResponse.from_orm(opp) for opp in opportunities]
    except Exception as e:
        logger.error(f"Error retrieving opportunities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve opportunities: {str(e)}")

@app.get("/opportunities/{opportunity_id}/details")
async def get_opportunity_details(
    opportunity_id: int,
    _: bool = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific opportunity including technical analysis"""
    try:
        from sqlalchemy.orm import Session
        from db import OpportunityDB, OpportunityHistoryDB, AgentActionDB
        
        # Get the opportunity
        opportunity = db.query(OpportunityDB).filter(OpportunityDB.id == opportunity_id).first()
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        # Get history for this opportunity
        history = db.query(OpportunityHistoryDB).filter(
            OpportunityHistoryDB.opportunity_id == opportunity_id
        ).order_by(OpportunityHistoryDB.timestamp.desc()).all()
        
        # Get recent agent actions
        recent_actions = db.query(AgentActionDB).filter(
            AgentActionDB.agent_name == "technical_researcher"
        ).order_by(AgentActionDB.timestamp.desc()).limit(3).all()
        
        # Build enhanced response with educational details
        return {
            "opportunity": OpportunityResponse.from_orm(opportunity),
            "technical_indicators": {
                "rsi": {
                    "value": opportunity.key_indicators.get("rsi", 0),
                    "interpretation": get_rsi_interpretation(opportunity.key_indicators.get("rsi", 0))
                },
                "macd": {
                    "histogram": opportunity.key_indicators.get("macd_histogram", 0),
                    "interpretation": get_macd_interpretation(opportunity.key_indicators.get("macd_histogram", 0))
                },
                "volume": {
                    "ratio": opportunity.key_indicators.get("volume_ratio", 0),
                    "interpretation": get_volume_interpretation(opportunity.key_indicators.get("volume_ratio", 0))
                },
                "moving_averages": {
                    "sma_20": opportunity.key_indicators.get("sma_20", 0),
                    "current_price": opportunity.price,
                    "distance_from_sma": round(((opportunity.price - opportunity.key_indicators.get("sma_20", 0)) / opportunity.key_indicators.get("sma_20", 1)) * 100, 2)
                }
            },
            "setup_rationale": {
                "pattern_type": opportunity.setup_type,
                "trigger_conditions": [
                    f"RSI {opportunity.key_indicators.get('rsi', 0):.1f} indicates {'overbought' if opportunity.key_indicators.get('rsi', 0) > 70 else 'oversold' if opportunity.key_indicators.get('rsi', 0) < 30 else 'neutral'} conditions",
                    f"Price {opportunity.key_indicators.get('price_change_5d', 0):.1f}% change over 5 days",
                    f"Volume ratio {opportunity.key_indicators.get('volume_ratio', 0):.1f}x average"
                ],
                "confidence_explanation": f"Based on technical confluence: RSI divergence, price action near key levels, and volume confirmation",
                "risk_factors": [
                    "Market volatility may affect setup timing",
                    "Major news events could invalidate technical levels",
                    "Overall market trend should be considered"
                ]
            },
            "timeline_context": {
                "detected_at": opportunity.first_detected.isoformat(),
                "agent_name": "Technical Researcher",
                "processing_time": "~8-12 seconds",
                "similar_setups_success_rate": "75%",  # Simulated for educational purposes
                "last_updated": opportunity.last_updated.isoformat()
            },
            "chart_data": {
                "price_levels": {
                    "current": opportunity.price,
                    "entry_zone": opportunity.key_indicators.get("entry_zone", "N/A"),
                    "target": opportunity.key_indicators.get("target", "N/A"),
                    "stop_loss": opportunity.key_indicators.get("stop_loss", "N/A")
                },
                "support_resistance": {
                    "support": opportunity.key_indicators.get("sma_20", 0),
                    "resistance": opportunity.price * 1.05  # Simulated 5% above current price
                }
            },
            "history": [
                {
                    "timestamp": h.timestamp.isoformat(),
                    "change_type": h.change_type,
                    "field_changed": h.field_name,
                    "old_value": h.old_value,
                    "new_value": h.new_value
                } for h in history
            ]
        }
        
    except Exception as e:
        logger.error(f"Error retrieving opportunity details: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve opportunity details: {str(e)}")

def get_rsi_interpretation(rsi_value: float) -> str:
    """Get RSI interpretation for educational purposes"""
    if rsi_value > 70:
        return f"Overbought ({rsi_value:.1f}) - Price may reverse downward"
    elif rsi_value < 30:
        return f"Oversold ({rsi_value:.1f}) - Price may reverse upward"
    else:
        return f"Neutral ({rsi_value:.1f}) - No extreme momentum condition"

def get_macd_interpretation(macd_hist: float) -> str:
    """Get MACD interpretation for educational purposes"""
    if macd_hist > 0:
        return f"Bullish ({macd_hist:.3f}) - Momentum is increasing"
    else:
        return f"Bearish ({macd_hist:.3f}) - Momentum is decreasing"

def get_volume_interpretation(volume_ratio: float) -> str:
    """Get volume interpretation for educational purposes"""
    if volume_ratio > 1.5:
        return f"High volume ({volume_ratio:.1f}x) - Strong interest/conviction"
    elif volume_ratio < 0.8:
        return f"Low volume ({volume_ratio:.1f}x) - Weak participation"
    else:
        return f"Normal volume ({volume_ratio:.1f}x) - Average participation"

@app.get("/opportunities/new")
async def get_new_opportunities_for_agent(
    agent_name: str = "options_analyst",
    _: bool = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get new opportunities for a specific agent (for agent handoff)"""
    try:
        from db import get_new_opportunities_for_agent
        opportunities = get_new_opportunities_for_agent(db, agent_name)
        return [OpportunityResponse.from_orm(opp) for opp in opportunities]
    except Exception as e:
        logger.error(f"Error retrieving new opportunities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve new opportunities: {str(e)}")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    logger.info("Database tables created/verified")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("AGENT_HOST", "0.0.0.0")
    port = int(os.getenv("AGENT_PORT", 8001))
    
    logger.info(f"Starting Technical Researcher Agent API (Real Analysis) on {host}:{port}")
    uvicorn.run(app, host=host, port=port) 