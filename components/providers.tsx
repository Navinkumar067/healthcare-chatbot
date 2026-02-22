'use client'

import { useEffect, useState } from 'react'
import { ToastContainer } from '@/components/toast'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Initialize dark mode from localStorage
    const theme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (theme === 'dark' || (!theme && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <AuthProvider>
      {children}
      {/* We only render the toasts after the component has mounted to prevent hydration errors */}
      {mounted && (
        <>
          <ToastContainer />
          <Toaster position="top-right" />
        </>
      )}
    </AuthProvider>
  )
}