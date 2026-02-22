'use client'

import { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Send, Bot, User, AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import { ProtectedRoute } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'hello! i am your healthchat ai. i have reviewed your medical profile. how can i assist you with your symptoms or medications today?' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch User Profile from Supabase to provide context to the AI
  useEffect(() => {
    const fetchProfile = async () => {
      const email = sessionStorage.getItem('userEmail')
      if (email) {
        const { data } = await supabase.from('profiles').select('*').eq('email', email).single()
        if (data) setUserProfile(data)
      }
    }
    fetchProfile()
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      // 2. Call our internal API route that connects to Gemini
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          profile: userProfile 
        }),
      })

      const data = await response.json()

      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, { role: 'bot', content: data.text }])
    } catch (err) {
      toast.error("ai connection lost. please check your gemini api key.")
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: "i'm sorry, i'm having trouble connecting to my medical database. please try again in a moment." 
      }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        
        <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-6">
          
          {/* AI Status Header */}
          <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-tight">healthchat intelligence</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> 
                  connected to medical cloud
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="text-amber-600" size={14} />
              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase">emergency? call 108</span>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-y-auto space-y-6 mb-4 pr-2 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    m.role === 'user' 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}>
                    {m.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none">
                   <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                   </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Minimalist Input Area */}
          <div className="relative mt-auto pt-4">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="describe your symptoms or ask a medical question..."
              className="w-full p-4 pr-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition placeholder:text-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={isTyping}
              className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:hover:bg-blue-600 shadow-md"
            >
              <Send size={20} />
            </button>
          </div>
        </main>
        
        <Footer />
      </div>
    </ProtectedRoute>
  )
}