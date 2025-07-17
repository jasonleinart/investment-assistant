#!/usr/bin/env python3
"""
Simple Database Viewer - Direct SQL approach
"""
import sqlite3
import json
from datetime import datetime

def show_database_contents():
    """Show all database contents with SQL queries"""
    print("🚀 AGENTIC INVESTING - DATABASE CONTENTS")
    print("=" * 70)
    
    conn = sqlite3.connect('trading_agent.db')
    cursor = conn.cursor()
    
    # 1. OPPORTUNITIES
    print("\n📈 OPPORTUNITIES")
    print("-" * 50)
    cursor.execute("""
        SELECT ticker, setup_type, confidence_score, price, 
               first_detected, is_new, key_indicators
        FROM opportunities 
        ORDER BY first_detected DESC
    """)
    
    for row in cursor.fetchall():
        ticker, setup_type, confidence, price, detected, is_new, indicators = row
        print(f"🎯 {ticker} | {setup_type} | {confidence:.1%} confidence")
        print(f"   💰 ${price:.2f} | 📅 {detected} | 🆕 New: {bool(is_new)}")
        
        if indicators:
            try:
                ind_data = json.loads(indicators) if isinstance(indicators, str) else indicators
                rsi = ind_data.get('rsi', 'N/A')
                target = ind_data.get('target', 'N/A')
                stop = ind_data.get('stop_loss', 'N/A')
                print(f"   📊 RSI: {rsi} | Target: {target} | Stop: {stop}")
            except:
                print(f"   📊 Indicators: {str(indicators)[:50]}...")
        print()
    
    # 2. HISTORY
    print("\n📜 OPPORTUNITY HISTORY")
    print("-" * 50)
    cursor.execute("""
        SELECT h.timestamp, h.field_name, h.old_value, h.new_value, h.change_type,
               o.ticker
        FROM opportunity_history h
        JOIN opportunities o ON h.opportunity_id = o.id
        ORDER BY h.timestamp DESC
        LIMIT 10
    """)
    
    history_rows = cursor.fetchall()
    if history_rows:
        for row in history_rows:
            timestamp, field, old_val, new_val, change_type, ticker = row
            print(f"🔄 {ticker} | {change_type} | {field}")
            print(f"   📅 {timestamp}")
            print(f"   🔀 {old_val} → {new_val}")
            print()
    else:
        print("   📭 No history records yet")
    
    # 3. AGENT ACTIONS
    print("\n🤖 AGENT ACTIONS")
    print("-" * 50)
    cursor.execute("""
        SELECT agent_name, action_type, timestamp, 
               opportunities_processed, new_opportunities, 
               execution_time_seconds, status, notes
        FROM agent_actions 
        ORDER BY timestamp DESC
        LIMIT 5
    """)
    
    for row in cursor.fetchall():
        agent, action, timestamp, processed, new_count, exec_time, status, notes = row
        print(f"⚡ {agent} | {action} | {status}")
        print(f"   📅 {timestamp}")
        exec_time_str = f"{exec_time:.2f}s" if exec_time else "N/A"
        processed_str = str(processed) if processed else "N/A"
        new_count_str = str(new_count) if new_count else "N/A"
        print(f"   ⏱️  {exec_time_str} | 📊 Processed: {processed_str} | 🆕 New: {new_count_str}")
        if notes:
            print(f"   📝 {notes}")
        print()
    
    # 4. STATISTICS
    print("\n📊 DATABASE STATISTICS")
    print("-" * 50)
    
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
    
    conn.close()
    print("\n✅ Database inspection complete!")

if __name__ == "__main__":
    show_database_contents() 