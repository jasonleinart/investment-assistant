import { useState, useEffect } from 'react'
import { 
  X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, 
  BarChart3, Clock, Zap, AlertTriangle, Target, 
  Activity, Volume2, Layers, Eye
} from 'lucide-react'
import axios from 'axios'
import TradingViewChart from './TradingViewChart'

const API_BASE_URL = 'http://localhost:8001'
const API_TOKEN = 'dev-key-12345'

const OpportunityDetailModal = ({ opportunity, isOpen, onClose }) => {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    technical: false,
    rationale: false,
    chart: false,
    timeline: false
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    console.log('Modal opened with opportunity:', opportunity)
    if (isOpen && opportunity) {
      console.log('Opportunity ID:', opportunity.id)
      fetchOpportunityDetails()
    }
  }, [isOpen, opportunity])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchOpportunityDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching details for opportunity:', opportunity.id)
      const response = await axios.get(
        `${API_BASE_URL}/opportunities/${opportunity.id}/details`,
        {
          headers: { Authorization: `Bearer ${API_TOKEN}` }
        }
      )
      console.log('API Response:', response.data)
      setDetails(response.data)
    } catch (err) {
      console.error('Full error details:', err)
      console.error('Error response:', err.response)
      setError(`Failed to load opportunity details: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatPrice = (price) => {
    return price ? `$${parseFloat(price).toFixed(2)}` : 'N/A'
  }

  const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A'
    return new Date(datetime).toLocaleString()
  }

  const formatSymbolForTradingView = (ticker) => {
    if (!ticker) return 'NASDAQ:AAPL'
    
    // Handle common exchange prefixes and symbol formats
    const upperTicker = ticker.toUpperCase()
    
    // If already includes exchange, return as-is
    if (upperTicker.includes(':')) {
      return upperTicker
    }
    
    // Default to NASDAQ for most US stocks
    // You could enhance this with a more sophisticated exchange detection
    return `NASDAQ:${upperTicker}`
  }

  if (!isOpen) return null

  // Handle click outside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal Container - Responsive */}
      <div className="relative w-full h-full md:w-auto md:h-auto md:max-w-4xl md:max-h-[90vh] md:m-4">
        {/* Desktop Modal / Mobile Full Screen */}
        <div className="w-full h-full md:h-auto bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20 md:rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Eye className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {opportunity?.ticker || 'N/A'} - Opportunity Analysis
                </h2>
                <p className="text-sm text-gray-400">Educational technical analysis breakdown</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(100vh-140px)] md:max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading opportunity details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                  <span className="text-red-200">{error}</span>
                </div>
              </div>
            ) : details ? (
              <div className="p-6 space-y-4">
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Current Price</p>
                    <p className="text-lg font-semibold text-white">
                      {formatPrice(details.opportunity.price)}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Confidence</p>
                    <p className="text-lg font-semibold text-white">
                      {Math.round(details.opportunity.confidence_score * 100)}%
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Setup Type</p>
                    <p className="text-lg font-semibold text-white">
                      {details.opportunity.setup_type}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-1">Timeframe</p>
                    <p className="text-lg font-semibold text-white">
                      {details.opportunity.timeframe}
                    </p>
                  </div>
                </div>

                {/* Collapsible Sections */}
                
                {/* Technical Indicators */}
                <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('technical')}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                      <span className="font-medium text-white">Technical Indicators</span>
                    </div>
                    {expandedSections.technical ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections.technical && (
                    <div className="px-4 pb-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* RSI */}
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-300">RSI</span>
                            <span className="text-sm font-bold text-white">
                              {details.technical_indicators.rsi.value.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {details.technical_indicators.rsi.interpretation}
                          </p>
                        </div>

                        {/* MACD */}
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-300">MACD</span>
                            <span className="text-sm font-bold text-white">
                              {details.technical_indicators.macd.histogram.toFixed(3)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {details.technical_indicators.macd.interpretation}
                          </p>
                        </div>

                        {/* Volume */}
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-300">Volume Ratio</span>
                            <span className="text-sm font-bold text-white">
                              {details.technical_indicators.volume.ratio.toFixed(1)}x
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {details.technical_indicators.volume.interpretation}
                          </p>
                        </div>

                        {/* Moving Average */}
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-300">Price vs SMA-20</span>
                            <span className="text-sm font-bold text-white">
                              {details.technical_indicators.moving_averages.distance_from_sma.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            SMA-20: {formatPrice(details.technical_indicators.moving_averages.sma_20)}
                          </p>
                        </div>

                      </div>
                    </div>
                  )}
                </div>

                {/* Setup Rationale */}
                <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('rationale')}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Target className="h-5 w-5 text-purple-400" />
                      <span className="font-medium text-white">Setup Rationale</span>
                    </div>
                    {expandedSections.rationale ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections.rationale && (
                    <div className="px-4 pb-4 space-y-4">
                      
                      {/* Pattern Type */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Pattern Identification</h4>
                        <p className="text-sm text-white bg-white/5 rounded-lg p-3">
                          {details.setup_rationale.pattern_type}
                        </p>
                      </div>

                      {/* Trigger Conditions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Trigger Conditions</h4>
                        <ul className="space-y-2">
                          {details.setup_rationale.trigger_conditions.map((condition, index) => (
                            <li key={index} className="text-sm text-gray-200 flex items-start">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Confidence Explanation */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Confidence Analysis</h4>
                        <p className="text-sm text-gray-200 bg-white/5 rounded-lg p-3">
                          {details.setup_rationale.confidence_explanation}
                        </p>
                      </div>

                      {/* Risk Factors */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Risk Considerations</h4>
                        <ul className="space-y-2">
                          {details.setup_rationale.risk_factors.map((risk, index) => (
                            <li key={index} className="text-sm text-yellow-200 flex items-start">
                              <AlertTriangle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-yellow-400" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  )}
                </div>

                {/* Chart Analysis */}
                <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('chart')}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-green-400" />
                      <span className="font-medium text-white">Price Levels & Chart Data</span>
                    </div>
                    {expandedSections.chart ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections.chart && (
                    <div className="px-4 pb-4 space-y-4">
                      
                      {/* Price Levels */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Entry Zone</p>
                          <p className="text-sm font-medium text-white">
                            {details.chart_data.price_levels.entry_zone}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Target</p>
                          <p className="text-sm font-medium text-green-400">
                            {details.chart_data.price_levels.target}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Stop Loss</p>
                          <p className="text-sm font-medium text-red-400">
                            {details.chart_data.price_levels.stop_loss}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Support Level</p>
                          <p className="text-sm font-medium text-blue-400">
                            {formatPrice(details.chart_data.support_resistance.support)}
                          </p>
                        </div>
                      </div>

                      {/* TradingView Chart */}
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-white/10">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-300 mb-1">Price Chart with Technical Indicators</h4>
                          <p className="text-xs text-gray-500">Live chart with RSI, MACD, and Volume indicators</p>
                        </div>
                        <div className="bg-black/20 rounded-lg overflow-hidden">
                          <TradingViewChart
                            symbol={formatSymbolForTradingView(opportunity?.ticker)}
                            height={isMobile ? 300 : 350}
                            theme="dark"
                            interval="1D"
                            studies={['RSI', 'MACD', 'Volume']}
                            showToolbar={!isMobile}
                            allowSymbolChange={false}
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* Timeline & Context */}
                <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleSection('timeline')}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-orange-400" />
                      <span className="font-medium text-white">Timeline & Context</span>
                    </div>
                    {expandedSections.timeline ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </button>
                  
                  {expandedSections.timeline && (
                    <div className="px-4 pb-4 space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Detected At</p>
                          <p className="text-sm text-white">
                            {formatDateTime(details.timeline_context.detected_at)}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Agent</p>
                          <p className="text-sm text-white">
                            {details.timeline_context.agent_name}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Processing Time</p>
                          <p className="text-sm text-white">
                            {details.timeline_context.processing_time}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">Similar Setup Success</p>
                          <p className="text-sm text-green-400">
                            {details.timeline_context.similar_setups_success_rate}
                          </p>
                        </div>
                      </div>

                      {/* History */}
                      {details.history && details.history.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Change History</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {details.history.map((change, index) => (
                              <div key={index} className="text-xs text-gray-400 bg-white/5 rounded p-2">
                                <span className="text-gray-300">{formatDateTime(change.timestamp)}</span>
                                {' - '}
                                <span className="capitalize">{change.change_type}</span>
                                {change.field_changed && (
                                  <>
                                    {' - '}
                                    <span className="text-white">{change.field_changed}</span>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>

              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                ⚠️ For educational purposes only. Not financial advice.
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default OpportunityDetailModal 