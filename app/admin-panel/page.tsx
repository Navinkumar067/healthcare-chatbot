'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LogOut, Users, MessageSquare, BarChart3, Settings, AlertCircle, TrendingUp, Shield, Search, Trash2, Lock, LockOpen, Eye, FileText } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  phone: string
  age: number
  gender: string
  registeredDate: string
  status: 'active' | 'blocked'
  allergies: string
  diseases: string
  medicines: string
}

interface ChatLog {
  id: string
  userId: string
  userName: string
  question: string
  timestamp: string
}

type TabType = 'users' | 'chats'

export default function AdminPanelPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [userEmail, setUserEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '9876543210',
      age: 35,
      gender: 'Male',
      registeredDate: '2024-01-15',
      status: 'active',
      allergies: 'Penicillin',
      diseases: 'Diabetes',
      medicines: 'Metformin 500mg',
    },
    {
      id: '2',
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com',
      phone: '9123456789',
      age: 28,
      gender: 'Female',
      registeredDate: '2024-02-01',
      status: 'active',
      allergies: 'None',
      diseases: 'Asthma',
      medicines: 'Salbutamol',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      phone: '9012345678',
      age: 42,
      gender: 'Male',
      registeredDate: '2024-01-20',
      status: 'blocked',
      allergies: 'Nuts',
      diseases: 'Hypertension',
      medicines: 'Lisinopril 10mg',
    },
  ])

  const [chatLogs, setChatLogs] = useState<ChatLog[]>([
    {
      id: '1',
      userId: '1',
      userName: 'John Doe',
      question: 'What are symptoms of fever?',
      timestamp: '2024-02-22 10:30 AM',
    },
    {
      id: '2',
      userId: '2',
      userName: 'Sarah Smith',
      question: 'How to manage asthma?',
      timestamp: '2024-02-22 09:15 AM',
    },
    {
      id: '3',
      userId: '1',
      userName: 'John Doe',
      question: 'Best exercises for diabetes',
      timestamp: '2024-02-21 02:45 PM',
    },
  ])

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
    setTimeout(() => {
      router.push('/login')
    }, 500)
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId))
    addToast('success', 'User Deleted', 'User has been permanently removed')
  }

  const handleBlockUser = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'blocked' : 'active' }
        : u
    ))
    const user = users.find(u => u.id === userId)
    const newStatus = user?.status === 'active' ? 'blocked' : 'unblocked'
    addToast('success', 'User Updated', `User has been ${newStatus}`)
  }

  const handleViewMedicalRecords = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={18} />
                User Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('chats')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'chats'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={18} />
                Chat Logs
              </div>
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Users Table */}
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Phone</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Registered</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.phone}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.registeredDate}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            }`}>
                              {user.status === 'active' ? 'Active' : 'Blocked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewMedicalRecords(user)}
                                title="View Medical Records"
                                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                              >
                                <FileText size={18} />
                              </button>
                              <button
                                onClick={() => handleBlockUser(user.id)}
                                title={user.status === 'active' ? 'Block User' : 'Unblock User'}
                                className={`p-2 rounded-lg transition-colors ${
                                  user.status === 'active'
                                    ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                    : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                                }`}
                              >
                                {user.status === 'active' ? <Lock size={18} /> : <LockOpen size={18} />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                title="Delete User"
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400">No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Logs Tab */}
          {activeTab === 'chats' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800">
                {chatLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{log.userName}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{log.question}</p>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
              {chatLogs.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">No chat logs available</p>
                </div>
              )}
            </div>
          )}

          {/* Medical Records Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Medical Records</h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Name</p>
                    <p className="text-slate-900 dark:text-white">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Age</p>
                    <p className="text-slate-900 dark:text-white">{selectedUser.age} years old</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Gender</p>
                    <p className="text-slate-900 dark:text-white">{selectedUser.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Allergies</p>
                    <p className="text-slate-900 dark:text-white">{selectedUser.allergies}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Existing Diseases</p>
                    <p className="text-slate-900 dark:text-white">{selectedUser.diseases}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Current Medicines</p>
                    <p className="text-slate-900 dark:text-white">{selectedUser.medicines}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
