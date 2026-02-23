'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Chrome, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Must be a 10-digit number'),
  age: z.string().refine(val => parseInt(val) >= 18, 'Must be at least 18'),
  gender: z.string().min(1, 'Select gender'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema)
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true)
    try {
      // 1. Check if user exists AND if they are banned
      const { data: existingUsers } = await supabase
        .from('profiles')
        .select('email, is_banned')
        .eq('email', data.email)

      if (existingUsers && existingUsers.length > 0) {
        // Feature: Block banned users from re-signing up or logging in
        if (existingUsers[0].is_banned) {
          toast.error('This account has been suspended by an Admin.', { icon: '🚫' })
          setIsLoading(false)
          return
        }

        toast.error('This email is already registered. Please log in.')
        setIsLoading(false)
        return
      }

      // 2. Temporarily store data and send OTP
      localStorage.setItem('userData', JSON.stringify(data))
      const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString()
      sessionStorage.setItem('expectedOTP', generatedOTP)
      
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, otp: generatedOTP }),
      })

      if (!response.ok) throw new Error('Failed to send email')
      
      toast.success(`OTP Sent successfully to ${data.email}!`)
      router.push('/verify-otp')
    } catch (error) {
      toast.error('Failed to send OTP email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="text-sm text-slate-500 mt-2">Join HealthChat to get instant AI medical advice</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input {...register('fullName')} placeholder="John Doe" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" {...register('email')} placeholder="john@example.com" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition" />
              {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input {...register('phoneNumber')} placeholder="9876543210" maxLength={10} className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition" />
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.phoneNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Age</label>
                <input type="number" {...register('age')} placeholder="18" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition" />
                {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.age.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
              <select {...register('gender')} className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.gender.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" {...register('password')} placeholder="••••••••" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition" />
              {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <input type="password" {...register('confirmPassword')} placeholder="••••••••" className="w-full p-3 rounded-xl border bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800 transition" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition duration-200 flex items-center justify-center disabled:opacity-70">
              {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center mt-4"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold">OR</span></div>
          </div>

          <button type="button" className="w-full py-3 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-200 font-bold text-sm">
            <Chrome size={18} className="text-blue-500" /> Continue with Google
          </button>

          <div className="text-center text-sm pt-2">
            <span className="text-slate-500">Already have an account?</span>
            <Link href="/login" className="ml-1 text-blue-600 font-bold hover:text-blue-700 transition">Log in</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}