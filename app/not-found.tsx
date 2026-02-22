import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-50 dark:bg-red-900/20 mb-6">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-slate-900 dark:text-white mb-4">
              404
            </h1>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Page Not Found
            </h2>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
              Sorry, we couldn't find the page you're looking for.
            </p>

            <p className="text-slate-600 dark:text-slate-400 mb-8">
              The page might have been removed, or the link you clicked might be broken.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors group"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>

            <Link
              href="/chatbot"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Visit Chatbot
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-blue-100 dark:border-blue-900">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Other helpful links:
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Home
              </Link>
              <Link
                href="/chatbot"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Chatbot
              </Link>
              <Link
                href="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
