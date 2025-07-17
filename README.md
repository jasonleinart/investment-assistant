# Trading Opportunities Dashboard

AI-powered trading opportunities dashboard with TradingView integration for educational technical analysis.

## 🚀 Features

- **Backend API** with technical analysis (FastAPI + SQLite)
- **Frontend Dashboard** with React + Vite + Tailwind CSS
- **TradingView Charts** with RSI, MACD, Volume indicators
- **Opportunity Modal** with detailed technical analysis
- **Responsive Design** for mobile and desktop
- **Real-time Data** via Yahoo Finance integration

## 🔧 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- OpenAI API Key

### 1. Clone Repository
```bash
git clone https://github.com/jasonleinart/trading-opportunities-dashboard.git
cd trading-opportunities-dashboard
```

### 2. Environment Configuration
```bash
# Copy the environment template
cp env.example .env

# Edit .env and add your actual keys
nano .env
```

**Required Environment Variables:**
```env
# Copy this to .env and update with your actual keys

# Agent API Key for authentication (development default)
AGENT_API_KEY=dev-key-12345

# OpenAI API Key (required for OpenAI-powered analysis)
OPENAI_API_KEY=your_actual_openai_api_key_here

# Optional: Custom log level
LOG_LEVEL=INFO
```

### 3. Backend Setup
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the backend API
../start_backend.sh
```

### 4. Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the frontend development server
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## 🔒 Security Notes

⚠️ **IMPORTANT**: Never commit your actual API keys to version control!

- ✅ The `.env` file is in `.gitignore` 
- ✅ Use `env.example` as a template
- ✅ Set environment variables in production
- ✅ Rotate API keys regularly

## 📊 Usage

1. **Run Analysis**: Click "Run Technical Analysis" to discover opportunities
2. **View Details**: Click "View" on any opportunity to see detailed analysis
3. **Chart Analysis**: Interactive TradingView charts with technical indicators
4. **Educational Only**: This is for learning purposes, not financial advice

## 🛠 Development

### Project Structure
```
trading-opportunities-dashboard/
├── backend/                 # FastAPI backend
│   ├── api.py              # Main API endpoints
│   ├── agent.py            # Technical analysis agent
│   ├── db.py               # Database models
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── App.jsx         # Main application
│   └── package.json        # Node.js dependencies
└── env.example             # Environment template
```

### Key Technologies
- **Backend**: FastAPI, SQLite, OpenAI, yfinance
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Charts**: TradingView Widgets
- **Analysis**: RSI, MACD, Volume, Moving Averages

## ⚠️ Disclaimer

This application is for **educational purposes only**. It is not financial advice and should not be used for actual trading decisions. Always do your own research and consult with financial professionals.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License. 