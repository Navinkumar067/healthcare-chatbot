'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LogOut, Users, MessageSquare, BarChart3, Settings, AlertCircle, TrendingUp, Shield } from 'lucide-react'

export default function AdminPanelPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in as admin
    const role = sessionStorage.getItem('userRole')
    const email = sessionStorage.getItem('userEmail')

    if (!role || role !== 'admin') {
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
          <LoadingSpinner size="lg" text="Loading admin panel..." />
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
              <div className="flex items-center gap-2 mb-2">
                <Shield size={28} className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Admin Control Panel
                </h1>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Manage users, monitor system health, and view analytics
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

          {/* Admin Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Admin Account</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">2,547</p>
                </div>
                <Users size={32} className="text-blue-600 dark:text-blue-400 opacity-20" />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1">
                <TrendingUp size={14} /> +12% from last month
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Active Sessions</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">342</p>
                </div>
                <MessageSquare size={32} className="text-green-600 dark:text-green-400 opacity-20" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                Currently online
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Chat Interactions</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">8,293</p>
                </div>
                <BarChart3 size={32} className="text-purple-600 dark:text-purple-400 opacity-20" />
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1">
                <TrendingUp size={14} /> +5% today
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">System Health</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">99.8%</p>
                </div>
                <AlertCircle size={32} className="text-yellow-600 dark:text-yellow-400 opacity-20" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                All systems operational
              </p>
            </div>
          </div>

          {/* Admin Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* User Management */}
            <Link
              href="#"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Users size={24} className="text-blue-600 dark:text-blue-400 group-hover:text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                User Management
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                View, manage, and moderate user accounts, permissions, and activities
              </p>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Manage Users →
              </div>
            </Link>

            {/* Analytics & Reports */}
            <Link
              href="#"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <BarChart3 size={24} className="text-green-600 dark:text-green-400 group-hover:text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                Analytics & Reports
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                View detailed analytics, reports, and system usage statistics
              </p>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                View Analytics →
              </div>
            </Link>

            {/* Content Moderation */}
            <Link
              href="#"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <AlertCircle size={24} className="text-purple-600 dark:text-purple-400 group-hover:text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                Content Moderation
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Review and moderate user-generated content and chat interactions
              </p>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                Moderate Content →
              </div>
            </Link>

            {/* System Settings */}
            <Link
              href="#"
              className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                  <Settings size={24} className="text-orange-600 dark:text-orange-400 group-hover:text-white" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                System Settings
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Configure system settings, API keys, and platform configurations
              </p>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Manage Settings →
              </div>
            </Link>
          </div>

          {/* Recent Admin Activities */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Recent Admin Activities
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">User Registration Spike</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">+125 new users in the last hour</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">1 min ago</p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">System Backup Completed</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Daily backup completed successfully</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">2 hours ago</p>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">Security Update Applied</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Security patches have been installed</p>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
