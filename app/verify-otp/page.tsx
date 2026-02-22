'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/toast'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ArrowLeft } from 'lucide-react'

export default function VerifyOtpPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const [signupData, setSignupData] = useState<{ fullName: string; email: string; phoneNumber: string } | null>(null)

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
    if (timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

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
      addToast('error', 'Invalid OTP', 'Please enter all 6 digits')
      return
    }

    setIsLoading(true)

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
        addToast('error', 'Invalid OTP', 'Please check the OTP and try again')
        setIsLoading(false)
      }
    } catch (error) {
      addToast('error', 'Verification Failed', 'Please try again later')
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setTimeLeft(300)
    setOtp(['', '', '', '', '', ''])
    addToast('success', 'OTP Sent', 'A new OTP has been sent to your email')
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
              {/* OTP Input Fields */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">
                  Enter 6-Digit OTP
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isLoading}
                      className="w-12 h-14 text-center text-lg font-bold border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                      placeholder="0"
                    />
                  ))}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  OTP expires in: <span className="font-bold text-blue-600 dark:text-blue-400">{formatTime(timeLeft)}</span>
                </p>
                {timeLeft <= 60 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    OTP expires soon. Request a new one if needed.
                  </p>
                )}
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Didn't receive the OTP?
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || timeLeft > 240}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {timeLeft > 240 ? `Resend in ${formatTime(timeLeft - 240)}` : 'Resend OTP'}
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center text-sm text-blue-800 dark:text-blue-200">
                Demo: Use OTP <span className="font-bold">123456</span> to verify
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
