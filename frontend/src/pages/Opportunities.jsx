import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, BarChart3, Clock, Zap, AlertTriangle, 
  Target, Activity, Volume2, Layers, Eye, RefreshCw, Search, Filter
} from 'lucide-react'
import axios from 'axios'
import OpportunityDetailModal from '../components/OpportunityDetailModal'

const API_BASE_URL = 'http://localhost:8001'
const API_TOKEN = 'dev-key-12345'

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [agentStatus, setAgentStatus] = useState('checking')
  const [selectedOpportunity, setSelectedOpportunity] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    checkAgentHealth()
    loadExistingOpportunities()
  }, [])

  const checkAgentHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`)
      setAgentStatus('connected')
      console.log('Agent health:', response.data)
    } catch (err) {
      setAgentStatus('disconnected')
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

      // Then fetch the updated opportunities with proper IDs
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

  const openModal = (opportunity) => {
    setSelectedOpportunity(opportunity)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedOpportunity(null)
  }

  const getSetupTypeColor = (setupType) => {
    if (setupType.toLowerCase().includes('bullish') || setupType.toLowerCase().includes('momentum')) {
      return 'text-green-400 bg-green-500/20'
    }
    if (setupType.toLowerCase().includes('short') || setupType.toLowerCase().includes('bear')) {
      return 'text-red-400 bg-red-500/20'
    }
    return 'text-blue-400 bg-blue-500/20'
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-yellow-400'
    return 'text-orange-400'
  }

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = searchTerm === '' || 
      opp.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.setup_type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' ||
      (filterType === 'bullish' && (opp.setup_type.toLowerCase().includes('bullish') || opp.setup_type.toLowerCase().includes('momentum'))) ||
      (filterType === 'bearish' && (opp.setup_type.toLowerCase().includes('short') || opp.setup_type.toLowerCase().includes('bear'))) ||
      (filterType === 'high-confidence' && opp.confidence_score >= 0.7)
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-6">
      
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading Opportunities</h1>
            <p className="text-gray-400">AI-powered technical analysis and opportunity discovery</p>
          </div>
          <button
            onClick={runTechnicalAnalysis}
            disabled={loading || isAgentRunning}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${agentStatus === 'connected' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`font-medium ${agentStatus === 'connected' ? 'text-green-400' : 'text-red-400'}`}>
              {agentStatus === 'connected' ? 'Technical Researcher Agent Online' : 'Agent Offline'}
            </span>
            {lastAnalysisTime && (
              <span className="text-gray-400 text-sm">
                • Last analysis: {lastAnalysisTime}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400">
            {opportunities.length} opportunities found
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by ticker or setup type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-8 py-3 bg-gray-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
          >
            <option value="all">All Opportunities</option>
            <option value="bullish">Bullish Setups</option>
            <option value="bearish">Bearish Setups</option>
            <option value="high-confidence">High Confidence (70%+)</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-6 bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex items-center">
          <RefreshCw className="h-5 w-5 text-blue-400 mr-3 animate-spin" />
          <span className="text-blue-200">Running technical analysis...</span>
        </div>
      )}

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((opportunity, index) => (
            <div 
              key={opportunity.id || index} 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group"
            >
              
              {/* Card Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-white">{opportunity.ticker}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSetupTypeColor(opportunity.setup_type)}`}>
                    {opportunity.setup_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">{opportunity.timeframe}</span>
                  <span className={`text-sm font-medium ${getConfidenceColor(opportunity.confidence_score)}`}>
                    {Math.round(opportunity.confidence_score * 100)}% confidence
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6">
                <div className="space-y-4">
                  
                  {/* Price Info */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Current Price</span>
                    <span className="text-white font-medium">
                      ${opportunity.price ? parseFloat(opportunity.price).toFixed(2) : 'N/A'}
                    </span>
                  </div>

                  {/* Key Indicators */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-gray-400">RSI</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-1">
                        {opportunity.rsi ? opportunity.rsi.toFixed(1) : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Volume</span>
                      </div>
                      <p className="text-sm font-medium text-white mt-1">
                        {opportunity.volume_ratio ? `${opportunity.volume_ratio.toFixed(1)}x` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Rationale Preview */}
                  {opportunity.rationale && (
                    <div className="bg-black/20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Key Insight</p>
                      <p className="text-sm text-gray-200 line-clamp-2">
                        {opportunity.rationale.substring(0, 100)}...
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => openModal(opportunity)}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors group-hover:bg-blue-500/30"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>

                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-12 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10">
              <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {searchTerm || filterType !== 'all' ? 'No matching opportunities' : 'No opportunities found'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Run the technical analysis to discover trading opportunities'
                }
              </p>
              {(!searchTerm && filterType === 'all') && (
                <button
                  onClick={runTechnicalAnalysis}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Run Analysis'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal 
        opportunity={selectedOpportunity}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

    </div>
  )
}

export default Opportunities 