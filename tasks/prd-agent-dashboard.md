# Agent Dashboard & Interaction Interface PRD

## Introduction/Overview
The Agent Dashboard is a unified web interface for interacting with the agentic investing system. It provides a single place to view all outputs from the Technical Researcher, Options Analyst, and Manager/Feedback agents, and enables direct, conversational interaction with the Analyst agent. The dashboard will display opportunities, recommendations, analysis, and performance metrics, supporting both daily workflow review and interactive exploration. The initial version is for personal use but should be designed with future productization in mind.

## Goals
- Centralize all agent outputs (opportunities, recommendations, analysis, metrics) in one interface.
- Enable chat-based interaction with the Analyst agent for deeper insights and strategy discussion.
- Track and visualize performance metrics and adaptive learning over time.
- Lay the foundation for a productizable, multi-user dashboard in the future.

## User Stories
- As a user, I want to see all technical opportunities and options recommendations in one place so I can quickly review the daily pipeline.
- As a user, I want to chat with the Analyst agent about specific recommendations or options strategies to understand the rationale and implementation details.
- As a user, I want to track the historical performance of agent recommendations (win/loss, P&L, etc.) so I can measure system effectiveness.
- As a user, I want to see feedback and adaptive learning in action so I know the system is improving over time.

## Functional Requirements
1. The dashboard must display a list/table of all current opportunities and recommendations from the Technical Researcher and Options Analyst agents.
2. The dashboard must provide a chat interface to interact with the Analyst agent, allowing:
   - Freeform questions about recommendations, strategies, and rationale
   - Follow-up questions about specific trades or setups
3. The dashboard must show historical performance metrics, including:
   - Win/loss rate
   - Total and average P&L
   - Missed opportunities
   - Feedback/adaptive learning indicators
4. The dashboard must allow viewing detailed analysis for each opportunity (e.g., technical indicators, Analyst rationale, recommended strategy).
5. The dashboard must update daily with new agent outputs and retain historical data for review.
6. The dashboard must handle and display errors gracefully (e.g., agent API down, no opportunities found).
7. The dashboard must be designed for single-user use initially, but with extensibility for future multi-user support.
8. The dashboard must be visually clear and easy to use, with a simple, modern UI (table views, chat sidebar, basic charts).

## Non-Goals (Out of Scope)
- Trade execution or brokerage integration
- Real-time intraday updates (daily refresh only for v1)
- Mobile app or advanced multi-user features (v1 is desktop/web, single user)
- Complex user management or permissions

## Design Considerations (Optional)
- Use a modular frontend framework (e.g., React, Streamlit, or similar) for easy extensibility.
- Consider a chat sidebar for Analyst interaction and a main panel for opportunities and metrics.
- Use color and simple charts to highlight performance trends and key stats.

## Technical Considerations (Optional)
- Integrate with existing agent APIs (REST endpoints for Technical Researcher, Options Analyst, Manager/Feedback).
- Store historical data locally (SQLite, JSON, or simple DB) for performance tracking.
- Use environment variables for API keys and configuration.
- Plan for future multi-user support (user IDs, session management).

## Success Metrics
- User can see all daily opportunities and recommendations in one place.
- User can chat with the Analyst agent and receive relevant, contextual responses.
- Performance metrics are visible and update over time.
- System handles errors gracefully and is easy to use.

## Open Questions
- What frontend framework/library is preferred for the initial build (React, Streamlit, etc.)?
- What is the minimum set of performance metrics to display in v1?
- Should Analyst chat history be persistent or session-based?
- What data storage approach is best for historical results (local file, DB, cloud)? 