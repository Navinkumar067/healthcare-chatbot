'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ProtectedRoute } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  User, Bell, Shield, Save, 
  Download, Trash2, AlertTriangle, Lock, KeyRound, Mail, Loader2, Camera, Settings
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('account')
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  // Form States
  const [accountForm, setAccountForm] = useState({ fullName: '', phone: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [notifications, setNotifications] = useState({ emailAlerts: true, smsAlerts: false, medicineReminders: true })

  useEffect(() => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      fetchUserData(email)
    }
  }, [])

  const fetchUserData = async (email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single()
      if (data) {
        setAccountForm({ fullName: data.full_name || '', phone: data.phone || '' })
        if (data.preferences?.notifications) {
          setNotifications(data.preferences.notifications)
        }
      }
    } catch (err) {
      console.error("Error fetching data", err)
    }
  }

  // --- 1. CHANGE ACCOUNT DETAILS ---
  const handleSaveAccount = async () => {
    setIsLoading(true)
    const toastId = toast.loading('Saving account details...')
    try {
      const { error } = await supabase.from('profiles').update({ full_name: accountForm.fullName }).eq('email', userEmail)
      if (error) throw error
      toast.success('Account updated successfully!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Failed to update account.', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  // --- 2. SECURE PASSWORD CHANGE & RESET ---
  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return toast.error("Please enter both current and new passwords.")
    }
    setIsLoading(true)
    const toastId = toast.loading('Verifying and updating password...')
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordForm.currentPassword
      })

      if (signInError) throw new Error("Incorrect current password.")

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (updateError) throw updateError

      toast.success('Password updated successfully!', { id: toastId })
      setPasswordForm({ currentPassword: '', newPassword: '' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password.', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const toastId = toast.loading('Sending verification email...')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/settings`,
      })
      if (error) throw error
      toast.success('OTP / Reset link sent to your email!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email.', { id: toastId })
    }
  }

  // --- 3. NOTIFICATION PREFERENCES ---
  const handleSaveNotifications = async () => {
    setIsLoading(true)
    const toastId = toast.loading('Saving preferences...')
    try {
      const { data } = await supabase.from('profiles').select('preferences').eq('email', userEmail).single()
      const currentPrefs = data?.preferences || {}

      const updatedPrefs = { ...currentPrefs, notifications: notifications }
      const { error } = await supabase.from('profiles').update({ preferences: updatedPrefs }).eq('email', userEmail)
      
      if (error) throw error
      toast.success('Preferences saved!', { id: toastId })
    } catch (err) {
      toast.error('Failed to save preferences.', { id: toastId })
    } finally {
      setIsLoading(false)
    }
  }

  // --- 4. DATA MANAGEMENT ---
  const handleExportData = async () => {
    const toastId = toast.loading('Compiling your data...')
    try {
      const { data } = await supabase.from('profiles').select('*').eq('email', userEmail).single()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `HealthChat_Data_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      toast.success('Data exported successfully!', { id: toastId })
    } catch (err) {
      toast.error('Failed to export data.', { id: toastId })
    }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you absolutely sure? This will permanently delete your profile, chat history, and all medical data. This action CANNOT be undone.")
    if (!confirmDelete) return

    const toastId = toast.loading('Deleting account...')
    try {
      await supabase.from('profiles').delete().eq('email', userEmail)
      sessionStorage.clear()
      localStorage.clear()
      toast.success('Account deleted permanently.', { id: toastId })
      router.push('/signup')
    } catch (err) {
      toast.error('Failed to delete account.', { id: toastId })
    }
  }

  const TabButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all ${
        activeTab === id 
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600 rounded-r-xl' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent rounded-r-xl hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={18} className={activeTab === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} /> {label}
    </button>
  )

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        
        {/* Subtle Background Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-8 pt-10">
          <div className="max-w-6xl w-full mx-auto px-4 md:px-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Settings className="text-blue-600" size={28} /> Account Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Manage your personal preferences, security, and data privacy.
            </p>
          </div>
        </div>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 shrink-0 space-y-1 sticky top-24">
              <TabButton id="account" icon={User} label="Profile Details" />
              <TabButton id="security" icon={KeyRound} label="Security & Password" />
              <TabButton id="notifications" icon={Bell} label="Notifications" />
              <TabButton id="privacy" icon={Shield} label="Data & Privacy" />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-10 shadow-sm min-h-[500px]">
              
              {/* TAB 1: ACCOUNT DETAILS */}
              {activeTab === 'account' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6 flex items-center gap-6">
                    <div className="relative group cursor-pointer">
                      <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                        <User size={32} className="text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile Details</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Update your primary account information.</p>
                    </div>
                  </div>

                  <div className="space-y-6 max-w-lg">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Legal Name</label>
                      <input 
                        type="text" 
                        value={accountForm.fullName} 
                        onChange={(e) => setAccountForm({...accountForm, fullName: e.target.value})}
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 focus:bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" 
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="email" value={userEmail} disabled className="w-full pl-11 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed font-medium" />
                      </div>
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Lock size={12}/> Email cannot be changed</p>
                    </div>

                    <div className="pt-4">
                      <button onClick={handleSaveAccount} disabled={isLoading} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20">
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                        {isLoading ? 'Saving Changes...' : 'Save Profile Details'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SECURITY & PASSWORD */}
              {activeTab === 'security' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security & Password</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your password and secure your account.</p>
                  </div>

                  <div className="space-y-6 max-w-lg p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.currentPassword} 
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" 
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.newPassword} 
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all" 
                        placeholder="Create a strong new password"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-slate-200 dark:border-slate-700">
                      <button onClick={handleForgotPassword} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold transition-colors">
                        Forgot Old Password?
                      </button>
                      <button onClick={handleUpdatePassword} disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-xl transition-all shadow-sm disabled:opacity-70">
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Control how and when HealthChat contacts you.</p>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    
                    <div className="flex items-start sm:items-center justify-between p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:border-blue-300 transition-colors">
                      <div className="pr-4">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">Email Alerts</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Receive summarized health reports and critical account updates directly to your inbox.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                        <input type="checkbox" className="sr-only peer" checked={notifications.emailAlerts} onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})} />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-start sm:items-center justify-between p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:border-blue-300 transition-colors">
                      <div className="pr-4">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">SMS Alerts</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Get immediate text messages for urgent AI health detections or scheduled appointments.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                        <input type="checkbox" className="sr-only peer" checked={notifications.smsAlerts} onChange={(e) => setNotifications({...notifications, smsAlerts: e.target.checked})} />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-start sm:items-center justify-between p-5 border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/10 rounded-2xl">
                      <div className="pr-4">
                        <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                          Medicine Reminders 
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500 text-white rounded uppercase font-black tracking-wider">Active</span>
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Allow in-app and push notifications when it is time to take your prescribed medications.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                        <input type="checkbox" className="sr-only peer" checked={notifications.medicineReminders} onChange={(e) => setNotifications({...notifications, medicineReminders: e.target.checked})} />
                        <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    <div className="pt-6">
                      <button onClick={handleSaveNotifications} disabled={isLoading} className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-md">
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                        {isLoading ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PRIVACY & DELETE */}
              {activeTab === 'privacy' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data & Privacy</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Export your medical records or permanently close your account.</p>
                  </div>

                  <div className="space-y-6 max-w-2xl">
                    
                    {/* Export Data Card */}
                    <div className="p-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full shrink-0 w-fit">
                          <Download size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">Export Health Data</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-5 leading-relaxed">
                            Download a complete JSON copy of your medical profile, family members, AI chat history, and timeline events. Keep a local backup or share it with external healthcare providers.
                          </p>
                          <button onClick={handleExportData} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors shadow-sm">
                            <Download size={16} /> Download My Data
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone Card */}
                    <div className="p-6 border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                        <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-full shrink-0 w-fit">
                          <AlertTriangle size={28} />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-700 dark:text-red-400 text-lg">Danger Zone</h4>
                          <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-2 mb-5 leading-relaxed">
                            Permanently delete your account and wipe all stored information from our servers. This includes your medical profile, family profiles, uploaded reports, and chat history. <strong>This action cannot be undone.</strong>
                          </p>
                          <button onClick={handleDeleteAccount} className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-red-500/20">
                            <Trash2 size={18} /> Permanently Delete Account
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}