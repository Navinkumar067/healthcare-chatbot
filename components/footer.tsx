import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full bg-blue-50 dark:bg-slate-900 border-t border-blue-100 dark:border-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Medical Disclaimer */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Medical Disclaimer:</strong> This chatbot is not a licensed medical practitioner. For emergency situations, contact <strong>108</strong> immediately.
          </p>
        </div>

        {/* Footer Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">About HealthChat</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your AI-powered health information assistant, providing reliable health information and guidance.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/chatbot" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Chatbot
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Emergency</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              For medical emergencies, please call:
            </p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">
              108 (India)
            </p>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-blue-100 dark:border-blue-900 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600 dark:text-slate-400">
          <p>&copy; 2024 HealthChat. All rights reserved.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
