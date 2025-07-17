#!/usr/bin/env python3
"""
Database Viewer - Simple tool to inspect trading agent database
"""
import sqlite3
import json
from datetime import datetime
from db import SessionLocal, OpportunityDB, OpportunityHistoryDB, AgentActionDB

def view_opportunities(limit=10):
    """View recent opportunities"""
    print("\n🔍 RECENT OPPORTUNITIES")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        opportunities = db.query(OpportunityDB).order_by(OpportunityDB.first_detected.desc()).limit(limit).all()
        
        for opp in opportunities:
            print(f"📈 {opp.ticker} | {opp.setup_type} | {opp.confidence_score:.1%}")
            print(f"   💰 ${opp.price:.2f} | 📅 {opp.first_detected.strftime('%Y-%m-%d %H:%M')}")
            print(f"   🆕 New: {opp.is_new} | 🔄 Updated: {opp.last_updated.strftime('%H:%M') if opp.last_updated else 'Never'}")
            if opp.key_indicators:
                indicators = opp.key_indicators if isinstance(opp.key_indicators, dict) else json.loads(opp.key_indicators)
                print(f"   📊 RSI: {indicators.get('rsi', 'N/A')} | Target: ${indicators.get('target', 'N/A')} | Stop: ${indicators.get('stop_loss', 'N/A')}")
            print()
    finally:
        db.close()

def view_history(limit=5):
    """View opportunity update history"""
    print("\n📜 OPPORTUNITY HISTORY")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        history = db.query(OpportunityHistoryDB).order_by(OpportunityHistoryDB.timestamp.desc()).limit(limit).all()
        
        for h in history:
            print(f"🔄 {h.ticker} | {h.change_type} | {h.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            if hasattr(h, 'price_change') and h.price_change:
                print(f"   💲 Price: {h.old_price:.2f} → {h.new_price:.2f} ({h.price_change:+.2f})")
            if hasattr(h, 'confidence_change') and h.confidence_change:
                print(f"   📊 Confidence: {h.old_confidence:.1%} → {h.new_confidence:.1%} ({h.confidence_change:+.1%})")
            print()
    finally:
        db.close()

def view_agent_actions(limit=5):
    """View agent execution history"""
    print("\n🤖 AGENT ACTIONS")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        actions = db.query(AgentActionDB).order_by(AgentActionDB.timestamp.desc()).limit(limit).all()
        
        for action in actions:
            print(f"⚡ {action.agent_name} | {action.action_type} | {action.timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   ⏱️  {action.execution_time_seconds:.2f}s | 📊 Status: {action.status}")
            if action.opportunities_processed:
                print(f"   📈 Processed: {action.opportunities_processed} | New: {action.new_opportunities or 0}")
            if action.notes:
                print(f"   📝 {action.notes}")
            print()
    finally:
        db.close()

def database_stats():
    """Show database statistics"""
    print("\n📊 DATABASE STATISTICS")
    print("=" * 60)
    
    conn = sqlite3.connect('trading_agent.db')
    cursor = conn.cursor()
    
    # Count opportunities
    cursor.execute("SELECT COUNT(*) FROM opportunities")
    total_opps = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM opportunities WHERE is_new = 1")
    new_opps = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM opportunity_history")
    total_history = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM agent_actions")
    total_actions = cursor.fetchone()[0]
    
    print(f"🎯 Total Opportunities: {total_opps}")
    print(f"🆕 New (Unprocessed): {new_opps}")
    print(f"📜 History Records: {total_history}")
    print(f"🤖 Agent Actions: {total_actions}")
    
    # Recent activity
    cursor.execute("SELECT MAX(first_detected) FROM opportunities")
    last_opportunity = cursor.fetchone()[0]
    if last_opportunity:
        print(f"🕐 Last Opportunity: {last_opportunity}")
    
    cursor.execute("SELECT MAX(timestamp) FROM agent_actions")
    last_action = cursor.fetchone()[0]
    if last_action:
        print(f"⚡ Last Agent Run: {last_action}")
    
    conn.close()

if __name__ == "__main__":
    print("🚀 AGENTIC INVESTING - DATABASE VIEWER")
    print("=" * 60)
    
    database_stats()
    view_opportunities()
    view_history()
    view_agent_actions()
    
    print("\n✅ Database inspection complete!") 