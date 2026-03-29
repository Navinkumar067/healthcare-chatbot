'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { Save, UserPlus, Trash2, FileText, Upload, X, ShieldCheck, Activity, Heart, Pill, AlertCircle } from 'lucide-react'

type FamilyMember = {
  id: string;
  full_name: string;
  age: string;
  gender: string;
  existing_diseases: string;
  allergies: string;
  current_medicines: string;
  file_urls: string[];
  chat_history: any[];
}

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [profile, setProfile] = useState<any>({
    full_name: '', age: '', gender: '', existing_diseases: '', allergies: '', current_medicines: '', file_urls: []
  })
  
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const email = sessionStorage.getItem('userEmail')
      if (email) {
        setUserEmail(email)
        const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single()
        if (error && error.code !== 'PGRST116') throw error 
        
        if (data) {
          setProfile(data)
          setFamilyMembers(data.family_members || [])
        }
      }
    } catch (err: any) {
      console.error("Profile Fetch Error:", err)
      toast.error("Failed to load profile data.")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e: any) => setProfile({ ...profile, [e.target.name]: e.target.value })
  const handleFamilyChange = (id: string, field: string, value: string) => setFamilyMembers(prev => prev.map(member => member.id === id ? { ...member, [field]: value } : member))

  const addFamilyMember = () => {
    if (familyMembers.length >= 3) return toast.error("You can only add up to 3 family members.")
    setFamilyMembers([...familyMembers, { id: Date.now().toString(), full_name: '', age: '', gender: '', existing_diseases: '', allergies: '', current_medicines: '', file_urls: [], chat_history: [] }])
  }

  const removeFamilyMember = (id: string) => {
    if(window.confirm("Are you sure? This will delete their profile and chat history forever.")) setFamilyMembers(familyMembers.filter(m => m.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    const toastId = toast.loading('Encrypting and saving profiles...')
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name, age: profile.age, gender: profile.gender, existing_diseases: profile.existing_diseases,
      allergies: profile.allergies, current_medicines: profile.current_medicines, file_urls: profile.file_urls, family_members: familyMembers
    }).eq('email', userEmail)

    if (error) toast.error(error.message, { id: toastId })
    else toast.success('Medical profiles securely updated!', { id: toastId })
    setSaving(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId?: string) => {
    const file = e.target.files?.[0]; if (!file) return;
    const toastId = toast.loading('Encrypting and uploading report...')
    try {
      const fileName = `report-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('reports').upload(fileName, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName)
      const fileData = JSON.stringify({ name: file.name, url: publicUrl })

      if (memberId) {
        setFamilyMembers(prev => prev.map(m => m.id === memberId ? { ...m, file_urls: [...(m.file_urls || []), fileData] } : m))
      } else {
        setProfile({ ...profile, file_urls: [...(profile.file_urls || []), fileData] })
      }
      toast.success('Medical report securely attached!', { id: toastId })
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: toastId })
    }
  }

  const deleteFile = (fileStrToRemove: string, memberId?: string) => {
    if (memberId) setFamilyMembers(prev => prev.map(m => m.id === memberId ? { ...m, file_urls: m.file_urls.filter(f => f !== fileStrToRemove) } : m))
    else setProfile({ ...profile, file_urls: profile.file_urls.filter((f: string) => f !== fileStrToRemove) })
  }

  // FIXED: A safe JSON parser to prevent older database entries from completely crashing the render cycle
  const safeParseFile = (fStr: string) => {
    try { return JSON.parse(fStr); } catch { return { name: 'Attached File', url: fStr }; }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        {loading ? (
           <main className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
           </main>
        ) : (
          <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">Profiles</h1>
                <p className="text-slate-500 mt-2 flex items-center gap-1.5 text-sm">
                  <ShieldCheck size={16} className="text-green-500" /> All data is encrypted and securely stored.
                </p>
              </div>
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition disabled:opacity-50">
                <Save size={18} /> {saving ? 'Encrypting...' : 'Save All Changes'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 text-xs rounded-md uppercase tracking-wider">Primary</span> 
                My Medical File
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
                <div className="md:col-span-6">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Full Legal Name</label>
                  <input name="full_name" value={profile.full_name || ''} onChange={handleProfileChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="e.g. Navin Kumar" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Age</label>
                  <input type="number" name="age" value={profile.age || ''} onChange={handleProfileChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-600 outline-none transition-all" placeholder="Yrs" />
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">Gender</label>
                  <select name="gender" value={profile.gender || ''} onChange={handleProfileChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-600 outline-none transition-all cursor-pointer">
                    <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><AlertCircle size={14} className="text-red-500"/> Known Allergies</label>
                  <textarea name="allergies" value={profile.allergies || ''} onChange={handleProfileChange} rows={2} placeholder="e.g. Peanuts, Dust, None" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Heart size={14} className="text-orange-500"/> Chronic Conditions</label>
                  <textarea name="existing_diseases" value={profile.existing_diseases || ''} onChange={handleProfileChange} rows={2} placeholder="e.g. Type 2 Diabetes, Asthma" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none" />
                </div>
              </div>

              <div className="mb-8">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5"><Pill size={14} className="text-blue-500"/> Current Medications</label>
                <textarea name="current_medicines" value={profile.current_medicines || ''} onChange={handleProfileChange} rows={2} placeholder="e.g. Metformin 500mg daily" className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none" />
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Activity size={16}/> Medical Records</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Upload recent blood tests, scans, or prescriptions.</p>
                  </div>
                  <label className="cursor-pointer text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0">
                    <Upload size={16} className="text-blue-600" /> Upload File
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e)} />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.file_urls?.map((fStr: string, i: number) => {
                    const f = safeParseFile(fStr)
                    return (
                      <div key={i} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm shadow-sm group">
                        <FileText size={14} className="text-blue-500" />
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] hover:text-blue-600 hover:underline">{f.name}</a>
                        <button onClick={() => deleteFile(fStr)} className="text-slate-300 hover:text-red-500 transition-colors ml-1"><X size={14} /></button>
                      </div>
                    )
                  })}
                  {(!profile.file_urls || profile.file_urls.length === 0) && <p className="text-sm text-slate-400 italic py-2">No documents uploaded yet.</p>}
                </div>
              </div>
            </div>

            {familyMembers.map((member, index) => (
              <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                <button onClick={() => removeFamilyMember(member.id)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>

                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-200 pr-12">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-md uppercase tracking-wider">Family {index + 1}</span> {member.full_name || 'New Dependent'}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
                  <div className="md:col-span-6">
                    <label className="text-sm font-bold text-slate-600 mb-1.5 block">Full Legal Name</label>
                    <input value={member.full_name} onChange={(e) => handleFamilyChange(member.id, 'full_name', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Priya Kumar" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-bold text-slate-600 mb-1.5 block">Age</label>
                    <input type="number" value={member.age} onChange={(e) => handleFamilyChange(member.id, 'age', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Yrs" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-bold text-slate-600 mb-1.5 block">Biological Sex</label>
                    <select value={member.gender} onChange={(e) => handleFamilyChange(member.id, 'gender', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none">
                      <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5"><AlertCircle size={14} className="text-red-500"/> Known Allergies</label>
                    <textarea value={member.allergies} onChange={(e) => handleFamilyChange(member.id, 'allergies', e.target.value)} rows={2} placeholder="None" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5"><Heart size={14} className="text-orange-500"/> Chronic Conditions</label>
                    <textarea value={member.existing_diseases} onChange={(e) => handleFamilyChange(member.id, 'existing_diseases', e.target.value)} rows={2} placeholder="None" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none" />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5"><Pill size={14} className="text-amber-500"/> Current Medications</label>
                  <textarea value={member.current_medicines} onChange={(e) => handleFamilyChange(member.id, 'current_medicines', e.target.value)} rows={2} placeholder="None" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={16}/> Medical Records</h3>
                    <label className="cursor-pointer text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm shrink-0">
                      <Upload size={16} className="text-amber-600" /> Upload File
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, member.id)} />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.file_urls?.map((fStr: string, i: number) => {
                      const f = safeParseFile(fStr)
                      return (
                        <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm shadow-sm">
                          <FileText size={14} className="text-amber-500" />
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[150px] hover:text-amber-600 hover:underline">{f.name}</a>
                          <button onClick={() => deleteFile(fStr, member.id)} className="text-slate-300 hover:text-red-500 ml-1"><X size={14} /></button>
                        </div>
                      )
                    })}
                    {(!member.file_urls || member.file_urls.length === 0) && <p className="text-sm text-slate-400 italic py-2">No documents uploaded yet.</p>}
                  </div>
                </div>
              </div>
            ))}

            {familyMembers.length < 3 && (
              <button onClick={addFamilyMember} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold shadow-sm">
                <UserPlus size={20} /> Add Family Member ({3 - familyMembers.length} remaining)
              </button>
            )}

          </main>
        )}
        <Footer />
      </div>
    </ProtectedRoute>
  )
}