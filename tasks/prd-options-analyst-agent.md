# Options Analyst Agent PRD

## Introduction/Overview
The Options Analyst Agent receives a list of technical setups from the Technical Researcher Agent and evaluates each for options trading. It analyzes each opportunity, determines the most suitable options strategy, assesses risk/reward, estimates probability of profit, and filters out setups that are not actionable. The agent considers your current holdings and available cash to ensure recommendations are appropriate for your portfolio. The output is a detailed email with a recommended trade and justification. The agent learns and adapts over time based on feedback from the Manager/Feedback Agent, with the primary goal of maximizing risk-adjusted returns.

## Goals
- Maximize risk-adjusted returns from options trading.
- Provide actionable, well-justified options trade recommendations.
- Ensure recommendations are tailored to your current portfolio and available cash.
- Continuously improve strategy selection and filtering based on real-world feedback.

## User Stories
- As a system owner, I want to receive daily (or as available) emails with actionable options trade recommendations, including comprehensive details and rationale.
- As a system owner, I want the agent to consider my current holdings and cash when making recommendations.
- As a system owner, I want the agent to learn from feedback and improve its recommendations over time.

## Functional Requirements
1. The agent must receive structured input from the Technical Researcher Agent, including ticker, setup type, indicator values, price, volume, etc.
2. The agent must analyze each opportunity and determine the most suitable options strategy (calls, puts, spreads, straddles, iron condors, etc.).
3. The agent must assess risk/reward, estimate probability of profit, and filter out non-actionable setups (e.g., illiquid options, insufficient risk/reward).
4. The agent must consider your current holdings and available cash when making recommendations.
5. The agent must output a detailed email for each recommended trade, including:
   - Ticker and setup details
   - Recommended options strategy (type, strike, expiry, etc.)
   - Rationale and justification
   - Risk/reward analysis
   - Position sizing based on available cash and risk
6. The agent must log all recommendations and outcomes for later review and feedback.
7. The agent must incorporate feedback from the Manager/Feedback Agent to improve future recommendations.
8. The agent must run whenever it receives input from the Technical Researcher Agent.

## Non-Goals (Out of Scope)
- The agent does not execute trades.
- The agent does not perform technical setup discovery (handled by the Technical Researcher Agent).
- The agent does not interact directly with human users outside of sending email recommendations.

## Design Considerations (Optional)
- Output format and input format should be coordinated with the Technical Researcher Agent for seamless integration.
- Email output should be clear, actionable, and easy to understand.
- Modular design to allow for easy updates to strategy logic or risk models.

## Technical Considerations (Optional)
- Should be able to interface with brokerage APIs or data sources to check current holdings and cash.
- Should support integration with feedback mechanisms for continuous learning.

## Success Metrics
- Maximized risk-adjusted return (e.g., Sharpe ratio) from recommended trades.
- Improvement in win/loss rate and average profit per trade over time.
- Demonstrated learning and adaptation based on feedback.

## Open Questions
- What is the preferred email format and delivery method?
- How should the agent handle multiple simultaneous opportunities (e.g., recommend all, or prioritize)?
- What is the minimum threshold for risk/reward or probability of profit to recommend a trade? 