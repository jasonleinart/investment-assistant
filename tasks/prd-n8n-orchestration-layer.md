# n8n Orchestration Layer PRD

## Introduction/Overview
The n8n Orchestration Layer serves as the central coordinator for the agentic investing system, managing the daily pipeline that connects the Technical Researcher Agent, Options Analyst Agent, and Manager/Feedback Agent. It handles scheduling, data flow, error management, monitoring, and auditing for the entire workflow. The system ensures reliable execution before market open on trading days only, with comprehensive logging and failure notifications.

## Goals
- Orchestrate seamless daily execution of the agentic investing pipeline before market open.
- Ensure reliable data flow between all agents with proper error handling and retry logic.
- Provide comprehensive monitoring, logging, and auditing capabilities.
- Enable flexible configuration for different workflows and strategies.
- Maintain high security standards for financial data and API communications.
- Deliver timely notifications for failures and performance issues.

## User Stories
- As a user, I want the workflow to run automatically before market open on trading days so that I receive timely investment recommendations.
- As a user, I want to be notified immediately if any part of the workflow fails so that I can take corrective action.
- As a developer, I want comprehensive logging of all intermediate results so that I can debug issues and audit the system.
- As a user, I want the system to handle temporary agent failures gracefully so that occasional API issues don't break the entire workflow.
- As a user, I want flexible configuration options so that I can adjust the workflow for different strategies or market conditions.

## Functional Requirements

### Core Workflow Management
1. The system must trigger the daily workflow automatically before market open (e.g., 8:30 AM EST).
2. The system must only execute on trading days, automatically skipping weekends and market holidays.
3. The system must call the Technical Researcher Agent API and retrieve market opportunities.
4. The system must pass the technical opportunities to the Options Analyst Agent API for evaluation.
5. The system must send the final recommendations via email to the specified recipient.
6. The system must log all results to the Manager/Feedback Agent API for performance tracking.

### Error Handling & Resilience
7. The system must implement retry logic with exponential backoff for failed API calls (3 retries with 1s, 5s, 15s delays).
8. The system must continue workflow execution if non-critical agents fail (e.g., feedback logging).
9. The system must abort workflow and send error notification if critical agents fail (Technical Researcher or Options Analyst).
10. The system must validate API responses before passing data between agents.
11. The system must handle timeout scenarios for long-running agent operations (30-second timeout per agent).

### Data Management & Auditing
12. The system must store all intermediate results in a structured format for debugging and auditing.
13. The system must include timestamps, workflow IDs, and execution metadata in all stored data.
14. The system must maintain a execution history for at least 90 days.
15. The system must log all API calls, responses, and errors with sufficient detail for troubleshooting.

### Monitoring & Alerting
16. The system must track and store performance metrics (execution time, success rate, agent response times).
17. The system must send email notifications for workflow failures within 5 minutes of failure.
18. The system must generate daily execution summary reports.
19. The system must monitor agent health and availability.

### Security & Authentication
20. The system must use API keys stored in environment variables for agent authentication.
21. The system must encrypt all stored data containing financial information.
22. The system must use HTTPS for all external API communications.
23. The system must not log sensitive information (API keys, personal financial data) in plain text.

### Configuration & Flexibility
24. The system must allow easy configuration of agent endpoints without workflow modification.
25. The system must support multiple workflow variants (daily, weekly, event-driven).
26. The system must allow configuration of email recipients and notification preferences.
27. The system must enable/disable individual agents for testing purposes.

## Non-Goals (Out of Scope)
- Manual workflow triggers (automatic scheduling only)
- Real-time intraday workflows (daily execution only for initial version)
- Advanced scheduling beyond trading day detection (no custom calendar support)
- Integration with brokerage APIs for trade execution (recommendation only)
- Complex user interface beyond email notifications
- Multi-user support (single user system initially)

## Technical Considerations
- **Platform:** n8n workflow automation platform on Hetzner server with EasyPanel
- **Agent Communication:** REST API calls to containerized Python agents
- **Data Storage:** JSON format for intermediate results, PostgreSQL for audit logs
- **Scheduling:** n8n built-in cron scheduler with trading day validation
- **Monitoring:** n8n execution logs plus custom metrics collection
- **Security:** Environment variables for secrets, HTTPS endpoints, encrypted storage
- **Market Calendar:** Integration with `pandas_market_calendars` or similar for trading day detection

## Success Metrics
- **Reliability:** 99%+ successful daily executions over 30-day periods
- **Performance:** Complete workflow execution in under 5 minutes
- **Availability:** Individual agent response times under 30 seconds
- **Notification Speed:** Error alerts delivered within 5 minutes of failure
- **Data Integrity:** 100% of intermediate results successfully stored and retrievable
- **User Satisfaction:** Timely delivery of actionable investment recommendations

## Open Questions
1. Should the system support different execution times for different strategies (e.g., earnings plays vs. technical setups)?
2. What level of detail should be included in the daily execution summary reports?
3. Should there be a backup notification method (SMS, Slack) if email fails?
4. How should the system handle partial agent responses (e.g., Technical Researcher finds only 2 opportunities instead of 5)?
5. Should the workflow support conditional branching based on market conditions (e.g., high volatility days)?
6. What data retention policy should be implemented for stored intermediate results?
7. Should the system include a health check endpoint for monitoring the overall workflow status? 