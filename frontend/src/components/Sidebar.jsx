import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Home, TrendingUp, BarChart3, Settings, Menu, X,
  Activity, Zap, Target, Eye
} from 'lucide-react'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Overview and portfolio summary'
    },
    {
      name: 'Opportunities',
      href: '/opportunities',
      icon: TrendingUp,
      description: 'Trading opportunities analysis'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Performance metrics',
      disabled: true
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'App configuration',
      disabled: true
    }
  ]

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-gradient-to-b from-gray-900 via-gray-900 to-blue-900/20 border-r border-white/10 flex flex-col h-screen`}>
      
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Investment Assistant</h1>
                <p className="text-xs text-gray-400">AI-Powered Analysis</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isCollapsed ? 
              <Menu className="h-5 w-5 text-gray-400" /> : 
              <X className="h-5 w-5 text-gray-400" />
            }
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white border-transparent'
                } ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } group flex items-center px-3 py-3 text-sm font-medium rounded-xl border transition-all duration-200`
              }
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
              {!isCollapsed && (
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.disabled && (
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded">Soon</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-white/10">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xs font-medium text-white">AI Agent Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Technical Researcher Active</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar 