import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Shield, 
  Activity, Zap, Clock, AlertTriangle, CheckCircle, RefreshCw, 
  MessageCircle, Send, Play, Pause, Settings, Bell, User,
  ChevronRight, Eye, Star, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import OpportunityDetailModal from './components/OpportunityDetailModal'
import './App.css'

const API_BASE_URL = 'http://localhost:8001'
const API_TOKEN = 'dev-key-12345'

function App() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [error, setError] = useState(null)
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const [marketStatus, setMarketStatus] = useState('OPEN')
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    checkAgentHealth()
    loadExistingOpportunities()
    // Simulate market data updates
    const interval = setInterval(() => {
      setMarketStatus(Math.random() > 0.5 ? 'OPEN' : 'CLOSED')
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAgentHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      console.log('Agent health:', response.data)
    } catch (err) {
      setError('Unable to connect to Technical Researcher Agent')
    }
  }

  const loadExistingOpportunities = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/opportunities`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      })
      setOpportunities(response.data || [])
    } catch (err) {
      console.error('Failed to load existing opportunities:', err.message)
    }
  }

  const runTechnicalAnalysis = async () => {
    setLoading(true)
    setError(null)
    setIsAgentRunning(true)

    try {
      // First trigger the research to update opportunities
      await axios.post(`${API_BASE_URL}/research`, {
        query: "Find technical trading opportunities",
        lookback_days: 30
      }, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      // Then fetch the opportunities with IDs from the database
      const response = await axios.get(`${API_BASE_URL}/opportunities`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      })

      setOpportunities(response.data || [])
      setLastAnalysisTime(new Date().toLocaleTimeString())
    } catch (err) {
      setError('Failed to fetch trading opportunities: ' + err.message)
    } finally {
      setLoading(false)
      setIsAgentRunning(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: chatInput
      }, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      const agentMessage = { role: 'assistant', content: response.data.response }
      setChatMessages(prev => [...prev, agentMessage])
    } catch (err) {
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error: ' + err.message }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : price || 'N/A'
  }

  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunity(opportunity)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedOpportunity(null)
  }

  const getSetupIcon = (setupType) => {
    const icons = {
      'Bullish Momentum': TrendingUp,
      'Oversold Bounce': Target,
      'Breakout': Zap,
      'Mean Reversion': Shield
    }
    return icons[setupType] || BarChart3
  }

  const stats = {
    totalOpportunities: opportunities.length,
    avgConfidence: opportunities.length > 0 
      ? Math.round(opportunities.reduce((sum, opp) => sum + (opp.confidence_score * 100), 0) / opportunities.length)
      : 0,
    highConfidence: opportunities.filter(opp => (opp.confidence_score * 100) >= 70).length,
    totalValue: opportunities.reduce((sum, opp) => sum + (parseFloat(opp.price) || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Top Navigation */}
      <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Technical Researcher</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${marketStatus === 'OPEN' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span>Market {marketStatus}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                {lastAnalysisTime && (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Last scan: {lastAnalysisTime}</span>
                  </>
                )}
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Opportunities */}
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Opportunities</p>
                <p className="text-3xl font-bold text-white">{stats.totalOpportunities}</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400">+12%</span>
                  <span className="text-gray-400 ml-1">vs yesterday</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Average Confidence */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Avg Confidence</p>
                <p className="text-3xl font-bold text-white">{stats.avgConfidence}%</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowUpRight className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-green-400">+5%</span>
                  <span className="text-gray-400 ml-1">this week</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* High Confidence */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">High Confidence</p>
                <p className="text-3xl font-bold text-white">{stats.highConfidence}</p>
                <div className="flex items-center mt-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400">Premium</span>
                  <span className="text-gray-400 ml-1">setups</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Shield className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Portfolio Value */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
                <p className="text-3xl font-bold text-white">${stats.totalValue.toFixed(0)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <ArrowDownRight className="h-4 w-4 text-red-400 mr-1" />
                  <span className="text-red-400">-2.1%</span>
                  <span className="text-gray-400 ml-1">today</span>
                </div>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <DollarSign className="h-8 w-8 text-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold">Market Analysis</h2>
              <div className="flex items-center space-x-2">
                {['5m', '15m', '1H', '1D', '1W'].map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={runTechnicalAnalysis}
              disabled={loading || isAgentRunning}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Scanning Markets...' : 'Run Analysis'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
              <span className="text-red-200">{error}</span>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trading Opportunities */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Trading Opportunities</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Activity className="h-4 w-4" />
                    <span>{opportunities.length} active</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {opportunities.length === 0 ? (
                  <div className="p-12 text-center">
                    <BarChart3 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-400 mb-2">No opportunities found</h4>
                    <p className="text-gray-500">Run analysis to discover trading setups</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Setup</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Confidence</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stop Loss</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {opportunities.map((opp, index) => {
                        const SetupIcon = getSetupIcon(opp.setup_type)
                        const confidence = Math.round((opp.confidence_score || 0) * 100)
                        
                        return (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="font-medium text-white">{opp.ticker}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="p-1 bg-blue-500/20 rounded">
                                  <SetupIcon className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-300">{opp.setup_type}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                              {formatPrice(opp.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-white">{confidence}%</div>
                                <div className="w-16 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      confidence >= 70 ? 'bg-green-500' : 
                                      confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${confidence}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {opp.key_indicators?.target || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {opp.key_indicators?.stop_loss || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button 
                                onClick={() => handleViewOpportunity(opp)}
                                className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl h-[600px] flex flex-col">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Assistant</h3>
                    <p className="text-sm text-gray-400">Ask about strategies & analysis</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Start a conversation with your AI assistant</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white/10 text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Ask about trading strategies..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default App
