'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Users, Activity, FileText, Trash2, Ban, CheckCircle, Mail, Image as ImageIcon, X, Send, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  
  // Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [activeModalTab, setActiveModalTab] = useState('self') // 'self' or member.id
  
  // Broadcast State
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isBroadcasting, setIsBroadcasting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*')
    if (data) setUsers(data)
    setLoading(false)
  }

  const toggleBan = async (email: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const { error } = await supabase.from('profiles').update({ is_banned: newStatus }).eq('email', email)
    if (!error) {
      setUsers(users.map(u => u.email === email ? { ...u, is_banned: newStatus } : u))
      toast.success(newStatus ? 'User suspended' : 'User restored')
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

  // UPDATED: Content Moderation Delete File (Handles Main User & Family Members)
  const deleteFile = async (fileUrl: string, userEmail: string, memberId: string | null) => {
    if (!confirm("Delete this image permanently from the server?")) return
    
    const toastId = toast.loading("Deleting file...")
    try {
      const fileName = fileUrl.split('/').pop()
      if (fileName) await supabase.storage.from('reports').remove([fileName])

      const user = users.find(u => u.email === userEmail)
      let updatedUser = { ...user }

      if (memberId) {
        // Remove from specific family member
        updatedUser.family_members = user.family_members.map((m: any) =>
          m.id === memberId ? { ...m, file_urls: (m.file_urls || []).filter((fStr: string) => !fStr.includes(fileUrl)) } : m
        )
        await supabase.from('profiles').update({ family_members: updatedUser.family_members }).eq('email', userEmail)
      } else {
        // Remove from main profile
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

  // UPDATED: Extract all files from main users AND their family members
  const allFiles = users.flatMap(u => {
    let files: any[] = []
    // 1. Get Main User files
    if (u.file_urls) {
      files.push(...u.file_urls.map((fStr: string) => {
        try { const f = JSON.parse(fStr); return { ...f, userEmail: u.email, userName: u.full_name, memberId: null } } catch { return null }
      }).filter(Boolean))
    }
    // 2. Get Family Member files
    if (u.family_members) {
      u.family_members.forEach((member: any) => {
        if (member.file_urls) {
          files.push(...member.file_urls.map((fStr: string) => {
            try { const f = JSON.parse(fStr); return { ...f, userEmail: u.email, userName: `${member.full_name} (Family of ${u.full_name})`, memberId: member.id } } catch { return null }
          }).filter(Boolean))
        }
      })
    }
    return files
  })

  // Helper function to get the profile data currently selected in the modal
  const getActiveModalProfile = () => {
    if (!selectedUser) return null
    if (activeModalTab === 'self') return selectedUser
    return selectedUser.family_members?.find((m: any) => m.id === activeModalTab)
  }

  const activeProfileDisplay = getActiveModalProfile()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Command Center</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Accounts', val: users.length, icon: Users, color: 'text-blue-600' },
            { label: 'Active Reports', val: allFiles.length, icon: FileText, color: 'text-green-600' },
            { label: 'Suspended', val: users.filter(u => u.is_banned).length, icon: Ban, color: 'text-red-600' },
            { label: 'System Status', val: 'Healthy', icon: Activity, color: 'text-purple-600' }
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                <span className="text-2xl font-bold">{s.val}</span>
              </div>
              <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${s.color}`}><s.icon size={20} /></div>
            </div>
          ))}
        </div>

        <div className="flex space-x-1 mb-6 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit">
          {[
            { id: 'users', icon: Users, label: 'User Directory' },
            { id: 'moderation', icon: ImageIcon, label: 'Content Moderation' },
            { id: 'broadcast', icon: Mail, label: 'Broadcast' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
              <tab.icon size={16} /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <th className="p-4 font-semibold">Account Holder</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Family Size</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${u.is_banned ? 'opacity-60' : ''}`}>
                      <td className="p-4 font-medium flex items-center gap-2">{u.full_name || 'Unknown'}</td>
                      <td className="p-4 text-slate-500">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-bold text-slate-600 dark:text-slate-300">
                          {u.family_members?.length || 0} Members
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-2">
                        <button onClick={() => { setSelectedUser(u); setActiveModalTab('self'); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="View Profile">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => toggleBan(u.email, u.is_banned)} className={`p-2 rounded-lg transition ${u.is_banned ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`} title={u.is_banned ? "Restore User" : "Suspend User"}>
                          {u.is_banned ? <CheckCircle size={18} /> : <Ban size={18} />}
                        </button>
                        <button onClick={() => deleteUser(u.email)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Delete Account & Family">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'moderation' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allFiles.length === 0 && <p className="col-span-full text-slate-500 text-center py-10">No images uploaded by any household yet.</p>}
            
            {allFiles.map((file, i) => (
              <div key={i} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <img src={file.url} alt="User Upload" className="w-full h-40 object-cover" />
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3">
                  <div>
                    <p className="text-white text-xs font-bold leading-tight">{file.userName}</p>
                    <p className="text-slate-300 text-[10px] truncate mt-1">{file.userEmail}</p>
                  </div>
                  <button onClick={() => deleteFile(file.url, file.userEmail, file.memberId)} className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Mail size={24} /></div>
              <div><h2 className="font-bold">Email Blast</h2><p className="text-xs text-slate-500">Send an email to all active registered accounts.</p></div>
            </div>
            <div className="space-y-4">
              <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Important Health Update!" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none" /></div>
              <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">Message</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Write your broadcast message here..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none resize-none" /></div>
              <button onClick={sendBroadcast} disabled={isBroadcasting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50">
                {isBroadcasting ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
                {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        )}

        {/* DETAILED USER MODAL WITH FAMILY TABS */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
              
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  Household Profiles
                </h3>
                <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"><X size={20} /></button>
              </div>

              {/* Patient Selector Tabs */}
              <div className="flex overflow-x-auto p-2 gap-2 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 shrink-0 custom-scrollbar">
                <button 
                  onClick={() => setActiveModalTab('self')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition ${activeModalTab === 'self' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Primary: {selectedUser.full_name?.split(' ')[0] || 'Unknown'}
                </button>
                {selectedUser.family_members?.map((m: any, idx: number) => (
                  <button 
                    key={m.id}
                    onClick={() => setActiveModalTab(m.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition ${activeModalTab === m.id ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    Family {idx + 1}: {m.full_name?.split(' ')[0] || 'Unnamed'}
                  </button>
                ))}
              </div>

              {/* Profile Details Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {activeProfileDisplay ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Full Name</p><p className="font-medium text-sm">{activeProfileDisplay.full_name || 'N/A'}</p></div>
                      {activeModalTab === 'self' && <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Account Email</p><p className="font-medium text-sm truncate">{selectedUser.email}</p></div>}
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Age</p><p className="font-medium text-sm">{activeProfileDisplay.age || 'N/A'}</p></div>
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gender</p><p className="font-medium text-sm capitalize">{activeProfileDisplay.gender || 'N/A'}</p></div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Existing Diseases</p><p className="text-sm bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{activeProfileDisplay.existing_diseases || 'None reported'}</p></div>
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Allergies</p><p className="text-sm bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{activeProfileDisplay.allergies || 'None reported'}</p></div>
                      <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Current Medications</p><p className="text-sm bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{activeProfileDisplay.current_medicines || 'None reported'}</p></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-10">Profile data not found.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  )
}