'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LogOut, MessageSquare, User, Heart, Settings, ChevronRight, CheckCircle2, Activity, Pill, AlertCircle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/context/AuthContext'

export default function DashboardPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [userEmail, setUserEmail] = useState('')
  const [userProfileName, setUserProfileName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  const [healthData, setHealthData] = useState({
    allergies: 'Loading...',
    diseases: 'Loading...',
    medicines: 'Loading...',
    lastCheckup: 'Loading...'
  })
  
  const [healthTimeline, setHealthTimeline] = useState<any[]>([])

  useEffect(() => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      fetchUserProfile(email)
    } else {
      setIsLoading(false)
      router.push('/login')
    }
  }, [router])

  const fetchUserProfile = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setUserProfileName(data.full_name || 'User')
        
        setHealthData({
          allergies: data.allergies || 'None reported',
          diseases: data.existing_diseases || 'None reported',
          medicines: data.current_medicines || 'None reported',
          lastCheckup: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'New Account'
        })

        if (data.chat_history && Array.isArray(data.chat_history) && data.chat_history.length > 0) {
          const sortedHistory = [...data.chat_history].sort((a: any, b: any) => a.updatedAt - b.updatedAt)
          
          const timelineEvents = sortedHistory.map((session: any) => {
            const calculatedSeverity = Math.min(Math.max((session?.messages?.length || 1) - 1, 1), 10)
            const firstUserMessage = session?.messages?.find((m: any) => m.role === 'user')
            
            let description = 'General health consultation.';
            if (firstUserMessage && firstUserMessage.content) {
                if (typeof firstUserMessage.content === 'string') {
                    description = firstUserMessage.content;
                } else if (Array.isArray(firstUserMessage.content)) {
                    const textObj = firstUserMessage.content.find((c: any) => c.type === 'text');
                    if (textObj && textObj.text) description = textObj.text;
                }
            }
            
            const safeDescription = description || 'General health consultation.';

            return {
              id: session.id,
              date: session.updatedAt ? new Date(session.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent',
              event: session.title === 'New Conversation' ? 'Consultation' : (session.title || 'Chat'),
              type: 'symptom',
              severity: calculatedSeverity, 
              desc: safeDescription.length > 60 ? safeDescription.substring(0, 60) + '...' : safeDescription
            }
          })

          setHealthTimeline(timelineEvents)
        } else {
          setHealthTimeline([])
        }
      }
    } catch (err) {
      console.error("Error fetching profile data:", err)
      addToast('error', 'Error', 'Failed to load profile data.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    sessionStorage.clear()
    addToast('success', 'Logged Out', 'You have been logged out successfully')
    router.push('/login')
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">{data.date}</p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{data.event}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Severity: {data.severity}/10</p>
        </div>
      )
    }
    return null;
  }

  // FIXED: The whole page is wrapped statically to prevent router unmount loops
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
        <Navbar />

        {isLoading ? (
          <main className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </main>
        ) : (
          <main className="flex-1 px-4 py-8 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Your Dashboard</h1>
                  <p className="text-slate-600 dark:text-slate-400">Manage your health information and track your history</p>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
                  <LogOut size={18} /> Logout
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                        <User size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Logged in as {userProfileName}</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{userEmail}</p>
                      </div>
                    </div>
                    <button onClick={() => router.push('/profile')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                      View Profile
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-slate-900 dark:text-white">Account Status</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active & Verified</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Data synced with profile</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Your Health Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertCircle size={14}/> Allergies</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{healthData.allergies}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Heart size={14}/> Conditions</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{healthData.diseases}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Pill size={14}/> Medications</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">{healthData.medicines}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle2 size={14}/> Profile Updated</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{healthData.lastCheckup}</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Longitudinal Health Timeline</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Verified history tracked directly from your consultations</p>
                  </div>
                </div>

                {healthTimeline.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Consultation & Symptom Severity</h3>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={healthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} />
                            <RechartsTooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="severity" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSeverity)" activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col h-full max-h-[340px]">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 shrink-0">Event Log</h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pb-4">
                          {healthTimeline.map((item) => (
                            <div key={item.id} className="relative pl-6">
                              <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center bg-blue-500">
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              </div>
                              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">{item.date}</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.event}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed italic line-clamp-2">"{item.desc}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center flex flex-col items-center justify-center">
                    <Activity size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Health Events Recorded</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">Your timeline will automatically populate based on the medical consultations and symptom checks you perform with the HealthChat AI.</p>
                    <Link href="/chatbot" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
                      <MessageSquare size={18} /> Start a Consultation
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Link href="/chatbot" className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                      <MessageSquare size={20} className="text-blue-600 group-hover:text-white" />
                    </div>
                    <ChevronRight size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Chat with AI</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Get instant health advice from our AI-powered chatbot</p>
                </Link>

                <Link href="/profile" className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-green-500 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      <Heart size={20} className="text-green-600 group-hover:text-white" />
                    </div>
                    <ChevronRight size={20} className="text-slate-400 group-hover:text-green-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Update Health Data</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">View and manage your medical information and history</p>
                </Link>

                <Link href="/settings" className="group p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                      <Settings size={20} className="text-purple-600 group-hover:text-white" />
                    </div>
                    <ChevronRight size={20} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Settings</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Update your account settings and preferences</p>
                </Link>
              </div>
            </div>
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  )
}