'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X, Moon, Sun, UserCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { token, role, logout } = useAuth()
  
  // Get the current route path
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDarkMode = () => {
    if (!mounted) return
    const html = document.documentElement
    if (isDark) {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
    setIsDark(!isDark)
  }

  // Helper function to dynamically set desktop link classes
  const getLinkClass = (path: string, extraClasses: string = "") => {
    const isActive = pathname === path;
    const activeStyles = 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
    const inactiveStyles = 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30';
    
    return `px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? activeStyles : inactiveStyles} ${extraClasses}`.trim();
  }

  // Helper function to dynamically set mobile link classes
  const getMobileLinkClass = (path: string) => {
    const isActive = pathname === path;
    const activeStyles = 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-slate-800';
    const inactiveStyles = 'text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800';
    
    return `block px-3 py-2 text-base font-medium rounded-md ${isActive ? activeStyles : inactiveStyles}`.trim();
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-blue-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Custom "H" Logo & Title */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-none group-hover:bg-blue-700 transition-all duration-200">
              <span className="text-white font-bold text-lg leading-none">H</span>
            </div>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400 hidden sm:inline tracking-tight">HealthChat</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className={getLinkClass('/')}>
              Home
            </Link>
            
            {/* Protected Links */}
            {token ? (
              <>
                {role === 'admin' && (
                  <Link href="/admin-panel" className={getLinkClass('/admin-panel')}>
                    Admin Panel
                  </Link>
                )}
                <Link href="/chatbot" className={getLinkClass('/chatbot')}>
                  Chatbot
                </Link>
                <Link href="/profile" className={getLinkClass('/profile', 'flex items-center gap-1.5')}>
                  <UserCircle size={18} /> Profile
                </Link>
                <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ml-2">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              /* Public Links */
              <>
                <Link href="/login" className={getLinkClass('/login')}>
                  Login
                </Link>
                <Link href="/signup" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors ml-2">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Right Side - Dark Mode & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2">
            {mounted && (
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="space-y-1">
              <Link href="/" className={getMobileLinkClass('/')} onClick={() => setIsOpen(false)}>Home</Link>
              
              {token ? (
                <>
                  {role === 'admin' && (
                    <Link href="/admin-panel" className={getMobileLinkClass('/admin-panel')} onClick={() => setIsOpen(false)}>Admin Panel</Link>
                  )}
                  <Link href="/chatbot" className={getMobileLinkClass('/chatbot')} onClick={() => setIsOpen(false)}>Chatbot</Link>
                  <Link href="/profile" className={getMobileLinkClass('/profile')} onClick={() => setIsOpen(false)}>Profile</Link>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md mt-2">Logout</button>
                </>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/login" className="block w-full text-center px-3 py-2 text-base font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" onClick={() => setIsOpen(false)}>Login</Link>
                  <Link href="/signup" className="block w-full text-center px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={() => setIsOpen(false)}>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}