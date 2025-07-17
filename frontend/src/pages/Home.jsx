import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  TrendingUp, TrendingDown, BarChart3, Activity, Zap, 
  Target, AlertTriangle, Eye, ArrowRight, Sparkles
} from 'lucide-react'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8001'
const API_TOKEN = 'dev-key-12345'

const Home = () => {
  const [opportunities, setOpportunities] = useState([])
  const [agentStatus, setAgentStatus] = useState('checking')
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    highConfidence: 0,
    bullishSetups: 0,
    bearishSetups: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Check agent health
      const healthResponse = await axios.get(`${API_BASE_URL}/health`)
      setAgentStatus('connected')

      // Load opportunities
      const opportunitiesResponse = await axios.get(`${API_BASE_URL}/opportunities`, {
        headers: { 'Authorization': `Bearer ${API_TOKEN}` }
      })
      
      const opps = opportunitiesResponse.data || []
      setOpportunities(opps)
      
      // Calculate stats
      setStats({
        totalOpportunities: opps.length,
        highConfidence: opps.filter(opp => opp.confidence_score > 0.7).length,
        bullishSetups: opps.filter(opp => opp.setup_type.toLowerCase().includes('bullish') || opp.setup_type.toLowerCase().includes('momentum')).length,
        bearishSetups: opps.filter(opp => opp.setup_type.toLowerCase().includes('short') || opp.setup_type.toLowerCase().includes('bear')).length
      })
      
    } catch (err) {
      setAgentStatus('disconnected')
      console.error('Failed to load dashboard data:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-400'
      case 'disconnected': return 'text-red-400'
      default: return 'text-yellow-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'AI Agent Connected'
      case 'disconnected': return 'AI Agent Offline'
      default: return 'Checking Connection...'
    }
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Sparkles className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">Welcome to Investment Assistant</h1>
        </div>
        <p className="text-gray-400 text-lg">AI-powered trading opportunities discovery and analysis platform</p>
      </div>

      {/* Status Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${agentStatus === 'connected' ? 'bg-green-400 animate-pulse' : agentStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`}></div>
            <span className={`font-medium ${getStatusColor(agentStatus)}`}>
              {getStatusText(agentStatus)}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Opportunities */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Opportunities</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalOpportunities}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Target className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/opportunities"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
            >
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* High Confidence */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">High Confidence</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.highConfidence}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-400 text-sm font-medium">
              {stats.totalOpportunities > 0 ? Math.round((stats.highConfidence / stats.totalOpportunities) * 100) : 0}% of total
            </span>
          </div>
        </div>

        {/* Bullish Setups */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Bullish Setups</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.bullishSetups}</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-emerald-400 text-sm font-medium">Long opportunities</span>
          </div>
        </div>

        {/* Bearish Setups */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Bearish Setups</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.bearishSetups}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-red-400 text-sm font-medium">Short opportunities</span>
          </div>
        </div>

      </div>

      {/* Recent Opportunities Preview */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Recent Opportunities</h2>
            </div>
            <Link 
              to="/opportunities"
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {opportunities.length > 0 ? (
            <div className="space-y-4">
              {opportunities.slice(0, 3).map((opportunity, index) => (
                <div key={opportunity.id || index} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{opportunity.ticker}</h3>
                      <p className="text-sm text-gray-400">{opportunity.setup_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">
                        {Math.round(opportunity.confidence_score * 100)}% confidence
                      </p>
                      <p className="text-xs text-gray-400">{opportunity.timeframe}</p>
                    </div>
                    <Link 
                      to="/opportunities"
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">No opportunities found</p>
              <p className="text-sm text-gray-500">Run the technical analysis to discover trading opportunities</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/opportunities"
            className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                  Analyze Opportunities
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  View detailed technical analysis
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
          
          <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg opacity-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-400">Portfolio Analytics</h3>
                <p className="text-sm text-gray-500 mt-1">Coming soon</p>
              </div>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">Soon</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Home 