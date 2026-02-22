'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LogOut, MessageSquare, User, Heart, Settings, ChevronRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ChatMessage {
  id: string
  question: string
  topic: string
  date: string
  time: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [healthData, setHealthData] = useState({
    allergies: 'Penicillin',
    diseases: 'Diabetes, Hypertension',
    medicines: 'Metformin 500mg, Lisinopril 10mg',
    lastCheckup: '2024-02-10'
  })
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: '1',
      question: 'What are symptoms of fever?',
      topic: 'General',
      date: '2024-02-22',
      time: '10:30 AM'
    },
    {
      id: '2',
      question: 'How to manage diabetes?',
      topic: 'Chronic Disease',
      date: '2024-02-21',
      time: '02:15 PM'
    },
    {
      id: '3',
      question: 'Best exercises for heart health',
      topic: 'Fitness',
      date: '2024-02-20',
      time: '09:45 AM'
    },
  ])

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
    setTimeout(() => {
      router.push('/login')
    }, 500)
  }

  const handleProfileClick = () => {
    addToast('info', 'Profile', 'Navigating to your profile')
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

          {/* User Info and Quick Action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* User Info Card */}
            <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Logged in as</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Health Status */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Account Status</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active & Verified</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">All systems operational</p>
            </div>
          </div>

          {/* Health Summary Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Health Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Allergies Card */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
                  Allergies
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{healthData.allergies}</p>
              </div>

              {/* Diseases Card */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
                  Conditions
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{healthData.diseases}</p>
              </div>

              {/* Medicines Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
                  Current Medications
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                  {healthData.medicines}
                </p>
              </div>

              {/* Last Checkup Card */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                  Last Checkup
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{healthData.lastCheckup}</p>
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

          {/* Chat History */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Chat History</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Your recent conversations</p>
              </div>
              <Link
                href="/chatbot"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <MessageSquare size={18} />
                New Chat
              </Link>
            </div>

            {chatHistory.length > 0 ? (
              <div className="space-y-3">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-start justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white line-clamp-1">
                        {chat.question}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                          {chat.topic}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <Clock size={14} />
                          {chat.time}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 ml-4 whitespace-nowrap">
                      {chat.date}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <MessageSquare size={32} className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400">No chats yet</p>
                  <Link
                    href="/chatbot"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium mt-2 inline-block"
                  >
                    Start a conversation
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
