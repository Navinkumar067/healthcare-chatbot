'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Activity, FileText, Trash2, Ban, CheckCircle, Mail, Image as ImageIcon, X, Send, Eye, ShieldAlert, LogOut, Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ProtectedRoute } from '@/context/AuthContext'

export default function AdminPanel() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [activeModalTab, setActiveModalTab] = useState('self') 
  
  // Broadcast State
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  // ⚠️ THE SECURITY GATEWAY: Add your exact registration email here
  const AUTHORIZED_ADMIN_EMAILS = ['healthchat88@gmail.com', 'admin@healthchat.com']

  useEffect(() => {
    const verifyAdmin = async () => {
      const email = sessionStorage.getItem('userEmail')
      if (!email || !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        toast.error('Unauthorized. Security breach logged.')
        router.push('/dashboard') // Kick them back to the user area
        return
      }
      setIsAuthorized(true)
      fetchUsers()
    }
    verifyAdmin()
  }, [router])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  const toggleBan = async (email: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const { error } = await supabase.from('profiles').update({ is_banned: newStatus }).eq('email', email)
    if (!error) {
      setUsers(users.map(u => u.email === email ? { ...u, is_banned: newStatus } : u))
      toast.success(newStatus ? 'Account suspended' : 'Account restored')
    } else {
      toast.error('Failed to update status')
    }
  }

  const deleteUser = async (email: string) => {
    if (!confirm('Are you sure you want to permanently delete this user AND their family members?')) return
    const { error } = await supabase.from('profiles').delete().eq('email', email)
    if (!error) {
      setUsers(users.filter(u => u.email !== email))
      toast.success('User and household deleted')
    }
  }

  const deleteFile = async (fileUrl: string, userEmail: string, memberId: string | null) => {
    if (!confirm("Delete this image permanently from the server?")) return
    const toastId = toast.loading("Deleting file...")
    try {
      const fileName = fileUrl.split('/').pop()
      if (fileName) await supabase.storage.from('reports').remove([fileName])

      const user = users.find(u => u.email === userEmail)
      let updatedUser = { ...user }

      if (memberId) {
        updatedUser.family_members = user.family_members.map((m: any) =>
          m.id === memberId ? { ...m, file_urls: (m.file_urls || []).filter((fStr: string) => !fStr.includes(fileUrl)) } : m
        )
        await supabase.from('profiles').update({ family_members: updatedUser.family_members }).eq('email', userEmail)
      } else {
        updatedUser.file_urls = user.file_urls.filter((fStr: string) => !fStr.includes(fileUrl))
        await supabase.from('profiles').update({ file_urls: updatedUser.file_urls }).eq('email', userEmail)
      }

      setUsers(users.map(u => u.email === userEmail ? updatedUser : u))
      toast.success("Image removed", { id: toastId })
    } catch (error) {
      toast.error("Failed to delete image", { id: toastId })
    }
  }

  const sendBroadcast = async () => {
    if (!subject || !message) return toast.error("Fill in all fields")
    const activeEmails = users.filter(u => !u.is_banned).map(u => u.email)
    if (activeEmails.length === 0) return toast.error("No active users to email")

    setIsBroadcasting(true)
    const toastId = toast.loading("Sending broadcast...")
    try {
      const res = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails: activeEmails, subject, message }) })
      if (!res.ok) throw new Error("Failed")
      toast.success(`Broadcast sent to ${activeEmails.length} households!`, { id: toastId })
      setSubject(''); setMessage('')
    } catch (error) { toast.error("Failed to send broadcast.", { id: toastId }) } finally { setIsBroadcasting(false) }
  }

  const allFiles = users.flatMap(u => {
    let files: any[] = []
    if (u.file_urls) {
      files.push(...u.file_urls.map((fStr: string) => {
        try { const f = JSON.parse(fStr); return { ...f, userEmail: u.email, userName: u.full_name, memberId: null } } catch { return null }
      }).filter(Boolean))
    }
    if (u.family_members) {
      u.family_members.forEach((member: any) => {
        if (member.file_urls) {
          files.push(...member.file_urls.map((fStr: string) => {
            try { const f = JSON.parse(fStr); return { ...f, userEmail: u.email, userName: `${member.full_name} (Family)`, memberId: member.id } } catch { return null }
          }).filter(Boolean))
        }
      })
    }
    return files
  })

  const getActiveModalProfile = () => {
    if (!selectedUser) return null
    if (activeModalTab === 'self') return selectedUser
    return selectedUser.family_members?.find((m: any) => m.id === activeModalTab)
  }

  const activeProfileDisplay = getActiveModalProfile()
  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())))

  if (!isAuthorized) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Activity className="animate-spin text-blue-500" /></div>

  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
        
        {/* PROFESSIONAL ADMIN SIDEBAR */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 hidden md:flex">
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <ShieldAlert className="text-blue-500 mr-2" size={20} />
            <span className="font-bold text-white tracking-wider uppercase text-sm">Command Center</span>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-2">
            {[
              { id: 'users', icon: Users, label: 'User Directory' },
              { id: 'moderation', icon: ImageIcon, label: 'Content Moderation' },
              { id: 'broadcast', icon: Mail, label: 'System Broadcast' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={() => router.push('/dashboard')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
              <LogOut size={16} /> Exit Admin
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Mobile Header */}
          <header className="md:hidden h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 text-blue-600 font-bold"><ShieldAlert size={20} /> Admin</div>
            <button onClick={() => router.push('/dashboard')} className="text-slate-500"><X size={24} /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-8">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Accounts', val: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Active Reports', val: allFiles.length, icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'Suspended', val: users.filter(u => u.is_banned).length, icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10' },
                  { label: 'System Status', val: 'Healthy', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                ].map((s, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}><s.icon size={20} /></div>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</span>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TAB CONTENT: USERS */}
              {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[500px]">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <h2 className="font-bold text-lg">User Directory</h2>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="text" placeholder="Search email or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                        <tr>
                          <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Account Holder</th>
                          <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Email</th>
                          <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Members</th>
                          <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 mb-2"/> Loading records...</td></tr> : 
                        filteredUsers.map((u, i) => (
                          <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${u.is_banned ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                            <td className="p-4 font-medium flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold">{u.full_name?.charAt(0) || '?'}</div>
                              {u.full_name || 'Unknown User'}
                              {u.is_banned && <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold uppercase">Banned</span>}
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                            <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-600 dark:text-slate-300 text-xs">{u.family_members?.length || 0}</span></td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => { setSelectedUser(u); setActiveModalTab('self'); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="View Profile"><Eye size={16} /></button>
                                <button onClick={() => toggleBan(u.email, u.is_banned)} className={`p-2 rounded-lg transition ${u.is_banned ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`} title={u.is_banned ? "Restore User" : "Suspend User"}>{u.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}</button>
                                <button onClick={() => deleteUser(u.email)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete Account & Family"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: MODERATION */}
              {activeTab === 'moderation' && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allFiles.length === 0 && <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400"><ImageIcon size={48} className="mb-4 opacity-20"/><p>No images uploaded across the network.</p></div>}
                  {allFiles.map((file, i) => (
                    <div key={i} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm aspect-square">
                      <img src={file.url} alt="User Upload" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-bold leading-tight">{file.userName}</p>
                        <p className="text-slate-300 text-[10px] truncate mt-0.5 mb-3">{file.userEmail}</p>
                        <button onClick={() => deleteFile(file.url, file.userEmail, file.memberId)} className="w-full py-2 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 backdrop-blur-sm transition">
                          <Trash2 size={14} /> Remove File
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB CONTENT: BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><Mail size={28} /></div>
                    <div><h2 className="text-xl font-bold">System Broadcast</h2><p className="text-sm text-slate-500 mt-1">Deploy an email notification to {users.filter(u=>!u.is_banned).length} active households.</p></div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email Subject</label>
                      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Important Health App Update" className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none transition shadow-inner" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Message Body</label>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Write your broadcast message here..." className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none resize-none transition shadow-inner" />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button onClick={sendBroadcast} disabled={isBroadcasting} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none w-full md:w-auto">
                        {isBroadcasting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isBroadcasting ? 'Deploying...' : 'Deploy Broadcast'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: PROFILE VIEWER */}
              {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                      <h3 className="font-bold flex items-center gap-2 text-lg">Household Records</h3>
                      <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition"><X size={20} /></button>
                    </div>

                    <div className="flex overflow-x-auto p-3 gap-2 bg-slate-100 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800 shrink-0 custom-scrollbar">
                      <button onClick={() => setActiveModalTab('self')} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition ${activeModalTab === 'self' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        Primary: {selectedUser.full_name?.split(' ')[0] || 'Unknown'}
                      </button>
                      {selectedUser.family_members?.map((m: any, idx: number) => (
                        <button key={m.id} onClick={() => setActiveModalTab(m.id)} className={`px-4 py-2 text-sm font-bold rounded-lg whitespace-nowrap transition ${activeModalTab === m.id ? 'bg-slate-900 text-white dark:bg-amber-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                          Family: {m.full_name?.split(' ')[0] || 'Unnamed'}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar">
                      {activeProfileDisplay ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-slate-400">{activeProfileDisplay.full_name?.charAt(0) || '?'}</div>
                            <div>
                              <h4 className="text-xl font-bold">{activeProfileDisplay.full_name || 'No Name Provided'}</h4>
                              {activeModalTab === 'self' && <p className="text-sm text-slate-500">{selectedUser.email}</p>}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Age</p><p className="font-bold">{activeProfileDisplay.age || 'Not set'}</p></div>
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Gender</p><p className="font-bold capitalize">{activeProfileDisplay.gender || 'Not set'}</p></div>
                          </div>
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Existing Diseases</p><p className="text-sm leading-relaxed">{activeProfileDisplay.existing_diseases || 'None reported'}</p></div>
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Allergies</p><p className="text-sm leading-relaxed text-red-600 dark:text-red-400 font-medium">{activeProfileDisplay.allergies || 'None reported'}</p></div>
                            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800"><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Current Medications</p><p className="text-sm leading-relaxed text-blue-600 dark:text-blue-400 font-medium">{activeProfileDisplay.current_medicines || 'None reported'}</p></div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400"><Users size={40} className="mb-4 opacity-20"/><p>Profile data could not be loaded.</p></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}