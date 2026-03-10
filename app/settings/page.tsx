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
  Download, Trash2, AlertTriangle, Lock, KeyRound, Mail
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
      // Step 1: Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: passwordForm.currentPassword
      })

      if (signInError) {
        throw new Error("Incorrect current password.")
      }

      // Step 2: If successful, update to new password
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
      // Fetch current preferences first so we don't overwrite any other existing settings
      const { data } = await supabase.from('profiles').select('preferences').eq('email', userEmail).single()
      const currentPrefs = data?.preferences || {}

      const updatedPrefs = {
        ...currentPrefs,
        notifications: notifications
      }

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
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
        activeTab === id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  )

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account, preferences, and data privacy.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 shrink-0 space-y-1">
              <TabButton id="account" icon={User} label="Account Details" />
              <TabButton id="security" icon={KeyRound} label="Security & Password" />
              <TabButton id="notifications" icon={Bell} label="Notifications" />
              <TabButton id="privacy" icon={Shield} label="Data & Privacy" />
            </aside>

            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
              
              {/* TAB 1: ACCOUNT DETAILS */}
              {activeTab === 'account' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Details</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Update your personal information.</p>
                  </div>

                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="email" value={userEmail} disabled className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={accountForm.fullName} 
                        onChange={(e) => setAccountForm({...accountForm, fullName: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registered Phone Number</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                          type="tel" 
                          value={accountForm.phone || 'Not provided'} 
                          disabled
                          className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed" 
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Phone number is verified during signup and cannot be changed for security.</p>
                    </div>

                    <button onClick={handleSaveAccount} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors mt-2">
                      <Save size={18} /> Save Details
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: SECURITY & PASSWORD */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security & Password</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Ensure your medical data stays secure.</p>
                  </div>

                  <div className="space-y-4 max-w-md p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.currentPassword} 
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none" 
                        placeholder="Enter old password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.newPassword} 
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none" 
                        placeholder="Create a strong password"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-4">
                      <button onClick={handleForgotPassword} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        Forgot Old Password?
                      </button>
                      <button onClick={handleUpdatePassword} disabled={isLoading} className="px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium rounded-xl transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notification Preferences</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose how you want HealthChat to contact you.</p>
                  </div>
                  <div className="space-y-4 max-w-xl">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">Email Alerts</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive health reports and major updates via email.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notifications.emailAlerts} onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white">SMS Alerts</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive urgent notifications via SMS.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notifications.smsAlerts} onChange={(e) => setNotifications({...notifications, smsAlerts: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl">
                      <div>
                        <h4 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">Medicine Reminders <span className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded uppercase font-bold tracking-wider">Upcoming Feature</span></h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Get daily push notifications to take your medication on time.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notifications.medicineReminders} onChange={(e) => setNotifications({...notifications, medicineReminders: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <button onClick={handleSaveNotifications} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors mt-4">
                      <Save size={18} /> Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: PRIVACY & DELETE */}
              {activeTab === 'privacy' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data & Privacy</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Manage your personal data and account security.</p>
                  </div>
                  <div className="space-y-6 max-w-xl">
                    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full shrink-0">
                          <Download size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">Export Health Data</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
                            Download a complete copy of your medical profile, chat history, and timeline events in JSON format. You can share this file with other doctors or applications.
                          </p>
                          <button onClick={handleExportData} className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors shadow-sm">
                            Download My Data
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 rounded-full shrink-0">
                          <AlertTriangle size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-700 dark:text-red-400 text-lg">Danger Zone: Delete Account</h4>
                          <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-4 leading-relaxed">
                            Permanently delete your account, medical profile, family members, and all chat history. This action is irreversible.
                          </p>
                          <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                            <Trash2 size={16} /> Permanently Delete Account
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