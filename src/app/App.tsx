import { BrowserRouter, Link } from 'react-router-dom'

import { AppRoutes } from '@app/router/AppRoutes'

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-tight text-gray-900">
          Portfolio
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            Works
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f9fafb]">
        <NavBar />
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
