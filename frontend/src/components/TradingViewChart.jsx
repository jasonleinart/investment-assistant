import { useEffect, useRef } from 'react'

const TradingViewChart = ({ 
  symbol = 'NASDAQ:AAPL', 
  width = '100%', 
  height = 400,
  theme = 'dark',
  interval = '1D',
  studies = ['RSI', 'MACD', 'Volume'],
  showToolbar = true,
  allowSymbolChange = false
}) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any existing widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    
    script.innerHTML = JSON.stringify({
      autosize: false,
      width: width,
      height: height,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: 'en',
      enable_publishing: false,
      withdateranges: true,
      range: '1M',
      hide_side_toolbar: !showToolbar,
      allow_symbol_change: allowSymbolChange,
      studies: studies,
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      no_referral_id: true,
      container_id: containerRef.current?.id || 'tradingview_chart'
    })

    containerRef.current.appendChild(script)

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, height, theme, interval, studies, showToolbar, allowSymbolChange])

  return (
    <div className="tradingview-widget-container">
      <div 
        ref={containerRef}
        id={`tradingview_${Date.now()}`}
        className="tradingview-widget"
        style={{ width, height }}
      />
      <div className="tradingview-widget-copyright">
        <a 
          href={`https://www.tradingview.com/symbols/${symbol.replace(':', '-')}/`}
          rel="noopener noreferrer" 
          target="_blank"
          className="text-xs text-gray-500 hover:text-gray-400"
        >
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  )
}

export default TradingViewChart 