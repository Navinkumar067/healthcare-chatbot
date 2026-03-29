'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { LogOut, MessageSquare, User, Heart, Settings, Activity, Pill, AlertCircle, Bell, Clock, Trash2, FileText, PhoneCall, ShieldAlert, ArrowRight, Download, Edit2, Check, X } from 'lucide-react'
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
    allergies: 'Loading...', diseases: 'Loading...', medicines: 'Loading...', lastCheckup: 'Loading...'
  })
  
  const [healthTimeline, setHealthTimeline] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  const [recentFiles, setRecentFiles] = useState<any[]>([])
  const [profileScore, setProfileScore] = useState(0)

  // Edit Reminder States
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [editTimeValue, setEditTimeValue] = useState('')

  useEffect(() => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      fetchUserProfile(email)
      fetchReminders(email)
    } else {
      setIsLoading(false)
      router.push('/login')
    }
  }, [router])

  const fetchReminders = async (email: string) => {
    const { data } = await supabase.from('medicine_reminders').select('*').eq('user_email', email)
    if (data) setReminders(data)
  }

  const deleteReminder = async (id: string) => {
    await supabase.from('medicine_reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
    addToast('success', 'Reminder Removed', 'You will no longer be notified for this medication.')
  }

  const startEditingReminder = (id: string, currentTime: string) => {
    setEditingReminderId(id)
    setEditTimeValue(currentTime)
  }

  const saveReminderTime = async (id: string) => {
    if (!editTimeValue.trim()) return setEditingReminderId(null)
    
    // Auto-format to ensure AM/PM is capitalized so the background tracker catches it
    const formattedTime = editTimeValue.trim().toUpperCase()

    const { error } = await supabase.from('medicine_reminders').update({ reminder_time: formattedTime }).eq('id', id)
    
    if (error) {
      addToast('error', 'Failed to update', 'Could not save the new time.')
    } else {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, reminder_time: formattedTime } : r))
      addToast('success', 'Time Updated', `Reminder changed to ${formattedTime}`)
    }
    setEditingReminderId(null)
  }

  const safeParseFile = (fStr: string) => {
    try { return JSON.parse(fStr); } catch { return { name: 'Attached File', url: fStr }; }
  }

  const fetchUserProfile = async (email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single()
      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setUserProfileName(data.full_name || 'User')
        
        setHealthData({
          allergies: data.allergies || 'None reported',
          diseases: data.existing_diseases || 'None reported',
          medicines: data.current_medicines || 'None reported',
          lastCheckup: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'New Account'
        })

        // Calculate Profile Completeness Score
        let score = 0;
        if (data.full_name) score += 20;
        if (data.age && data.gender) score += 20;
        if (data.allergies) score += 20;
        if (data.existing_diseases) score += 20;
        if (data.current_medicines) score += 20;
        setProfileScore(score);

        // Extract Recent Files
        if (data.file_urls && Array.isArray(data.file_urls)) {
            const parsedFiles = data.file_urls.map(safeParseFile).reverse().slice(0, 3);
            setRecentFiles(parsedFiles);
        }

        // Extract Timeline
        if (data.chat_history && Array.isArray(data.chat_history) && data.chat_history.length > 0) {
          const sortedHistory = [...data.chat_history].sort((a: any, b: any) => a.updatedAt - b.updatedAt)
          const timelineEvents = sortedHistory.map((session: any) => {
            const calculatedSeverity = Math.min(Math.max((session?.messages?.length || 1) - 1, 1), 10)
            const firstUserMessage = session?.messages?.find((m: any) => m.role === 'user')
            
            let description = 'General health consultation.';
            if (firstUserMessage && firstUserMessage.content) {
                if (typeof firstUserMessage.content === 'string') description = firstUserMessage.content;
                else if (Array.isArray(firstUserMessage.content)) {
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
        } else setHealthTimeline([])
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

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />

        {isLoading ? (
          <main className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" text="Loading dashboard..." />
          </main>
        ) : (
          <main className="flex-1 px-4 py-8 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-8">
              
              {/* Header & Action Bar */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">Welcome back, {userProfileName.split(' ')[0] || 'User'}</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Here is your medical overview for today.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                  <a href="tel:108" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 font-bold rounded-xl transition-colors">
                    <PhoneCall size={18} /> Call 108
                  </a>
                  
                  <button onClick={() => router.push('/settings')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors shadow-sm">
                    <Settings size={18} className="text-slate-400" /> Settings
                  </button>

                  <button onClick={handleLogout} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors">
                    <LogOut size={18} className="text-slate-500" /> Logout
                  </button>
                </div>
              </div>

              {/* Top Grid: Profile Info & Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      <User size={32} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{userProfileName}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{userEmail}</p>
                      <Link href="/profile" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        Edit Medical Profile <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                     <Link href="/chatbot" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors">
                       <MessageSquare size={18} /> New AI Consult
                     </Link>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-center shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-[100px] -z-10"></div>
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldAlert size={16} className={profileScore === 100 ? "text-green-500" : "text-amber-500"}/> Profile Health
                  </h3>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{profileScore}%</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2">
                    <div className={`h-2.5 rounded-full ${profileScore === 100 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${profileScore}%` }}></div>
                  </div>
                  {profileScore < 100 && <p className="text-xs text-slate-500 dark:text-slate-400">Update your profile for better AI analysis.</p>}
                </div>
              </div>

              {/* Quick Health Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlertCircle size={12}/> Allergies</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{healthData.allergies}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Heart size={12}/> Conditions</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{healthData.diseases}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Pill size={12}/> Medications</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{healthData.medicines}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity size={12}/> Last Sync</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">{healthData.lastCheckup}</p>
                </div>
              </div>

              {/* Middle Grid: Reminders & Recent Documents */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Reminders */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell size={20} className="text-amber-500" /> Active Reminders
                    </h2>
                    <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg">{reminders.length} Active</span>
                  </div>

                  {reminders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-2 max-h-[200px]">
                      {reminders.map((reminder) => (
                        <div key={reminder.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between group">
                          
                          {/* EDIT MODE OR VIEW MODE */}
                          {editingReminderId === reminder.id ? (
                            <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95">
                              <input 
                                type="text" 
                                value={editTimeValue}
                                onChange={(e) => setEditTimeValue(e.target.value)}
                                className="w-full p-2 text-sm font-bold border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                                placeholder="08:00 PM"
                                autoFocus
                              />
                              <button onClick={() => saveReminderTime(reminder.id)} className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors shadow-sm"><Check size={16} /></button>
                              <button onClick={() => setEditingReminderId(null)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"><X size={16} /></button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg shrink-0">
                                  <Clock size={18} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="truncate pr-2">
                                  <p className="font-bold text-slate-900 dark:text-white text-md">{reminder.reminder_time}</p>
                                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{reminder.medicine_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditingReminder(reminder.id, reminder.reminder_time)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => deleteReminder(reminder.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                       <Clock size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No alarms set.</p>
                       <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Ask the AI to set a reminder for your prescriptions.</p>
                    </div>
                  )}
                </div>

                {/* Recent Documents */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText size={20} className="text-blue-500" /> Recent Reports
                    </h2>
                    <Link href="/profile" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">View All</Link>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-3 justify-start">
                    {recentFiles.length > 0 ? (
                      recentFiles.map((file, i) => (
                        <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl transition-colors group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText size={16} className="text-slate-400 shrink-0" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                          </div>
                          <Download size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                        </a>
                      ))
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                         <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">No documents uploaded.</p>
                         <Link href="/profile" className="text-xs px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-bold">Upload Medical File</Link>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Timeline Section */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Activity size={20} className="text-indigo-500"/> Health Timeline</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Severity tracking based on your AI consultations</p>
                  </div>
                </div>

                {healthTimeline.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={healthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="severity" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSeverity)" activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col h-full max-h-[256px]">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 shrink-0">Recent Logs</h3>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-5 pb-2">
                          {healthTimeline.slice(0, 5).map((item) => (
                            <div key={item.id} className="relative pl-5">
                              <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 flex items-center justify-center bg-indigo-500"></div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">{item.date}</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.event}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">"{item.desc}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <Activity size={40} className="text-slate-200 dark:text-slate-800 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No history recorded yet.</p>
                    <p className="text-sm text-slate-400 mt-1 mb-4">Your chart will build as you consult the AI.</p>
                  </div>
                )}
              </div>

            </div>
          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  )
}