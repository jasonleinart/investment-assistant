import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Opportunities from './pages/Opportunities'
import './App.css'

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-blue-900/20">
        
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/analytics" element={
              <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Analytics</h1>
                <p className="text-gray-400">Coming Soon</p>
              </div>
            } />
            <Route path="/settings" element={
              <div className="p-6 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>
                <p className="text-gray-400">Coming Soon</p>
              </div>
            } />
          </Routes>
        </div>
        
      </div>
    </Router>
  )
}

export default App
