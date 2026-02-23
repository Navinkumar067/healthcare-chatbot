'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { supabase } from '@/lib/supabase'
import { ProtectedRoute } from '@/context/AuthContext'
import toast from 'react-hot-toast'
import { Save, UserPlus, Trash2, FileText, Upload, X } from 'lucide-react'

// Define the structure for a family member
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
  
  // Main User State
  const [profile, setProfile] = useState<any>({
    full_name: '', age: '', gender: '', existing_diseases: '', allergies: '', current_medicines: '', file_urls: []
  })
  
  // Family Members State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single()
      if (data) {
        setProfile(data)
        setFamilyMembers(data.family_members || [])
      }
    }
    setLoading(false)
  }

  // Handle Main Profile Changes
  const handleProfileChange = (e: any) => setProfile({ ...profile, [e.target.name]: e.target.value })

  // Handle Family Member Changes
  const handleFamilyChange = (id: string, field: string, value: string) => {
    setFamilyMembers(prev => prev.map(member => member.id === id ? { ...member, [field]: value } : member))
  }

  const addFamilyMember = () => {
    if (familyMembers.length >= 3) return toast.error("You can only add up to 3 family members.")
    const newMember: FamilyMember = {
      id: Date.now().toString(), full_name: '', age: '', gender: '', existing_diseases: '', allergies: '', current_medicines: '', file_urls: [], chat_history: []
    }
    setFamilyMembers([...familyMembers, newMember])
  }

  const removeFamilyMember = (id: string) => {
    if(confirm("Are you sure? This will delete their profile and chat history forever.")) {
      setFamilyMembers(familyMembers.filter(m => m.id !== id))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const toastId = toast.loading('Saving profiles...')
    const { error } = await supabase.from('profiles').update({
      full_name: profile.full_name,
      age: profile.age,
      gender: profile.gender,
      existing_diseases: profile.existing_diseases,
      allergies: profile.allergies,
      current_medicines: profile.current_medicines,
      file_urls: profile.file_urls,
      family_members: familyMembers
    }).eq('email', userEmail)

    if (error) toast.error(error.message, { id: toastId })
    else toast.success('Profiles updated successfully!', { id: toastId })
    setSaving(false)
  }

  // Generalized File Upload (works for Main User or Family Member)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId?: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('Uploading report...')
    try {
      const fileName = `report-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('reports').upload(fileName, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName)
      const fileData = JSON.stringify({ name: file.name, url: publicUrl })

      if (memberId) {
        // Update specific family member
        setFamilyMembers(prev => prev.map(m => m.id === memberId ? { ...m, file_urls: [...(m.file_urls || []), fileData] } : m))
      } else {
        // Update main profile
        setProfile({ ...profile, file_urls: [...(profile.file_urls || []), fileData] })
      }
      toast.success('Report uploaded!', { id: toastId })
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message, { id: toastId })
    }
  }

  // Delete File
  const deleteFile = (fileStrToRemove: string, memberId?: string) => {
    if (memberId) {
      setFamilyMembers(prev => prev.map(m => m.id === memberId ? { ...m, file_urls: m.file_urls.filter(f => f !== fileStrToRemove) } : m))
    } else {
      setProfile({ ...profile, file_urls: profile.file_urls.filter((f: string) => f !== fileStrToRemove) })
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8">
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Household Profiles</h1>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50">
              <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>

          {/* MAIN USER PROFILE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">Primary</span> My Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label className="text-sm font-bold text-slate-500 mb-1 block">Full Name</label><input name="full_name" value={profile.full_name || ''} onChange={handleProfileChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" /></div>
              <div className="flex gap-4">
                <div className="w-1/2"><label className="text-sm font-bold text-slate-500 mb-1 block">Age</label><input type="number" name="age" value={profile.age || ''} onChange={handleProfileChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" /></div>
                <div className="w-1/2"><label className="text-sm font-bold text-slate-500 mb-1 block">Gender</label><select name="gender" value={profile.gender || ''} onChange={handleProfileChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div><label className="text-sm font-bold text-slate-500 mb-1 block">Existing Diseases</label><textarea name="existing_diseases" value={profile.existing_diseases || ''} onChange={handleProfileChange} rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none" /></div>
              <div><label className="text-sm font-bold text-slate-500 mb-1 block">Allergies</label><textarea name="allergies" value={profile.allergies || ''} onChange={handleProfileChange} rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none" /></div>
            </div>
            
            {/* Reports Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="text-sm font-bold text-slate-500 mb-3 block flex items-center justify-between">
                Medical Reports
                <label className="cursor-pointer text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1">
                  <Upload size={14}/> Upload File
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e)} />
                </label>
              </label>
              <div className="flex flex-wrap gap-2">
                {profile.file_urls?.map((fStr: string, i: number) => {
                  const f = JSON.parse(fStr)
                  return (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm">
                      <FileText size={14} className="text-blue-500" />
                      <span className="truncate max-w-[150px]">{f.name}</span>
                      <button onClick={() => deleteFile(fStr)} className="text-red-500 hover:text-red-700 ml-2"><X size={14} /></button>
                    </div>
                  )
                })}
                {(!profile.file_urls || profile.file_urls.length === 0) && <p className="text-xs text-slate-400">No reports uploaded.</p>}
              </div>
            </div>
          </div>

          {/* FAMILY MEMBERS LIST */}
          {familyMembers.map((member, index) => (
            <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative">
              <button onClick={() => removeFamilyMember(member.id)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition" title="Remove Member">
                <Trash2 size={20} />
              </button>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-md">Family {index + 1}</span> {member.full_name || 'New Member'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><label className="text-sm font-bold text-slate-500 mb-1 block">Full Name</label><input value={member.full_name} onChange={(e) => handleFamilyChange(member.id, 'full_name', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" /></div>
                <div className="flex gap-4">
                  <div className="w-1/2"><label className="text-sm font-bold text-slate-500 mb-1 block">Age</label><input type="number" value={member.age} onChange={(e) => handleFamilyChange(member.id, 'age', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" /></div>
                  <div className="w-1/2"><label className="text-sm font-bold text-slate-500 mb-1 block">Gender</label><select value={member.gender} onChange={(e) => handleFamilyChange(member.id, 'gender', e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                <div><label className="text-sm font-bold text-slate-500 mb-1 block">Existing Diseases</label><textarea value={member.existing_diseases} onChange={(e) => handleFamilyChange(member.id, 'existing_diseases', e.target.value)} rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none" /></div>
                <div><label className="text-sm font-bold text-slate-500 mb-1 block">Allergies</label><textarea value={member.allergies} onChange={(e) => handleFamilyChange(member.id, 'allergies', e.target.value)} rows={2} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 resize-none" /></div>
              </div>

              {/* Family Member Reports Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="text-sm font-bold text-slate-500 mb-3 block flex items-center justify-between">
                  Medical Reports
                  <label className="cursor-pointer text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1">
                    <Upload size={14}/> Upload File
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, member.id)} />
                  </label>
                </label>
                <div className="flex flex-wrap gap-2">
                  {member.file_urls?.map((fStr: string, i: number) => {
                    const f = JSON.parse(fStr)
                    return (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg text-sm">
                        <FileText size={14} className="text-amber-500" />
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button onClick={() => deleteFile(fStr, member.id)} className="text-red-500 hover:text-red-700 ml-2"><X size={14} /></button>
                      </div>
                    )
                  })}
                  {(!member.file_urls || member.file_urls.length === 0) && <p className="text-xs text-slate-400">No reports uploaded.</p>}
                </div>
              </div>
            </div>
          ))}

          {/* ADD MEMBER BUTTON */}
          {familyMembers.length < 3 && (
            <button onClick={addFamilyMember} className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center justify-center gap-2 font-bold">
              <UserPlus size={20} /> Add Family Member ({3 - familyMembers.length} remaining)
            </button>
          )}

        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}