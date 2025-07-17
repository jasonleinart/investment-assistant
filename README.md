# Agentic Investing System

A multi-agent investing system for swing trading and options analysis with technical analysis and interactive dashboard.

## Directory Structure

```
Investing/                    # Main workspace (always run commands from here)
├── backend/                  # Python APIs and agents
│   ├── api_technical.py     # Real technical analysis API
│   ├── api_openai.py        # OpenAI-powered analysis
│   ├── api_simple.py        # Mock data API
│   └── requirements.txt     # Python dependencies
├── frontend/                 # React dashboard
│   ├── src/                 # React components
│   ├── package.json         # Node dependencies
│   └── ...                  # Vite/React configuration
├── start_backend.sh         # Backend startup script
├── start_frontend.sh        # Frontend startup script
├── package.json             # Root package.json with unified scripts
└── README.md               # This file
```

## Best Practices for Running Services

### 1. Always Run from Root Directory (`Investing/`)

```bash
# ✅ Correct - from Investing/ directory
./start_backend.sh
./start_frontend.sh

# ❌ Wrong - don't navigate to subdirectories
cd backend && python api_technical.py
```

### 2. Use the Provided Scripts

```bash
# Start backend only
npm run start:backend

# Start frontend only  
npm run start:frontend

# Start both simultaneously
npm run start:dev
```

### 3. Installation Commands

```bash
# Install all dependencies
npm install                    # Root dependencies (concurrently)
npm run install:frontend       # React/Node dependencies
npm run install:backend        # Python dependencies
```

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   npm run install:frontend
   npm run install:backend
   ```

2. **Start development servers**:
   ```bash
   npm run start:dev
   ```

3. **Access the application**:
   - Frontend Dashboard: http://localhost:5173
   - Backend API: http://localhost:8001

## API Endpoints

- `GET /health` - Health check
- `POST /research` - Technical analysis (requires auth header)

## Common Issues

### Port Already in Use
```bash
# Find and kill process on port 8001
lsof -ti:8001 | xargs kill
```

### Tailwind CSS Issues
The frontend uses the correct `@tailwindcss/postcss` package to avoid PostCSS plugin errors.

### Directory Confusion
Always run commands from the root `Investing/` directory. The scripts handle navigation to the correct subdirectories. 