'use client'

import { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Send, Bot, User, AlertTriangle, Loader2, Sparkles, Plus, MessageSquare, Menu, X, Image as ImageIcon } from 'lucide-react'
import { ProtectedRoute } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

// Updated Session Types to include optional images
type ChatMessage = { role: string; content: string; imageUrl?: string };
type ChatSession = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };

export default function ChatbotPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  // Image Upload States
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const [userProfile, setUserProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === currentSessionId)
  const messages = activeSession ? activeSession.messages : []

  useEffect(() => {
    const fetchProfile = async () => {
      const email = sessionStorage.getItem('userEmail')
      if (email) {
        setUserEmail(email)
        const { data } = await supabase.from('profiles').select('*').eq('email', email).single()
        if (data) {
          setUserProfile(data)
          if (data.chat_history && data.chat_history.length > 0) {
            if (data.chat_history[0].role) {
              const migratedSession: ChatSession = {
                id: Date.now().toString(),
                title: 'Previous Conversation',
                messages: data.chat_history,
                updatedAt: Date.now()
              }
              setSessions([migratedSession])
              setCurrentSessionId(migratedSession.id)
            } else {
              setSessions(data.chat_history)
              setCurrentSessionId(data.chat_history[0].id)
            }
          } else {
            createNewSession(data)
          }
        }
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const createNewSession = (profileData = userProfile) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [{ 
        role: 'bot', 
        content: `hello ${profileData?.full_name?.split(' ')[0] || ''}! i am your healthchat ai. i have reviewed your medical profile and records. how can i assist you today?` 
      }],
      updatedAt: Date.now()
    }
    
    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    setCurrentSessionId(newSession.id)
    
    if (profileData?.email || userEmail) {
      supabase.from('profiles').update({ chat_history: updatedSessions }).eq('email', profileData?.email || userEmail).then()
    }
  }

  const updateSessionState = async (sessionId: string, newMessages: ChatMessage[], firstUserMessageContent?: string) => {
    let updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        let newTitle = s.title
        if (firstUserMessageContent && s.messages.length === 1) {
          newTitle = firstUserMessageContent.slice(0, 25) + (firstUserMessageContent.length > 25 ? '...' : '')
        }
        return { ...s, messages: newMessages, title: newTitle, updatedAt: Date.now() }
      }
      return s
    })

    updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt)
    setSessions(updatedSessions)
    
    if (userEmail) {
      await supabase.from('profiles').update({ chat_history: updatedSessions }).eq('email', userEmail)
    }
  }

  // Handle uploading an image to Supabase Bucket
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    const toastId = toast.loading('Attaching image...')
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat-img-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage.from('reports').upload(fileName, file)
      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName)
      setSelectedImage(publicUrl)
      toast.success('Image attached!', { id: toastId })
    } catch (err) {
      toast.error('Failed to attach image', { id: toastId })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !currentSessionId) return
    
    const userMsg = { role: 'user', content: input || "Please analyze this image.", imageUrl: selectedImage || undefined }
    const updatedMessages = [...messages, userMsg]
    
    updateSessionState(currentSessionId, updatedMessages, input || "Image uploaded")
    setInput('')
    setSelectedImage(null) // Clear image after sending
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          imageUrl: userMsg.imageUrl,
          history: messages,
          profile: userProfile 
        }),
      })

      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || "Server failed to respond");

      const botMsg = { role: 'bot', content: data.text }
      updateSessionState(currentSessionId, [...updatedMessages, botMsg])

    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
      updateSessionState(currentSessionId, [...updatedMessages, { role: 'bot', content: `Error connecting to AI: ${err.message}` }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        
        <div className="flex-1 flex overflow-hidden relative">
          
          {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

          {/* Sidebar */}
          <aside className={`absolute md:relative z-50 w-72 h-full bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button onClick={() => { createNewSession(); setIsSidebarOpen(false); }} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-sm">
                <Plus size={18} /> New Chat
              </button>
              <button className="md:hidden ml-2 p-2" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <p className="text-xs font-bold text-slate-400 uppercase px-2 mb-3">Recent Chats</p>
              {sessions.map(session => (
                <button 
                  key={session.id}
                  onClick={() => { setCurrentSessionId(session.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${currentSessionId === session.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                >
                  <MessageSquare size={18} className="shrink-0" />
                  <div className="truncate text-sm">{session.title}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
            <div className="p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center gap-3 shrink-0">
              <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Sparkles size={16} /></div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-tight">healthchat intelligence</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> analyzing</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-50 border-slate-200'}`}>
                      {m.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 rounded-tl-none whitespace-pre-line'}`}>
                      {/* Render Image if exists in message */}
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="Uploaded" className="max-w-full sm:max-w-[250px] rounded-xl mb-3 border border-white/20" />
                      )}
                      <span>{m.content}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-blue-600" /></div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0">
              <div className="relative max-w-4xl mx-auto flex flex-col gap-2">
                
                {/* Image Preview Box before sending */}
                {selectedImage && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-500 shadow-md">
                    <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"><X size={14} /></button>
                  </div>
                )}

                <div className="relative flex items-center">
                  {/* Image Upload Button */}
                  <label className="absolute left-2 p-2 text-slate-400 hover:text-blue-600 cursor-pointer transition">
                    <ImageIcon size={22} />
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                  </label>

                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={isUploadingImage ? "Uploading..." : "Describe symptoms, ask a question, or attach an image..."}
                    disabled={isUploadingImage}
                    className="w-full p-4 pl-12 pr-16 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none shadow-sm transition"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isTyping || isUploadingImage || (!input.trim() && !selectedImage) || !currentSessionId}
                    className="absolute right-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}