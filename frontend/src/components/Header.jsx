import { Link, useLocation } from 'react-router-dom'
import {
  User,
  FileText,
  Upload,
  CheckCircle,
  Map,
  BarChart3,
  Search,
  TrendingUp
} from 'lucide-react'

function Header() {
  const location = useLocation()

  const navItems = [
    { path: '/profile', label: 'User Profile', icon: User },
        { path: '/relevant-schemes', label: 'Relevant Schemes', icon: TrendingUp }, // <-- new link
    { path: '/schemes', label: 'Eligible Schemes', icon: FileText },
    { path: '/documents', label: 'Upload Documents', icon: Upload },
    { path: '/guidance', label: 'Application Guide', icon: CheckCircle },
    { path: '/map', label: 'Scheme Map', icon: Map },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/system-ui', label: 'System UI', icon: Search }
  ]

  return (
    <header className="bg-blue-600 shadow-md border-b border-blue-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">

          {/* LEFT LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Search className="text-white w-6 h-6" />
            </div>

            <div className="text-white leading-tight">
              <div className="text-xl font-bold tracking-wide">
                SchemeLens
              </div>
              <div className="text-xs opacity-90">
                Government Scheme Eligibility Platform
              </div>
            </div>
          </Link>

          {/* MENU ITEMS */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                    ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'text-white hover:bg-blue-700 hover:text-blue-100'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* MOBILE MENU ICON */}
          <div className="md:hidden">
            <button className="text-white p-2 rounded-md hover:bg-blue-700">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}

export default Header
