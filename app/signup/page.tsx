'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, Mail, Lock, User, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Professional Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      if (error) throw error
    } catch (error: any) {
      toast.error('Google sign in failed. Please configure Google OAuth in your Supabase Dashboard.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    console.log("1. Button clicked, starting signup...")
    
    if (!formData.phone || formData.phone.length < 10) {
      toast.error('Please enter a valid phone number.')
      setIsLoading(false)
      return
    }

    try {
      console.log("2. Sending request to Supabase Auth...")
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        console.log("Auth Error Details:", authError)
        throw authError
      }
      
      console.log("3. User created successfully in Auth!", authData.user?.id)

      if (authData.user) {
        console.log("4. Attempting to save to Profiles table...")
        const { error: profileError } = await supabase.from('profiles').upsert([
          { 
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone,
            role: 'user'
          }
        ])

        if (profileError) {
           console.log("Profile Upsert Error:", profileError)
           throw profileError // We force it to throw the error so we can see it!
        }
        console.log("5. Profile saved successfully!")
      }

      console.log("6. Redirecting to Login page...")
      toast.success('Account created successfully!')
      router.push('/login')
      
    } catch (error: any) {
      console.error("CRITICAL ERROR CAUGHT:", error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      console.log("7. Process finished, turning off loading spinner.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950">
      
      {/* Left Side - Professional Branding & Trust */}
      <div className="w-full md:w-5/12 bg-blue-600 p-8 md:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-800 opacity-20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center space-x-3 group mb-12">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
              <span className="text-blue-600 font-bold text-xl leading-none">H</span>
            </div>
            <span className="font-bold text-2xl tracking-tight">HealthChat</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Your health data, <br/>secured & private.</h1>
          <p className="text-blue-100 text-lg mb-8 max-w-md leading-relaxed">
            Join thousands of users accessing AI-powered medical insights, prescription scanning, and longitudinal health tracking.
          </p>
        </div>

        <div className="relative z-10 mt-12 pt-8 border-t border-blue-500/30">
          <p className="text-blue-200 text-sm">© 2026 HealthChat Intelligence.</p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Create an account</h2>
            <p className="text-slate-500 mt-2">Enter your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Google OAuth Button */}
            <button 
              type="button" 
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238598)">
                  <path fill="#4285F4" d="M -3.264,51.509 C -3.264,50.719 -3.334,49.969 -3.454,49.239 L -14.754,49.239 L -14.754,53.749 L -8.284,53.749 C -8.574,55.229 -9.424,56.479 -10.684,57.329 L -10.684,60.329 L -6.824,60.329 C -4.564,58.239 -3.264,55.159 -3.264,51.509 z"></path>
                  <path fill="#34A853" d="M -14.754,63.239 C -11.514,63.239 -8.804,62.159 -6.824,60.329 L -10.684,57.329 C -11.764,58.049 -13.134,58.489 -14.754,58.489 C -17.884,58.489 -20.534,56.379 -21.484,53.529 L -25.464,53.529 L -25.464,56.619 C -23.494,60.539 -19.444,63.239 -14.754,63.239 z"></path>
                  <path fill="#FBBC05" d="M -21.484,53.529 C -21.734,52.809 -21.864,52.039 -21.864,51.239 C -21.864,50.439 -21.724,49.669 -21.484,48.949 L -21.484,45.859 L -25.464,45.859 C -26.284,47.479 -26.754,49.299 -26.754,51.239 C -26.754,53.179 -26.284,54.999 -25.464,56.619 L -21.484,53.529 z"></path>
                  <path fill="#EA4335" d="M -14.754,43.989 C -12.984,43.989 -11.404,44.599 -10.154,45.789 L -6.734,41.939 C -8.804,40.009 -11.514,38.989 -14.754,38.989 C -19.444,38.989 -23.494,41.689 -25.464,45.859 L -21.484,48.949 C -20.534,46.099 -17.884,43.989 -14.754,43.989 z"></path>
                </g>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center justify-center space-x-3 text-slate-400">
              <hr className="flex-1 border-slate-200 dark:border-slate-800" />
              <span className="text-xs font-bold uppercase tracking-widest">Or register with email</span>
              <hr className="flex-1 border-slate-200 dark:border-slate-800" />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Full Legal Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              By creating an account, you agree to our <Link href="#" className="text-blue-600 hover:underline">Terms of Service</Link> and acknowledge our <Link href="#" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 flex items-center justify-center"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}