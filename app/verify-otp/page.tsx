'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ArrowLeft, AlertCircle, CheckCircle2, Mail, Clock } from 'lucide-react'

export default function VerifyOtpPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [signupData, setSignupData] = useState<{ fullName: string; email: string; phoneNumber: string } | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    // Get signup data from sessionStorage
    const data = sessionStorage.getItem('signupData')
    if (!data) {
      addToast('error', 'Access Denied', 'Please complete signup first')
      router.push('/signup')
      return
    }
    setSignupData(JSON.parse(data))
  }, [router, addToast])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)
    setErrorMessage('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits')
      addToast('error', 'Incomplete OTP', 'Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock OTP verification (in real app, verify against backend)
      if (otpCode === '123456') {
        // Clear signup data
        sessionStorage.removeItem('signupData')
        addToast('success', 'Verified Successfully', 'Redirecting to chatbot...')
        setTimeout(() => {
          router.push('/chatbot')
        }, 500)
      } else {
        setErrorMessage('Invalid OTP. Please check and try again.')
        addToast('error', 'Invalid OTP', 'Please check the OTP and try again')
        setIsLoading(false)
        setOtp(['', '', '', '', '', ''])
      }
    } catch (error) {
      setErrorMessage('Verification failed. Please try again later.')
      addToast('error', 'Verification Failed', 'Please try again later')
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setTimeLeft(60)
    setCanResend(false)
    setOtp(['', '', '', '', '', ''])
    setErrorMessage('')
    addToast('success', 'OTP Sent', 'A new OTP has been sent to your email')
    const firstInput = document.getElementById('otp-0')
    firstInput?.focus()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            href="/signup"
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Signup
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Verify Your Account
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {signupData ? `Enter the OTP sent to ${signupData.email}` : 'Loading...'}
            </p>
          </div>

          {signupData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">OTP Sent Successfully</p>
                    <p>Check your email at <span className="font-semibold">{signupData.email}</span> for the verification code</p>
                  </div>
                </div>
              </div>

              {/* OTP Input Fields */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-900 dark:text-white">
                  Enter 6-Digit OTP
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isLoading}
                      className={`w-12 h-14 text-center text-lg font-bold border-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors ${
                        errorMessage && otp.join('').length === 6
                          ? 'border-red-500 dark:border-red-400'
                          : 'border-blue-200 dark:border-blue-800 focus:border-blue-600'
                      }`}
                      placeholder="0"
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="flex gap-2 items-start p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                </div>
              )}

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <p className={`text-sm font-medium ${
                  timeLeft <= 15
                    ? 'text-red-600 dark:text-red-400'
                    : timeLeft <= 30
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}>
                  OTP expires in: <span className="font-bold">{formatTime(timeLeft)}</span>
                </p>
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Didn't receive the OTP?
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || !canResend}
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Resend OTP
                  {!canResend && <span className="text-xs ml-1">({formatTime(timeLeft)})</span>}
                </button>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || otp.some((digit) => !digit)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" text="Verifying..." />
                ) : (
                  'Verify OTP'
                )}
              </button>

              {/* Demo OTP */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-2 items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="text-center text-sm text-green-800 dark:text-green-200">
                    <p className="font-medium">Demo Mode</p>
                    <p>Use OTP <span className="font-bold">123456</span> to verify</p>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
