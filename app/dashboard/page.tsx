'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LogOut, MessageSquare, User, Heart, Settings, ChevronRight } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const role = sessionStorage.getItem('userRole')
    const email = sessionStorage.getItem('userEmail')

    if (!role || role !== 'user') {
      router.push('/login')
      return
    }

    setUserEmail(email || '')
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    sessionStorage.removeItem('userRole')
    sessionStorage.removeItem('userEmail')
    addToast('success', 'Logged Out', 'You have been logged out successfully')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome to Your Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your health information and access HealthChat services
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Logged in as</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Chat with AI */}
            <Link
              href="/chatbot"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <MessageSquare size={20} className="text-blue-600 dark:text-blue-400 group-hover:text-white" />
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Chat with AI</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Get instant health advice from our AI-powered chatbot
              </p>
            </Link>

            {/* Health Profile */}
            <Link
              href="#"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <Heart size={20} className="text-green-600 dark:text-green-400 group-hover:text-white" />
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-green-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Health Profile</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View and manage your medical information and history
              </p>
            </Link>

            {/* Settings */}
            <Link
              href="#"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <Settings size={20} className="text-purple-600 dark:text-purple-400 group-hover:text-white" />
                </div>
                <ChevronRight size={20} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Settings</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Update your account settings and preferences
              </p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Account Created</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Welcome to HealthChat</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today</p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Email Verified</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Your account is verified</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today</p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Profile Setup Complete</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Medical information added</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Today</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
