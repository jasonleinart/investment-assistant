# Technical Researcher Agent PRD

## Introduction/Overview
The Technical Researcher Agent is designed to scan the stock market daily for high-value technical setups that are likely to yield profitable options trades. Its output is consumed by an Options Analyst Agent, which further evaluates and implements actionable trades. The agent will learn and adapt its scanning logic over time based on real-world feedback and outcomes.

## Goals
- Consistently identify technical setups with high profit potential for options trading.
- Ensure all surfaced opportunities have sufficient volume and liquidity.
- Adapt scanning logic based on feedback about which setups lead to successful trades.
- Provide structured, machine-readable output for seamless agent-to-agent integration.

## User Stories
- As an Options Analyst Agent, I want to receive a daily list of high-value technical setups so I can evaluate and implement the best trades.
- As a system owner, I want the Technical Researcher Agent to learn from feedback and improve its hit rate over time.
- As a system owner, I want to track the win/loss rate, total gain, and missed opportunities from the agent’s recommendations.

## Functional Requirements
1. The agent must scan the market daily for technical setups suitable for options trading (e.g., breakouts, high RSI, MACD crosses, volume spikes).
2. The agent must filter out setups with insufficient volume or liquidity.
3. The agent must output a structured list of opportunities, including at minimum: ticker, setup type, indicator values, timestamp, price, and volume.
4. The agent must pass its output to the Options Analyst Agent in a format suitable for automated processing (e.g., JSON, DataFrame, or database entry).
5. The agent must log all surfaced opportunities for later review and feedback.
6. The agent must receive and incorporate feedback from the Feedback Agent to improve future scanning logic.
7. The agent must track and report win/loss rate, total gain, and missed opportunities.

## Non-Goals (Out of Scope)
- The agent does not execute trades or make final trade recommendations.
- The agent does not perform in-depth options pricing or risk analysis (handled by the Options Analyst Agent).
- The agent does not interact directly with human users.

## Design Considerations (Optional)
- Output format should be easily extensible (e.g., adding new indicators or metadata).
- Consider modular design for easy integration with new data sources or technical indicators.

## Technical Considerations (Optional)
- Should be able to interface with market data APIs (e.g., Yahoo Finance, Polygon.io).
- Should support batch processing and logging for reproducibility and auditability.

## Success Metrics
- Increase in total portfolio gain attributable to agent-identified setups.
- Improvement in win/loss rate of surfaced opportunities over time.
- Reduction in missed opportunities (setups that would have been profitable but were not surfaced).

## Open Questions
- Which specific technical indicators should be prioritized initially?
- What is the preferred output format for the Options Analyst Agent (JSON, DataFrame, etc.)?
- How should missed opportunities be tracked and defined? 