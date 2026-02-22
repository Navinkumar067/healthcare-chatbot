import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { ArrowRight, MessageSquare, Lock, Zap, Heart } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 dark:from-slate-900 to-white dark:to-slate-950 py-20 md:py-32">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 right-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute -bottom-1/2 left-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-800/20 rounded-full blur-3xl opacity-20"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block mb-4 px-4 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  🏥 Your Personal Health Assistant
                </p>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 text-balance leading-tight">
                Get Instant Health Guidance with <span className="text-blue-600 dark:text-blue-400">AI</span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 text-balance leading-relaxed">
                HealthChat provides reliable health information and guidance powered by advanced AI technology. Ask questions, get answers, anytime, anywhere.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/chatbot"
                  className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors group"
                >
                  Start Chatting
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Sign Up Free
                </Link>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                No credit card required • Available 24/7
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Why Choose HealthChat?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Designed with your health needs in mind
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Instant Responses
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get immediate answers to your health questions at any time
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Privacy Secured
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your health information is encrypted and kept completely private
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  AI Powered
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Advanced artificial intelligence for accurate health information
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  Health Focused
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Comprehensive coverage of various health topics and concerns
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Your Health Answers?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of users who trust HealthChat for reliable health information
            </p>
            <Link
              href="/chatbot"
              className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-lg transition-colors group"
            >
              Start Free Chat
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
