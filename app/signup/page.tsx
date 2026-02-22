'use client'

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
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create your account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">full name:</label>
              <input {...register('fullName')} placeholder="full name" className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800" />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">email:</label>
              <input type="email" {...register('email')} placeholder="email" className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">phone:</label>
                <input {...register('phoneNumber')} placeholder="phone" maxLength={10} className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">age:</label>
                <input type="number" {...register('age')} placeholder="age" className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">gender:</label>
              <select {...register('gender')} className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800">
                <option value="">select gender</option>
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="other">other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">password:</label>
              <input type="password" {...register('password')} placeholder="password" className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">confirm password:</label>
              <input type="password" {...register('confirmPassword')} placeholder="confirm password" className="w-full p-3 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none border-slate-200 dark:border-slate-800" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-200 flex items-center justify-center">
              {isLoading ? <LoadingSpinner size="sm" /> : 'Sign up'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
            <div className="relative flex justify-center text-sm uppercase"><span className="bg-white dark:bg-slate-950 px-2 text-slate-500 font-bold">OR</span></div>
          </div>

          <button type="button" className="w-full py-3 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition duration-200 font-medium">
            <Chrome size={20} className="text-blue-500" /> Continue with Google
          </button>

          <div className="text-center text-sm">
            <span className="text-slate-500">Already have an account?</span>
            <Link href="/login" className="ml-1 text-blue-600 font-bold hover:underline">Log in</Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}