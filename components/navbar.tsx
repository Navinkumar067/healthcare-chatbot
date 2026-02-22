'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X, Moon, Sun, UserCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { token, role, logout } = useAuth()

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

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-blue-100 dark:border-blue-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400 hidden sm:inline">HealthChat</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
              Home
            </Link>
            
            {/* Protected Links (Only visible if logged in) */}
            {token ? (
              <>
                {role === 'admin' && (
                  <Link href="/admin-panel" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    Admin Panel
                  </Link>
                )}
                <Link href="/chatbot" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  Chatbot
                </Link>
                <Link href="/profile" className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  <UserCircle size={18} /> Profile
                </Link>
                <button onClick={logout} className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors ml-2">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              /* Public Links (Only visible if logged out) */
              <>
                <Link href="/login" className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
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
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="space-y-2">
              <Link href="/" className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => setIsOpen(false)}>Home</Link>
              
              {token ? (
                <>
                  {role === 'admin' && (
                    <Link href="/admin-panel" className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => setIsOpen(false)}>Admin Panel</Link>
                  )}
                  <Link href="/chatbot" className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => setIsOpen(false)}>Chatbot</Link>
                  <Link href="/profile" className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => setIsOpen(false)}>Profile</Link>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left block px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30" onClick={() => setIsOpen(false)}>Login</Link>
                  <Link href="/signup" className="block px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 text-center" onClick={() => setIsOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}