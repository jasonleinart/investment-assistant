"""
Technical Researcher Agent - Scans market for technical opportunities
"""

import os
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

import yfinance as yf
import pandas as pd
import pandas_ta as ta
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool
from langchain.prompts import ChatPromptTemplate
from langchain.schema import BaseMessage
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TechnicalOpportunity(BaseModel):
    """Structure for a technical trading opportunity"""
    ticker: str
    setup_type: str
    confidence_score: float  # 0-1
    price: float
    volume: int
    key_indicators: Dict[str, Any]
    rationale: str
    timeframe: str = "1-5 days"

class TechnicalResearcherAgent:
    """LangChain-based agent for finding technical trading opportunities"""
    
    def __init__(self, openai_api_key: str):
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            model="gpt-4-turbo-preview",
            temperature=0.1
        )
        self.tools = self._create_tools()
        self.agent = self._create_agent()
        
    def _create_tools(self) -> List[Tool]:
        """Create tools for the agent to use"""
        
        def get_market_data(ticker: str, period: str = "30d") -> str:
            """Fetch market data for a given ticker"""
            try:
                stock = yf.Ticker(ticker)
                data = stock.history(period=period)
                
                if data.empty:
                    return f"No data found for {ticker}"
                
                # Add technical indicators
                data['RSI'] = ta.rsi(data['Close'])
                data['MACD'] = ta.macd(data['Close'])['MACD_12_26_9']
                data['BB_upper'], data['BB_middle'], data['BB_lower'] = ta.bbands(data['Close']).iloc[:, 0], ta.bbands(data['Close']).iloc[:, 1], ta.bbands(data['Close']).iloc[:, 2]
                data['Volume_SMA'] = ta.sma(data['Volume'], length=20)
                
                # Get latest values
                latest = data.iloc[-1]
                prev = data.iloc[-2]
                
                summary = {
                    "ticker": ticker,
                    "current_price": round(latest['Close'], 2),
                    "prev_close": round(prev['Close'], 2),
                    "volume": int(latest['Volume']),
                    "avg_volume": int(latest['Volume_SMA']) if not pd.isna(latest['Volume_SMA']) else 0,
                    "rsi": round(latest['RSI'], 2) if not pd.isna(latest['RSI']) else None,
                    "macd": round(latest['MACD'], 4) if not pd.isna(latest['MACD']) else None,
                    "bb_position": "above_upper" if latest['Close'] > latest['BB_upper'] else "below_lower" if latest['Close'] < latest['BB_lower'] else "middle",
                    "price_change_pct": round(((latest['Close'] - prev['Close']) / prev['Close']) * 100, 2)
                }
                
                return str(summary)
                
            except Exception as e:
                return f"Error fetching data for {ticker}: {str(e)}"
        
        def screen_for_breakouts(min_volume: int = 100000) -> str:
            """Screen for potential breakout candidates"""
            try:
                # Popular tickers to scan (in real implementation, this would be more comprehensive)
                tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'AMD', 'CRM']
                
                candidates = []
                
                for ticker in tickers:
                    try:
                        stock = yf.Ticker(ticker)
                        data = stock.history(period="60d")
                        
                        if len(data) < 20:
                            continue
                            
                        # Add indicators
                        data['RSI'] = ta.rsi(data['Close'])
                        data['Volume_SMA'] = ta.sma(data['Volume'], length=20)
                        
                        latest = data.iloc[-1]
                        
                        # Simple breakout criteria
                        high_20d = data['High'].rolling(20).max().iloc[-2]  # Exclude today
                        volume_spike = latest['Volume'] > (latest['Volume_SMA'] * 1.5) if not pd.isna(latest['Volume_SMA']) else False
                        price_breakout = latest['Close'] > high_20d
                        good_volume = latest['Volume'] > min_volume
                        
                        if price_breakout and volume_spike and good_volume:
                            candidates.append({
                                "ticker": ticker,
                                "price": round(latest['Close'], 2),
                                "volume": int(latest['Volume']),
                                "rsi": round(latest['RSI'], 2) if not pd.isna(latest['RSI']) else None,
                                "breakout_level": round(high_20d, 2)
                            })
                            
                    except Exception as e:
                        logger.warning(f"Error screening {ticker}: {e}")
                        continue
                
                return str(candidates) if candidates else "No breakout candidates found"
                
            except Exception as e:
                return f"Error in breakout screening: {str(e)}"
        
        def analyze_momentum(ticker: str) -> str:
            """Analyze momentum indicators for a specific ticker"""
            try:
                stock = yf.Ticker(ticker)
                data = stock.history(period="90d")
                
                if len(data) < 30:
                    return f"Insufficient data for {ticker}"
                
                # Add momentum indicators
                data['RSI'] = ta.rsi(data['Close'], length=14)
                data['MACD'] = ta.macd(data['Close'])['MACD_12_26_9']
                data['MACD_signal'] = ta.macd(data['Close'])['MACDs_12_26_9']
                data['ADX'] = ta.adx(data['High'], data['Low'], data['Close'])['ADX_14']
                
                latest = data.iloc[-1]
                
                analysis = {
                    "ticker": ticker,
                    "rsi": round(latest['RSI'], 2) if not pd.isna(latest['RSI']) else None,
                    "macd": round(latest['MACD'], 4) if not pd.isna(latest['MACD']) else None,
                    "macd_signal": round(latest['MACD_signal'], 4) if not pd.isna(latest['MACD_signal']) else None,
                    "adx": round(latest['ADX'], 2) if not pd.isna(latest['ADX']) else None,
                    "momentum_score": "strong" if latest['RSI'] > 60 and latest['MACD'] > latest['MACD_signal'] else "weak"
                }
                
                return str(analysis)
                
            except Exception as e:
                return f"Error analyzing momentum for {ticker}: {str(e)}"
        
        return [
            Tool(
                name="get_market_data",
                description="Get current market data and technical indicators for a specific ticker",
                func=get_market_data
            ),
            Tool(
                name="screen_for_breakouts", 
                description="Screen market for potential breakout opportunities with volume confirmation",
                func=screen_for_breakouts
            ),
            Tool(
                name="analyze_momentum",
                description="Analyze momentum indicators (RSI, MACD, ADX) for a specific ticker",
                func=analyze_momentum
            )
        ]
    
    def _create_agent(self) -> AgentExecutor:
        """Create the LangChain agent"""
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a Technical Researcher Agent specialized in finding high-value technical trading setups for options trading.

Your goal is to:
1. Screen the market for technical opportunities with strong volume
2. Analyze each opportunity for options trading potential
3. Provide structured output with clear rationale

Focus on:
- Breakouts with volume confirmation
- Momentum shifts (RSI, MACD)
- High volume relative to average
- Clear technical patterns

For each opportunity, provide:
- Ticker symbol
- Setup type (breakout, momentum, reversal, etc.)
- Confidence score (0-1)
- Key technical indicators
- Clear rationale for why this is actionable for options trading

Be selective - quality over quantity. Only recommend setups with strong conviction."""),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}")
        ])
        
        agent = create_openai_tools_agent(self.llm, self.tools, prompt)
        return AgentExecutor(agent=agent, tools=self.tools, verbose=True)
    
    def find_opportunities(self, max_opportunities: int = 5) -> List[TechnicalOpportunity]:
        """Main method to find technical trading opportunities"""
        
        query = f"""
        Find up to {max_opportunities} high-quality technical trading opportunities for options trading.
        
        Process:
        1. First, screen for breakout candidates with volume confirmation
        2. For promising candidates, get detailed market data and momentum analysis
        3. Evaluate each for options trading potential
        4. Rank by confidence and return the best opportunities
        
        Focus on setups that would work well for options strategies (directional moves, volatility plays, etc.).
        """
        
        try:
            result = self.agent.invoke({"input": query})
            
            # Parse the result and structure it
            # In a real implementation, you'd want more sophisticated parsing
            opportunities = self._parse_agent_output(result.get("output", ""))
            
            return opportunities[:max_opportunities]
            
        except Exception as e:
            logger.error(f"Error finding opportunities: {e}")
            return []
    
    def _parse_agent_output(self, output: str) -> List[TechnicalOpportunity]:
        """Parse agent output into structured opportunities"""
        # This is a simplified parser - in production you'd want more robust parsing
        opportunities = []
        
        # For now, return a sample opportunity to test the structure
        sample_opportunity = TechnicalOpportunity(
            ticker="SAMPLE",
            setup_type="breakout",
            confidence_score=0.75,
            price=150.00,
            volume=1000000,
            key_indicators={"rsi": 65, "macd": 0.5},
            rationale="Strong breakout above 20-day high with volume confirmation. RSI showing strength but not overbought."
        )
        
        opportunities.append(sample_opportunity)
        return opportunities


if __name__ == "__main__":
    # Test the agent
    from dotenv import load_dotenv
    load_dotenv()
    
    agent = TechnicalResearcherAgent(os.getenv("OPENAI_API_KEY"))
    opportunities = agent.find_opportunities(max_opportunities=3)
    
    print("Found opportunities:")
    for opp in opportunities:
        print(f"- {opp.ticker}: {opp.setup_type} (confidence: {opp.confidence_score})") 