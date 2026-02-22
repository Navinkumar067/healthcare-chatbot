'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { LoadingSpinner } from '@/components/loading-spinner'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { login } = useAuth()

  const handleVerify = () => {
    const entered = otp.join('')
    const expected = sessionStorage.getItem('expectedOTP')
    setLoading(true)
    setTimeout(() => {
      if (entered === expected) {
        toast.success("Identity Verified")
        login('user-token', 'user')
        const data = JSON.parse(localStorage.getItem('userData') || '{}')
        sessionStorage.setItem('userEmail', data.email)
        router.push('/profile')
      } else {
        toast.error("Invalid Code")
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl shadow-lg text-center border dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
          <p className="text-slate-500 mb-8">Enter the 6-digit code sent to your inbox</p>
          <div className="flex gap-2 mb-8">
            {otp.map((d, i) => (
              <input key={i} ref={el => {inputs.current[i] = el}} maxLength={1} className="w-12 h-14 text-center text-xl font-bold border rounded-lg dark:bg-slate-800" value={d}
                onChange={e => {
                  const v = e.target.value; const n = [...otp]; n[i] = v; setOtp(n);
                  if (v && i < 5) inputs.current[i+1]?.focus()
                }}
              />
            ))}
          </div>
          <button onClick={handleVerify} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold">
            {loading ? <LoadingSpinner size="sm" /> : "Verify Account"}
          </button>
        </div>
      </main>
    </div>
  )
}