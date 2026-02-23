'use client'

import { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Send, Bot, User, AlertTriangle, Loader2, Sparkles, Plus, MessageSquare, Menu, X, Image as ImageIcon, Volume2, Square, Languages, Download, Mic, Users } from 'lucide-react'
import { ProtectedRoute } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type ChatMessage = { role: string; content: string; imageUrl?: string };
type ChatSession = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };

export default function ChatbotPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  
  // PATIENT SELECTOR STATE
  const [activePatientId, setActivePatientId] = useState<string>('self')
  
  // CURRENT PATIENT'S CHAT SESSIONS
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [spokenLang, setSpokenLang] = useState('ta-IN')
  const recognitionRef = useRef<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === currentSessionId)
  const messages = activeSession ? activeSession.messages : []

  useEffect(() => {
    fetchProfile()
    return () => {
      window.speechSynthesis.cancel()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  const fetchProfile = async () => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      const { data } = await supabase.from('profiles').select('*').eq('email', email).single()
      if (data) {
        setUserProfile(data)
        loadPatientSessions(data, 'self') // Load main user by default
      }
    }
  }

  // Handle Switching Patients
  const handlePatientSwitch = (patientId: string) => {
    setActivePatientId(patientId)
    loadPatientSessions(userProfile, patientId)
    setIsSidebarOpen(false)
  }

  const loadPatientSessions = (fullProfileData: any, targetPatientId: string) => {
    let targetHistory = []
    let targetName = fullProfileData.full_name?.split(' ')[0] || ''

    if (targetPatientId === 'self') {
      targetHistory = fullProfileData.chat_history || []
    } else {
      const familyMember = fullProfileData.family_members?.find((m: any) => m.id === targetPatientId)
      if (familyMember) {
        targetHistory = familyMember.chat_history || []
        targetName = familyMember.full_name?.split(' ')[0] || ''
      }
    }

    // Handle Legacy format migration
    if (targetHistory.length > 0 && targetHistory[0].role) {
      const migratedSession: ChatSession = { id: Date.now().toString(), title: 'Previous Conversation', messages: targetHistory, updatedAt: Date.now() }
      setSessions([migratedSession])
      setCurrentSessionId(migratedSession.id)
      syncToDatabase(targetPatientId, [migratedSession], fullProfileData)
    } else if (targetHistory.length > 0) {
      setSessions(targetHistory)
      setCurrentSessionId(targetHistory[0].id)
    } else {
      // Create fresh session
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Conversation',
        messages: [{ role: 'bot', content: `Hello ${targetName}! I have safely loaded your specific medical records. How can I assist you today?` }],
        updatedAt: Date.now()
      }
      setSessions([newSession])
      setCurrentSessionId(newSession.id)
      syncToDatabase(targetPatientId, [newSession], fullProfileData)
    }
  }

  const syncToDatabase = async (patientId: string, updatedSessions: ChatSession[], currentProfileData = userProfile) => {
    if (!currentProfileData || !userEmail) return

    let dbUpdate = {}
    if (patientId === 'self') {
      dbUpdate = { chat_history: updatedSessions }
      setUserProfile({ ...currentProfileData, chat_history: updatedSessions })
    } else {
      const updatedFamily = currentProfileData.family_members.map((m: any) => 
        m.id === patientId ? { ...m, chat_history: updatedSessions } : m
      )
      dbUpdate = { family_members: updatedFamily }
      setUserProfile({ ...currentProfileData, family_members: updatedFamily })
    }

    await supabase.from('profiles').update(dbUpdate).eq('email', userEmail)
  }

  const createNewSession = () => {
    let targetName = ''
    if (activePatientId === 'self') {
      targetName = userProfile?.full_name?.split(' ')[0] || ''
    } else {
      const mem = userProfile?.family_members?.find((m: any) => m.id === activePatientId)
      targetName = mem?.full_name?.split(' ')[0] || ''
    }

    const newSession: ChatSession = {
      id: Date.now().toString(), title: 'New Conversation',
      messages: [{ role: 'bot', content: `Hello ${targetName}! I have your medical records ready. How can I help you?` }],
      updatedAt: Date.now()
    }
    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    setCurrentSessionId(newSession.id)
    syncToDatabase(activePatientId, updatedSessions)
  }

  const updateSessionState = (sessionId: string, newMessages: ChatMessage[], firstUserMessageContent?: string) => {
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
    syncToDatabase(activePatientId, updatedSessions)
  }

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  const downloadPDF = async () => { /* ... (Same as before) ... */ 
    const element = document.getElementById('chat-download-area')
    if (!element) return
    const toastId = toast.loading('Generating PDF...')
    try {
      //@ts-ignore
      const html2pdf = (await import('html2pdf.js')).default
      const opt = { margin: 0.5, filename: `HealthChat-${activeSession?.title || 'Session'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } }
      await html2pdf().set(opt).from(element).save()
      toast.success('PDF downloaded safely!', { id: toastId })
    } catch (err) { toast.error('Failed to generate PDF', { id: toastId }) }
  }

  const handleSpeak = (text: string) => { /* ... (Same as before) ... */ 
    if (!('speechSynthesis' in window)) return toast.error("Speech not supported")
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const indianVoice = voices.find(v => v.lang.startsWith('hi-') || v.lang.startsWith('ta-') || v.lang.startsWith('te-') || v.lang.startsWith('kn-') || v.lang.includes('IN'))
    if (indianVoice) utterance.voice = indianVoice
    utterance.onstart = () => setIsSpeaking(true); utterance.onend = () => setIsSpeaking(false); utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsSpeaking(false) }

  const toggleListening = () => { /* ... (Same as before) ... */ 
    if (isListening) { if (recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error("Voice typing is not supported.");
    const recognition = new SpeechRecognition(); recognition.lang = spokenLang; recognition.continuous = false; recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => { let currentTranscript = ''; for (let i = event.resultIndex; i < event.results.length; i++) { currentTranscript += event.results[i][0].transcript; } setInput(currentTranscript); };
    recognition.onerror = () => setIsListening(false); recognition.onend = () => setIsListening(false);
    recognition.start(); recognitionRef.current = recognition;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... (Same as before) ... */ 
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploadingImage(true); const toastId = toast.loading('Attaching image...');
    try {
      const fileName = `chat-img-${Date.now()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('reports').upload(fileName, file); if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName); setSelectedImage(publicUrl); toast.success('Image attached!', { id: toastId })
    } catch (err) { toast.error('Upload failed', { id: toastId }) } finally { setIsUploadingImage(false) }
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !currentSessionId) return
    const userMsg = { role: 'user', content: input || "Please analyze this image.", imageUrl: selectedImage || undefined }
    const updatedMessages = [...messages, userMsg]
    updateSessionState(currentSessionId, updatedMessages, input)
    setInput(''); setSelectedImage(null); setIsTyping(true);
    if (isSpeaking) stopSpeaking()
    if (isListening) toggleListening()

    // Package the CORRECT patient's profile to send to the AI
    let activeProfileToAnalyze = userProfile
    if (activePatientId !== 'self') {
      activeProfileToAnalyze = userProfile.family_members.find((m: any) => m.id === activePatientId)
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, imageUrl: userMsg.imageUrl, history: messages, profile: activeProfileToAnalyze }),
      })
      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || "Server error")
      updateSessionState(currentSessionId, [...updatedMessages, { role: 'bot', content: data.text }])
    } catch (err: any) {
      toast.error(err.message)
      updateSessionState(currentSessionId, [...updatedMessages, { role: 'bot', content: "Connection error. Please try again." }])
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

          <aside className={`absolute md:relative z-50 w-72 h-full bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            
            {/* PATIENT SELECTOR DROPDOWN */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Active Patient</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={activePatientId} 
                  onChange={(e) => handlePatientSwitch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="self">Me ({userProfile?.full_name?.split(' ')[0] || 'Primary'})</option>
                  {userProfile?.family_members?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.full_name || 'Unnamed Member'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => { createNewSession(); setIsSidebarOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-sm">
                <Plus size={18} /> New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <p className="text-xs font-bold text-slate-400 uppercase px-2 mb-3">Recent History</p>
              {sessions.map(s => (
                <button key={s.id} onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${currentSessionId === s.id ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  <MessageSquare size={18} className="shrink-0" /><div className="truncate text-sm">{s.title}</div>
                </button>
              ))}
              {sessions.length === 0 && <p className="px-2 text-xs text-slate-400 italic">No history for this patient.</p>}
            </div>
          </aside>

          <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950">
            <div className="p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center gap-3 shrink-0">
              <button className="md:hidden p-2 -ml-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${activePatientId === 'self' ? 'bg-blue-600' : 'bg-amber-500'}`}><Sparkles size={16} /></div>
              <div>
                <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                  HealthChat Intelligence
                  {activePatientId !== 'self' && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded-md">Family Mode</span>}
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> analyzing records</p>
              </div>
              
              <button onClick={downloadPDF} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600 transition rounded-lg border border-slate-200 dark:border-slate-700">
                <Download size={14} /> <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider">Save PDF</span>
              </button>
            </div>

            <div id="chat-download-area" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-950">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'user' ? (activePatientId === 'self' ? 'bg-blue-600 text-white border-blue-500' : 'bg-amber-500 text-white border-amber-400') : 'bg-slate-50 border-slate-200'}`}>
                      {m.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col relative ${m.role === 'user' ? (activePatientId === 'self' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-amber-500 text-white rounded-tr-none') : 'bg-slate-50 border border-slate-100 dark:border-slate-800 rounded-tl-none whitespace-pre-line'}`}>
                      {m.imageUrl && <img src={m.imageUrl} alt="Uploaded" className="max-w-full sm:max-w-[250px] rounded-xl mb-3 border border-white/20" />}
                      <span>{m.content}</span>
                      {m.role === 'bot' && (
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700" data-html2canvas-ignore>
                          <button onClick={() => handleSpeak(m.content)} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 transition">
                            <Volume2 size={12} /> Listen
                          </button>
                          {isSpeaking && <button onClick={stopSpeaking} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition"><Square size={10} /> Stop</button>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start gap-3" data-html2canvas-ignore>
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

            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0">
              <div className="relative max-w-4xl mx-auto flex flex-col gap-2">
                {selectedImage && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-500 shadow-md">
                    <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"><X size={14} /></button>
                  </div>
                )}
                <div className="relative flex items-center">
                  <label className="absolute left-2 p-2 text-slate-400 hover:text-blue-600 cursor-pointer transition">
                    <ImageIcon size={22} /><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                  </label>
                  
                  <input 
                    value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder={isListening ? "Listening..." : "Ask in any language..."} 
                    disabled={isUploadingImage} 
                    className={`w-full p-4 pl-12 pr-32 rounded-2xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 ${activePatientId === 'self' ? 'focus:ring-blue-600' : 'focus:ring-amber-500'} outline-none shadow-sm transition ${isListening ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-200'}`} 
                  />
                  
                  <div className="absolute right-14 flex items-center gap-1 sm:gap-2">
                    <select value={spokenLang} onChange={(e) => setSpokenLang(e.target.value)} className="bg-transparent text-[10px] sm:text-xs text-slate-500 font-bold uppercase outline-none cursor-pointer hover:text-blue-600 transition"><option value="ta-IN">தமிழ்</option><option value="hi-IN">हिंदी</option><option value="te-IN">తెలుగు</option><option value="kn-IN">ಕನ್ನಡ</option><option value="en-IN">ENG</option></select>
                    <button onClick={toggleListening} className={`p-2 rounded-full transition ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}><Mic size={20} /></button>
                  </div>

                  <button onClick={handleSend} disabled={isTyping || isUploadingImage || (!input.trim() && !selectedImage) || !currentSessionId} className={`absolute right-2 p-2 text-white rounded-xl transition disabled:opacity-50 ${activePatientId === 'self' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
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