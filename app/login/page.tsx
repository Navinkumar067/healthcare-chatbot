'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const { addToast } = useToast()

  // Demo credentials for testing
  const demoUsers = {
    admin: { email: 'admin@healthchat.com', password: 'admin123' },
    user: { email: 'user@example.com', password: 'user123' },
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const determineUserRole = (loginEmail: string): 'admin' | 'user' => {
    if (loginEmail === demoUsers.admin.email) {
      return 'admin'
    }
    return 'user'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      addToast('error', 'Validation Error', 'Please check the form fields')
      return
    }

    setIsLoading(true)

    try {
      // Simulate login API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock authentication logic
      const isValidCredentials =
        (email === demoUsers.admin.email && password === demoUsers.admin.password) ||
        (email === demoUsers.user.email && password === demoUsers.user.password)

      if (!isValidCredentials) {
        addToast('error', 'Login Failed', 'Invalid email or password')
        setPassword('')
        setIsLoading(false)
        return
      }

      // Determine user role and redirect
      const userRole = determineUserRole(email)

      // Store user info in sessionStorage
      sessionStorage.setItem('userRole', userRole)
      sessionStorage.setItem('userEmail', email)

      addToast('success', 'Welcome Back!', `Logged in as ${userRole}`)

      // Redirect based on role
      setTimeout(() => {
        if (userRole === 'admin') {
          router.push('/admin-panel')
        } else {
          router.push('/dashboard')
        }
      }, 500)
    } catch (error) {
      addToast('error', 'Login Error', 'An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    field: 'email' | 'password',
    value: string
  ) => {
    if (field === 'email') {
      setEmail(value)
    } else {
      setPassword(value)
    }
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Sign in to your HealthChat account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors ${
                  errors.email
                    ? 'border-red-500 dark:border-red-400'
                    : 'border-blue-200 dark:border-blue-800'
                }`}
              />
              {errors.email && (
                <div className="mt-1.5 flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors ${
                    errors.password
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-blue-200 dark:border-blue-800'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="mt-1.5 flex items-center gap-1.5 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-blue-200 dark:border-blue-800 text-blue-600 focus:ring-2 focus:ring-blue-600"
                  disabled={isLoading}
                />
                <span className="text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <Link
                href="#"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-200 dark:border-blue-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400">
                New to HealthChat?
              </span>
            </div>
          </div>

          {/* Signup Link */}
          <Link
            href="/signup"
            className="block w-full py-2.5 border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-center"
          >
            Create Account
          </Link>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-3">Demo Credentials for Testing:</p>
            <div className="space-y-2">
              <div>
                <p className="font-medium">User Account:</p>
                <p className="text-xs opacity-80">Email: <span className="font-mono">user@example.com</span></p>
                <p className="text-xs opacity-80">Password: <span className="font-mono">user123</span></p>
              </div>
              <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
                <p className="font-medium">Admin Account:</p>
                <p className="text-xs opacity-80">Email: <span className="font-mono">admin@healthchat.com</span></p>
                <p className="text-xs opacity-80">Password: <span className="font-mono">admin123</span></p>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-6">
            By signing in, you agree to our{' '}
            <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
