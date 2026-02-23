'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LoadingSpinner } from '@/components/loading-spinner'
import { UploadCloud, FileIcon, X, Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { ProtectedRoute } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

const profileSchema = z.object({
  fullName: z.string().min(2, 'full name required'),
  age: z.string().min(1, 'age required'),
  phoneNumber: z.string().regex(/^\d{10}$/, '10 digits required'),
  gender: z.string().min(1, 'select gender'),
  allergies: z.string().optional(),
  existingDiseases: z.string().min(1, 'state "none" if healthy'),
  currentMedicines: z.string().optional(),
})

export default function ProfilePage() {
  const [isSaving, setIsSaving] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, url: string}[]>([])

  const { register, handleSubmit, setValue, watch } = useForm({ 
    resolver: zodResolver(profileSchema) 
  })

  // 1. FETCH DATA ON LOAD
  useEffect(() => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      fetchProfileData(email)
    } else {
      setIsFetching(false)
    }
  }, [setValue])

  const fetchProfileData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (data) {
        // Set text fields
        setValue('fullName', data.full_name || '')
        setValue('age', data.age || '')
        setValue('phoneNumber', data.phone_number || '')
        setValue('gender', data.gender || '')
        setValue('existingDiseases', data.existing_diseases || '')
        setValue('allergies', data.allergies || '')
        setValue('currentMedicines', data.current_medicines || '')
        
        // Set files
        if (data.file_urls) {
          const parsedFiles = data.file_urls.map((f: string) => JSON.parse(f))
          setUploadedFiles(parsedFiles)
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setIsFetching(false)
    }
  }

  // 2. HANDLE FILE UPLOAD (Instant Storage & Database Upload)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('uploading report...')
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userEmail}-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('reports')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('reports')
        .getPublicUrl(fileName)

      // Update local state
      const newFilesList = [...uploadedFiles, { name: file.name, url: publicUrl }]
      setUploadedFiles(newFilesList)

      // INSTANT DATABASE SYNC: Auto-save this file array directly to Supabase
      const stringifiedFiles = newFilesList.map(f => JSON.stringify(f))
      await supabase
        .from('profiles')
        .update({ file_urls: stringifiedFiles })
        .eq('email', userEmail)

      toast.success('file uploaded and saved to cloud!', { id: toastId })
    } catch (err) {
      toast.error('upload failed', { id: toastId })
    }
  }

  // 3. REMOVE FILE (Instant Database Sync)
  const removeFile = async (index: number) => {
    try {
      const newFilesList = uploadedFiles.filter((_, i) => i !== index)
      setUploadedFiles(newFilesList)

      // INSTANT DATABASE SYNC: Update database immediately on deletion
      const stringifiedFiles = newFilesList.map(f => JSON.stringify(f))
      await supabase
        .from('profiles')
        .update({ file_urls: stringifiedFiles })
        .eq('email', userEmail)
        
    } catch (err) {
      toast.error('failed to remove file from database')
    }
  }

  // 4. SAVE FULL PROFILE TEXT DETAILS
  const onSubmit = async (values: any) => {
    setIsSaving(true)
    try {
      // Stringify file objects for Postgres array (just in case)
      const stringifiedFiles = uploadedFiles.map(f => JSON.stringify(f))

      const { error } = await supabase.from('profiles').upsert({
        email: userEmail,
        full_name: values.fullName,
        age: values.age,
        phone_number: values.phoneNumber,
        gender: values.gender,
        existing_diseases: values.existingDiseases,
        allergies: values.allergies,
        current_medicines: values.currentMedicines,
        file_urls: stringifiedFiles
      })

      if (error) throw error
      toast.success('profile updated successfully!')
    } catch (err) {
      toast.error('failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isFetching) return <LoadingSpinner variant="overlay" text="loading your health profile..." />

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-6xl mx-auto w-full p-6 grid lg:grid-cols-3 gap-8">
          
          {/* Left: Text Details */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold">medical profile</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border dark:border-slate-800">
                <div className="space-y-4 md:col-span-2"><h2 className="font-semibold text-blue-600">basic info:</h2></div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">full name:</label>
                  <input {...register('fullName')} className="w-full p-3 mt-1 rounded-xl border dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">phone:</label>
                  <input {...register('phoneNumber')} className="w-full p-3 mt-1 rounded-xl border dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">age:</label>
                  <input {...register('age')} className="w-full p-3 mt-1 rounded-xl border dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">gender:</label>
                  <select {...register('gender')} className="w-full p-3 mt-1 rounded-xl border dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition">
                    <option value="male">male</option>
                    <option value="female">female</option>
                    <option value="other">other</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border dark:border-slate-800 space-y-4">
                <h2 className="font-semibold text-blue-600">medical history:</h2>
                <textarea {...register('existingDiseases')} placeholder="list any chronic conditions..." className="w-full p-4 rounded-xl border dark:bg-slate-900 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-600" />
                <textarea {...register('currentMedicines')} placeholder="current medications..." className="w-full p-4 rounded-xl border dark:bg-slate-900 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-600" />
              </div>

              <button type="submit" disabled={isSaving} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition flex items-center justify-center gap-2">
                {isSaving ? <LoadingSpinner size="sm" /> : <><Save size={20}/> save profile updates</>}
              </button>
            </form>
          </div>

          {/* Right: File Uploads */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm sticky top-24">
              <h2 className="font-bold mb-4">medical records:</h2>
              <label className="border-2 border-dashed border-blue-100 dark:border-blue-900 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group">
                <UploadCloud className="text-blue-500 mb-2 group-hover:scale-110 transition" size={32} />
                <span className="text-sm font-medium">upload new report</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
              </label>

              <div className="mt-8 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase">uploaded files:</h3>
                {uploadedFiles.length === 0 && <p className="text-sm text-slate-400 italic">no reports uploaded yet.</p>}
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border group">
                    <div className="flex items-center gap-2 truncate">
                      <FileIcon size={16} className="text-blue-500" />
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-sm font-medium truncate hover:text-blue-600 hover:underline">{f.name}</a>
                    </div>
                    <button onClick={() => removeFile(i)} className="text-red-500 hover:bg-red-50 p-1 rounded-lg"><X size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}