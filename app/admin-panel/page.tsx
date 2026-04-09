'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Activity, FileText, Trash2, Ban, CheckCircle, Mail, Image as ImageIcon, X, Send, Eye, ShieldAlert, LogOut, Search, Loader2, AlertTriangle, Shield, HeartPulse } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProtectedRoute } from '@/context/AuthContext'

export default function AdminPanel() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [userFilter, setUserFilter] = useState('all') // 'all', 'active', 'suspended'
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [activeModalTab, setActiveModalTab] = useState('self') 
  
  // Broadcast State
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  const AUTHORIZED_ADMIN_EMAILS = ['healthchat88@gmail.com', 'admin@healthchat.com']

  useEffect(() => {
    const verifyAdmin = async () => {
      const email = sessionStorage.getItem('userEmail')
      if (!email || !AUTHORIZED_ADMIN_EMAILS.includes(email)) {
        toast.error('Unauthorized Access. Incident logged.')
        router.push('/dashboard')
        return
      }
      setIsAuthorized(true)
      fetchUsers()
    }
    verifyAdmin()
  }, [router])

  // --- UPDATED: Securely fetch users via API ---
  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.users) {
        setUsers(data.users)
      } else {
        toast.error(data.error || "Failed to fetch directory")
      }
    } catch (error) {
      toast.error("API connection error")
    } finally {
      setLoading(false)
    }
  }

  // --- UPDATED: Securely update ban status via API ---
  const toggleBan = async (email: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const toastId = toast.loading('Updating account status...')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_ban', email, is_banned: newStatus })
      })
      if (!res.ok) throw new Error('Update failed')
      
      setUsers(users.map(u => u.email === email ? { ...u, is_banned: newStatus } : u))
      toast.success(newStatus ? 'Account suspended successfully' : 'Account access restored', { id: toastId })
    } catch (error) {
      toast.error('Failed to update account status', { id: toastId })
    }
  }

  // --- UPDATED: Securely delete user via API ---
  const deleteUser = async (email: string) => {
    if (!confirm('CRITICAL ACTION: Are you sure you want to permanently delete this user and all associated family records? This cannot be undone.')) return
    const toastId = toast.loading('Purging account...')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error('Deletion failed')

      setUsers(users.filter(u => u.email !== email))
      toast.success('Household records permanently deleted', { id: toastId })
    } catch (error) {
      toast.error('Failed to delete user', { id: toastId })
    }
  }

  // --- UPDATED: Securely delete file via API ---
  const deleteFile = async (fileUrl: string, userEmail: string, memberId: string | null) => {
    if (!confirm("Remove this medical document from the server?")) return
    const toastId = toast.loading("Purging document...")
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_file', fileUrl, userEmail, memberId })
      })
      if (!res.ok) throw new Error("File deletion failed")

      // Update UI state locally
      const user = users.find(u => u.email === userEmail)
      let updatedUser = { ...user }

      if (memberId) {
        updatedUser.family_members = user.family_members.map((m: any) =>
          m.id === memberId ? { ...m, file_urls: (m.file_urls || []).filter((fStr: string) => !fStr.includes(fileUrl)) } : m
        )
      } else {
        updatedUser.file_urls = user.file_urls.filter((fStr: string) => !fStr.includes(fileUrl))
      }

      setUsers(users.map(u => u.email === userEmail ? updatedUser : u))
      toast.success("Document purged", { id: toastId })
    } catch (error) {
      toast.error("Failed to delete document", { id: toastId })
    }
  }

  const sendBroadcast = async () => {
    if (!subject || !message) return toast.error("Complete all fields before deploying")
    const activeEmails = users.filter(u => !u.is_banned).map(u => u.email)
    if (activeEmails.length === 0) return toast.error("No active users available")

    setIsBroadcasting(true)
    const toastId = toast.loading("Deploying network broadcast...")
    try {
      const res = await fetch('/api/broadcast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emails: activeEmails, subject, message }) })
      if (!res.ok) throw new Error("Failed")
      toast.success(`Secure broadcast deployed to ${activeEmails.length} nodes.`, { id: toastId })
      setSubject(''); setMessage('')
    } catch (error) { toast.error("Broadcast deployment failed.", { id: toastId }) } finally { setIsBroadcasting(false) }
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
            try { const f = JSON.parse(fStr); return { ...f, userEmail: u.email, userName: `${member.full_name}`, memberId: member.id } } catch { return null }
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
  
  // Advanced Filtering
  let filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())))
  if (userFilter === 'active') filteredUsers = filteredUsers.filter(u => !u.is_banned)
  if (userFilter === 'suspended') filteredUsers = filteredUsers.filter(u => u.is_banned)

  const totalPatients = users.length + users.reduce((acc, curr) => acc + (curr.family_members?.length || 0), 0)

  if (!isAuthorized) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>

  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-[#0B1120] text-slate-300 overflow-hidden font-sans selection:bg-blue-500/30">
        
        {/* SIDEBAR */}
        <aside className="w-64 bg-slate-900/50 flex flex-col shrink-0 border-r border-slate-800/60 hidden md:flex backdrop-blur-xl">
          <div className="h-20 flex items-center px-6 border-b border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20 mr-3">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide block leading-tight">Admin System</span>
              <span className="text-[10px] uppercase tracking-widest text-blue-400 font-semibold">HealthChat OS</span>
            </div>
          </div>
          <nav className="flex-1 py-6 px-4 space-y-1.5">
            {[
              { id: 'users', icon: Users, label: 'Patient Directory' },
              { id: 'moderation', icon: ImageIcon, label: 'Document Control' },
              { id: 'broadcast', icon: Mail, label: 'Comms Uplink' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-inner' : 'hover:bg-slate-800/50 hover:text-white border border-transparent'}`}>
                <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-500' : 'text-slate-500'} /> {tab.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800/60">
            <button onClick={() => router.push('/dashboard')} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition border border-transparent hover:border-slate-700">
              <LogOut size={16} /> Terminate Session
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-90 -z-10"></div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar z-10">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">Command Center</h1>
                  <p className="text-slate-400 mt-1">Manage network activity, documents, and communications.</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Primary Accounts', val: users.length, icon: Users, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
                  { label: 'Total Network Patients', val: totalPatients, icon: HeartPulse, color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/10' },
                  { label: 'System Documents', val: allFiles.length, icon: FileText, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
                  { label: 'Suspended Nodes', val: users.filter(u => u.is_banned).length, icon: AlertTriangle, color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/10' }
                ].map((s, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${s.border} bg-slate-900/50 backdrop-blur-md shadow-lg flex flex-col justify-between h-36 transition hover:bg-slate-800/50`}>
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}><s.icon size={20} /></div>
                    </div>
                    <div>
                      <span className="text-3xl font-black text-white">{s.val}</span>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* TAB CONTENT: USERS */}
              {activeTab === 'users' && (
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl shadow-xl flex flex-col overflow-hidden h-[600px]">
                  <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-900/80">
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      {['all', 'active', 'suspended'].map(filter => (
                        <button key={filter} onClick={() => setUserFilter(filter)} className={`px-4 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition ${userFilter === filter ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>
                          {filter}
                        </button>
                      ))}
                    </div>
                    <div className="relative w-full lg:w-72">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input type="text" placeholder="Search registry..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-700 bg-slate-950/50 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder:text-slate-600 transition" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-800">
                        <tr>
                          <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Primary Holder</th>
                          <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Contact Identifier</th>
                          <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Dependents</th>
                          <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                          <th className="p-5 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {loading ? <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-500 mb-3" size={32}/> <span className="text-slate-400">Syncing database...</span></td></tr> : 
                        filteredUsers.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-slate-500">No matching records found.</td></tr> :
                        filteredUsers.map((u, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 transition duration-150 group">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">{u.full_name?.charAt(0) || '?'}</div>
                                <span className="font-semibold text-slate-200">{u.full_name || 'Anonymous User'}</span>
                              </div>
                            </td>
                            <td className="p-5 text-slate-400 font-mono text-xs">{u.email}</td>
                            <td className="p-5 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-800 border border-slate-700 rounded-md font-bold text-slate-300 text-xs">{u.family_members?.length || 0}</span>
                            </td>
                            <td className="p-5">
                              {u.is_banned ? 
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-wider border border-rose-500/20"><Ban size={10}/> Suspended</span> : 
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20"><CheckCircle size={10}/> Active</span>
                              }
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setSelectedUser(u); setActiveModalTab('self'); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition border border-transparent hover:border-blue-500/20" title="View Medical Record"><Eye size={16} /></button>
                                <button onClick={() => toggleBan(u.email, u.is_banned)} className={`p-2 rounded-lg transition border border-transparent ${u.is_banned ? 'text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20' : 'text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20'}`} title={u.is_banned ? "Restore Access" : "Suspend Access"}>{u.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}</button>
                                <button onClick={() => deleteUser(u.email)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500/20" title="Purge Account"><Trash2 size={16} /></button>
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
                <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 min-h-[500px]">
                  <h2 className="font-bold text-lg mb-6 flex items-center gap-2"><ImageIcon className="text-emerald-500"/> Document Ledger</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
                    {allFiles.length === 0 && <div className="col-span-full py-32 flex flex-col items-center justify-center text-slate-600"><FileText size={48} className="mb-4 opacity-20"/><p>Repository is empty.</p></div>}
                    {allFiles.map((file, i) => (
                      <div key={i} className="group relative rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-950 shadow-lg aspect-[4/5] hover:border-slate-500 transition-colors">
                        <img src={file.url} alt="Medical Document" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                          <p className="text-white text-sm font-bold leading-tight">{file.userName}</p>
                          <p className="text-slate-400 text-[10px] font-mono truncate mt-1 mb-4">{file.userEmail}</p>
                          <button onClick={() => deleteFile(file.url, file.userEmail, file.memberId)} className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-rose-900/50">
                            <Trash2 size={14} /> Purge File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center"><Mail size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Network Broadcast</h2>
                      <p className="text-sm text-slate-400 mt-1">Transmit secure notification to {users.filter(u=>!u.is_banned).length} active nodes.</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Transmission Subject</label>
                      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Protocol Update V2.1" className="w-full p-4 rounded-xl border border-slate-700 bg-slate-950/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition text-white placeholder:text-slate-600" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Encrypted Payload</label>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={8} placeholder="Enter message payload..." className="w-full p-4 rounded-xl border border-slate-700 bg-slate-950/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition text-white placeholder:text-slate-600 leading-relaxed" />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button onClick={sendBroadcast} disabled={isBroadcasting} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition shadow-lg shadow-indigo-900/50 disabled:opacity-50 disabled:shadow-none w-full md:w-auto">
                        {isBroadcasting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isBroadcasting ? 'Transmitting...' : 'Deploy Payload'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: EHR PROFILE VIEWER */}
              {selectedUser && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                    
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                      <div className="flex items-center gap-3">
                        <Activity className="text-blue-500" size={24} />
                        <h3 className="font-bold text-xl text-white tracking-tight">Electronic Health Record</h3>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition"><X size={20} /></button>
                    </div>

                    <div className="flex overflow-x-auto p-4 gap-3 bg-slate-950/50 border-b border-slate-800 shrink-0 custom-scrollbar">
                      <button onClick={() => setActiveModalTab('self')} className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition border ${activeModalTab === 'self' ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>
                        Primary: {selectedUser.full_name?.split(' ')[0] || 'Unknown'}
                      </button>
                      {selectedUser.family_members?.map((m: any) => (
                        <button key={m.id} onClick={() => setActiveModalTab(m.id)} className={`px-5 py-2.5 text-sm font-bold rounded-xl whitespace-nowrap transition border ${activeModalTab === m.id ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-600'}`}>
                          Dependent: {m.full_name?.split(' ')[0] || 'Unnamed'}
                        </button>
                      ))}
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-900 flex-1">
                      {activeProfileDisplay ? (
                        <div className="space-y-8">
                          <div className="flex items-center gap-5 pb-6 border-b border-slate-800/50">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-3xl font-black text-slate-500 shadow-inner">{activeProfileDisplay.full_name?.charAt(0) || '?'}</div>
                            <div>
                              <h4 className="text-2xl font-bold text-white tracking-tight">{activeProfileDisplay.full_name || 'No Name Provided'}</h4>
                              {activeModalTab === 'self' && <p className="text-sm text-slate-400 font-mono mt-1">{selectedUser.email}</p>}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50 flex flex-col justify-center">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Users size={12}/> Age Profile</p>
                              <p className="text-xl font-bold text-slate-200">{activeProfileDisplay.age || 'Unspecified'}</p>
                            </div>
                            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50 flex flex-col justify-center">
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-2"><Activity size={12}/> Biological Sex</p>
                              <p className="text-xl font-bold text-slate-200 capitalize">{activeProfileDisplay.gender || 'Unspecified'}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-800/20 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Chronic Conditions</p>
                              <p className="text-sm leading-relaxed text-slate-300">{activeProfileDisplay.existing_diseases || 'No chronic conditions reported in database.'}</p>
                            </div>
                            
                            <div className="p-6 rounded-2xl border border-rose-900/30 bg-rose-500/5 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                              <p className="text-[10px] text-rose-500/70 uppercase font-bold tracking-widest mb-3">Known Allergies</p>
                              <p className="text-sm leading-relaxed text-rose-300 font-medium">{activeProfileDisplay.allergies || 'No allergies documented.'}</p>
                            </div>
                            
                            <div className="p-6 rounded-2xl border border-blue-900/30 bg-blue-500/5 relative overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                              <p className="text-[10px] text-blue-500/70 uppercase font-bold tracking-widest mb-3">Active Prescriptions</p>
                              <p className="text-sm leading-relaxed text-blue-300 font-medium">{activeProfileDisplay.current_medicines || 'No active medications listed.'}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-24 flex flex-col items-center justify-center text-slate-600"><ShieldAlert size={48} className="mb-4 opacity-20"/><p>Medical records unavailable.</p></div>
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