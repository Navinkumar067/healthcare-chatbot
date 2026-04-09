'use client'

import { useState, useRef, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { 
  Send, Bot, User, Loader2, Sparkles, Plus, MessageSquare, Menu, X, 
  Image as ImageIcon, Volume2, Square, Mic, Users, Edit2, Trash2, Check, 
  MoreVertical, Share2, AlertOctagon, PhoneCall, MapPin, Pill, ShieldCheck 
} from 'lucide-react'
import { ProtectedRoute } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// THE GOD MODE BYPASS: This disables TypeScript's strict 'never' checking for the database
const db = supabase as any;

type ChatMessage = { role: string; content: string; imageUrl?: string };
type ChatSession = { id: string; title: string; messages: ChatMessage[]; updatedAt: number };

export default function ChatbotPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  
  const [activePatientId, setActivePatientId] = useState<string>('self')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [spokenLang, setSpokenLang] = useState('en-IN')
  const recognitionRef = useRef<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [showEmergencyCard, setShowEmergencyCard] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeSession = sessions.find(s => s.id === currentSessionId)
  const messages = activeSession ? activeSession.messages : []

  useEffect(() => {
    fetchProfile()
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
    
    return () => {
      window.speechSynthesis.cancel()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [])

  const fetchProfile = async () => {
    const email = sessionStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
      const { data } = await db.from('profiles').select('*').eq('email', email).single()
      if (data) {
        setUserProfile(data)
        loadPatientSessions(data, 'self') 
        if (data.preferences?.app?.language) {
          setSpokenLang(data.preferences.app.language)
        }
      }
    }
  }

  const handlePatientSwitch = (patientId: string) => {
    setActivePatientId(patientId)
    loadPatientSessions(userProfile, patientId)
    setIsSidebarOpen(false)
    setShowEmergencyCard(false)
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

    if (targetHistory.length > 0 && targetHistory[0].role) {
      const migratedSession: ChatSession = { id: Date.now().toString(), title: 'Previous Conversation', messages: targetHistory, updatedAt: Date.now() }
      targetHistory = [migratedSession]
    }

    const cleanedHistory = targetHistory.filter((s: ChatSession) => s.messages.length > 1 || s.title !== 'New Conversation')

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [{ role: 'bot', content: `Hello ${targetName}! How can I assist you today?` }],
      updatedAt: Date.now()
    }

    const newSessionsList = [newSession, ...cleanedHistory]
    setSessions(newSessionsList)
    setCurrentSessionId(newSession.id)
    syncToDatabase(targetPatientId, newSessionsList, fullProfileData)
  }

  const syncToDatabase = async (patientId: string, updatedSessions: ChatSession[], currentProfileData = userProfile) => {
    if (!currentProfileData || !userEmail) return
    
    let dbUpdate: any = {}
    
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
    await db.from('profiles').update(dbUpdate).eq('email', userEmail)
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
    setShowEmergencyCard(false) 
  }

  const updateSessionState = (sessionId: string, newMessages: ChatMessage[], firstUserMessageContent?: string) => {
    let updatedSessions = sessions.map(s => {
      if (s.id === sessionId) {
        let newTitle = s.title
        if (firstUserMessageContent && s.messages.length === 1 && s.title === 'New Conversation') {
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

  const startEditing = (id: string, currentTitle: string, e?: any) => {
    if(e && e.stopPropagation) e.stopPropagation()
    setEditingSessionId(id)
    setEditTitle(currentTitle)
  }

  const saveEdit = (id: string, e?: any) => {
    if(e && e.stopPropagation) e.stopPropagation()
    if (!editTitle.trim()) {
      setEditingSessionId(null)
      return
    }
    const updatedSessions = sessions.map(s => s.id === id ? { ...s, title: editTitle } : s)
    setSessions(updatedSessions)
    syncToDatabase(activePatientId, updatedSessions)
    setEditingSessionId(null)
  }

  const deleteSession = (id: string, e?: any) => {
    if(e && e.stopPropagation) e.stopPropagation()
    const updatedSessions = sessions.filter(s => s.id !== id)
    setSessions(updatedSessions)
    syncToDatabase(activePatientId, updatedSessions)
    
    if (currentSessionId === id) {
      if (updatedSessions.length > 0) setCurrentSessionId(updatedSessions[0].id)
      else createNewSession()
    }
  }

  const handleShare = async (sessionId: string, e?: any) => {
    if(e && e.stopPropagation) e.stopPropagation()
    const sessionToShare = sessions.find(s => s.id === sessionId)
    if (!sessionToShare || sessionToShare.messages.length <= 1) {
      return toast.error("Cannot share an empty conversation.")
    }
    const toastId = toast.loading('Generating shareable link...')
    try {
      const payload: any = {
        title: sessionToShare.title,
        messages: sessionToShare.messages
      };

      const { data, error } = await db.from('shared_chats').insert(payload).select('id').single()

      if (error) throw error
      
      const shareUrl = `${window.location.origin}/share/${data.id}`
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!', { id: toastId })
      } else {
        toast.success('Share link generated!', { id: toastId })
        prompt("Copy this link to share:", shareUrl) 
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to share chat.', { id: toastId })
    }
  }

  const handleSpeak = (text: string) => { 
    if (!('speechSynthesis' in window)) return toast.error("Speech not supported in this browser.")
    window.speechSynthesis.cancel()
    
    const cleanText = text.replace(/[*#_`~]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = spokenLang
    utterance.rate = 0.85 
    
    const voices = window.speechSynthesis.getVoices()
    
    let targetVoice = voices.find(v => v.lang.replace('_', '-') === spokenLang) 
                   || voices.find(v => v.lang.startsWith(spokenLang.split('-')[0]))

    if (targetVoice) {
      utterance.voice = targetVoice
    } else {
      if (spokenLang !== 'en-IN') {
        toast.error(`Warning: Your device does not have a native ${spokenLang} voice installed. It may sound robotic.`, { duration: 4000 })
      }
      utterance.voice = voices.find(v => v.lang.includes('IN')) || voices[0]
    }

    utterance.onstart = () => setIsSpeaking(true) 
    utterance.onend = () => setIsSpeaking(false) 
    utterance.onerror = (e) => {
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
    }
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => { window.speechSynthesis.cancel(); setIsSpeaking(false) }

  const toggleListening = async () => { 
    if (isListening) { 
      if (recognitionRef.current) recognitionRef.current.stop(); 
      return; 
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return toast.error("Voice typing is not supported in this browser.");
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recognition = new SpeechRecognition(); 
      recognition.lang = spokenLang; 
      recognition.continuous = false; 
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        toast.success("Listening...");
      };

      recognition.onresult = (event: any) => { 
        let currentTranscript = ''; 
        for (let i = event.resultIndex; i < event.results.length; i++) { 
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInput(prev => {
              const newVal = prev + transcript + ' ';
              // Auto-resize logic applied here as well
              if (textareaRef.current) {
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
                  }
                }, 10);
              }
              return newVal;
            });
          } else {
            currentTranscript += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => { 
        console.error("Speech Recognition Error", event.error);
        if (event.error === 'not-allowed') toast.error("Microphone access is blocked.");
        setIsListening(false); 
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start(); 
      recognitionRef.current = recognition;
    } catch (error) {
      toast.error("Microphone access denied.");
      setIsListening(false);
    }
  }

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1600; 
          const scaleSize = MAX_WIDTH / img.width;
          
          if (scaleSize < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
          } else {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', 0.9); 
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setIsUploadingImage(true);
    const toastId = toast.loading('Compressing & Attaching...');

    try {
      const file = await compressImage(rawFile); 
      const fileName = `chat-img-${Date.now()}.jpg`;
      
      const { data, error } = await db.storage.from('reports').upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = db.storage.from('reports').getPublicUrl(fileName);
      setSelectedImage(publicUrl);
      toast.success('Image attached!', { id: toastId });
    } catch (err: any) {
      toast.error("Upload failed", { id: toastId });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const triggerEmergencyMode = () => {
    setShowEmergencyCard(true)
    if (navigator.geolocation) {
      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
          setLocationLoading(false)
        },
        (error) => {
          setLocationLoading(false)
          toast.error("Could not fetch precise location. Map will use general search.")
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      toast.error("Geolocation is not supported by your browser.")
    }
  }

  const createReminderInDB = async (medicine: string, time: string) => {
    const toastId = toast.loading(`Setting reminder for ${medicine}...`)
    try {
      const payload: any = {
        user_email: userEmail,
        medicine_name: medicine,
        reminder_time: time
      };

      const { error } = await db.from('medicine_reminders').insert(payload)
      
      if (error) throw error
      
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Pill className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">Reminder Set!</p>
                <p className="mt-1 text-sm text-gray-500">We will notify you to take <span className="font-bold">{medicine}</span> at <span className="font-bold text-blue-600">{time}</span>.</p>
              </div>
            </div>
          </div>
        </div>
      ), { id: toastId, duration: 4000 })
      
    } catch (err) {
      console.error(err)
      toast.error('Failed to save reminder.', { id: toastId })
    }
  }

  // Handle typing and auto-resizing the textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Max height 150px
    }
  };

  // Handle Enter (Send) vs Shift+Enter (New Line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !currentSessionId) return
    const userMsg = { role: 'user', content: input || "Please analyze this image.", imageUrl: selectedImage || undefined }
    const updatedMessages = [...messages, userMsg]
    updateSessionState(currentSessionId, updatedMessages, input)
    
    setInput(''); 
    setSelectedImage(null); 
    setIsTyping(true);
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (isSpeaking) stopSpeaking()
    if (isListening) toggleListening()

    let activeProfileToAnalyze = userProfile
    if (activePatientId !== 'self') {
      activeProfileToAnalyze = userProfile.family_members.find((m: any) => m.id === activePatientId)
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content, 
          imageUrl: userMsg.imageUrl, 
          history: messages, 
          profile: activeProfileToAnalyze,
          language: spokenLang 
        }),
      })
      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || "Server error")
      
      let botResponseText = data.text;
      
      let isEmergencyDetected = false;
      if (botResponseText.toUpperCase().includes('[EMERGENCY]')) {
        isEmergencyDetected = true;
        botResponseText = botResponseText.replace(/\[EMERGENCY\]/gi, '').trim();
      } 
      else {
        const botLower = botResponseText.toLowerCase();
        const userLower = userMsg.content.toLowerCase();
        const isBotPanicking = botLower.includes('immediate medical attention') || botLower.includes('emergency room') || botLower.includes('call 108') || botLower.includes('life-threatening');
        const isUserPanicking = userLower.includes('chest pain') || userLower.includes('breathe') || userLower.includes('heart attack') || userLower.includes('stroke') || userLower.includes('bleeding');
        
        if (isBotPanicking && isUserPanicking) {
          isEmergencyDetected = true;
        }
      }

      const reminderRegex = /\[SET_REMINDER:\s*(.*?)\s*\|\s*(.*?)\]/i;
      const reminderMatch = botResponseText.match(reminderRegex);
      
      if (reminderMatch) {
        const medicineName = reminderMatch[1];
        const reminderTime = reminderMatch[2];
        
        botResponseText = botResponseText.replace(reminderMatch[0], '').trim();
        createReminderInDB(medicineName, reminderTime);
      }

      updateSessionState(currentSessionId, [...updatedMessages, { role: 'bot', content: botResponseText }])
      
      if (isEmergencyDetected) {
        triggerEmergencyMode();
      }

    } catch (err: any) {
      toast.error(err.message)
      updateSessionState(currentSessionId, [...updatedMessages, { role: 'bot', content: "Connection error. Please try again." }])
    } finally {
      setIsTyping(false)
    }
  }

  const renderMessageContent = (content: string) => {
    const cleanContent = content.replace(/\*\*/g, '').replace(/#/g, '');

    if (cleanContent.includes('### 📚 Verified WHO Sources Fetched:')) {
      const [mainText, sourcesText] = cleanContent.split('### 📚 Verified WHO Sources Fetched:');
      return (
        <div className="flex flex-col gap-4 w-full">
          <div className="whitespace-pre-wrap leading-relaxed">{mainText.trim()}</div>
          <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl w-full">
            <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-400 mb-2 uppercase tracking-wider">
              <ShieldCheck size={16} /> Verified WHO Sources
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed break-all">
              {sourcesText.trim()}
            </div>
          </div>
        </div>
      );
    }
    
    return <span className="whitespace-pre-wrap leading-relaxed">{cleanContent}</span>;
  };
  
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping, showEmergencyCard])

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar />
        <div className="flex-1 flex overflow-hidden relative">
          {isSidebarOpen && <div className="absolute inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

          <aside className={`absolute md:relative z-50 w-72 h-full bg-slate-50 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
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

            <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button onClick={() => { createNewSession(); setIsSidebarOpen(false); }} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-sm">
                <Plus size={18} /> New Chat
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <p className="text-xs font-bold text-slate-400 uppercase px-2 mb-3">Chats</p>
              
              {sessions.map(s => {
                const isActiveChat = currentSessionId === s.id;
                const isEditing = editingSessionId === s.id;

                return (
                  <div 
                    key={s.id} 
                    className={`group relative flex items-center justify-between px-3 py-3 rounded-xl transition cursor-pointer 
                      ${isActiveChat ? 'bg-blue-100 dark:bg-blue-900/30' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800'}`} 
                    onClick={() => { 
                      setCurrentSessionId(s.id); 
                      setIsSidebarOpen(false);
                      setShowEmergencyCard(false); 
                    }}
                  >
                    <div className={`flex-1 flex items-center gap-3 overflow-hidden ${isActiveChat ? 'text-blue-700 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                      <MessageSquare size={18} className="shrink-0" />
                      
                      {isEditing ? (
                        <div className="flex flex-1 items-center gap-1 pr-2">
                          <input 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') saveEdit(s.id, e); if(e.key === 'Escape') setEditingSessionId(null); }}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => saveEdit(s.id)}
                            autoFocus
                            className="flex-1 bg-white dark:bg-slate-950 border border-blue-300 rounded px-1.5 py-0.5 text-sm outline-none text-slate-900 dark:text-slate-100 w-full"
                          />
                          <button onClick={(e) => saveEdit(s.id, e)} className="shrink-0 p-1 text-blue-600 hover:text-blue-700 transition"><Check size={16} /></button>
                        </div>
                      ) : (
                        <div className="truncate text-sm pr-8">{s.title}</div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="absolute right-2 flex items-center z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              type="button"
                              onClick={(e) => e.stopPropagation()} 
                              className={`p-1.5 transition rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 data-[state=open]:bg-slate-200 dark:data-[state=open]:bg-slate-700 data-[state=open]:text-slate-600 dark:data-[state=open]:text-slate-200 data-[state=open]:opacity-100 ${isActiveChat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl border-slate-200 dark:border-slate-700 shadow-xl p-1 z-[100]">
                            <DropdownMenuItem onClick={(e) => startEditing(s.id, s.title, e)} className="gap-2 cursor-pointer text-slate-700 dark:text-slate-300 rounded-lg">
                              <Edit2 size={14} /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleShare(s.id, e)} className="gap-2 cursor-pointer text-slate-700 dark:text-slate-300 rounded-lg">
                              <Share2 size={14} /> Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-700 my-1" />
                            <DropdownMenuItem onClick={(e) => deleteSession(s.id, e)} className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg font-medium">
                              <Trash2 size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )
              })}
              {sessions.length === 0 && <p className="px-2 text-xs text-slate-400 italic">No history for this patient.</p>}
            </div>
          </aside>

          <main className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 relative">
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
            </div>

            {showEmergencyCard && (
              <div className="absolute top-20 left-4 right-4 md:left-10 md:right-10 z-30 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-4 shadow-xl shadow-red-500/10 flex flex-col sm:flex-row gap-4 items-center justify-between animate-in fade-in slide-in-from-top-4">
                <div className="flex items-start gap-3">
                  <div className="bg-red-500 text-white p-2 rounded-full shrink-0">
                    <AlertOctagon size={24} />
                  </div>
                  <div>
                    <h3 className="text-red-700 dark:text-red-400 font-bold text-lg leading-tight">Emergency Detected</h3>
                    <p className="text-red-600/80 dark:text-red-400/80 text-sm">Please seek immediate medical attention.</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <a href="tel:108" className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors">
                    <PhoneCall size={18} className="animate-pulse" /> Call 108
                  </a>
                  <a href={userLocation ? `http://maps.google.com/?q=${userLocation.lat},${userLocation.lng}` : `https://www.google.com/maps/search/nearby+clinics`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors">
                    {locationLoading ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
                    {locationLoading ? "Locating..." : "Nearby Clinics"}
                  </a>
                  <button onClick={() => setShowEmergencyCard(false)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1">
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-950">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 w-full sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'user' ? (activePatientId === 'self' ? 'bg-blue-600 text-white border-blue-500' : 'bg-amber-500 text-white border-amber-400') : 'bg-slate-50 border-slate-200'}`}>
                      {m.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm shadow-sm flex flex-col relative w-full ${m.role === 'user' ? (activePatientId === 'self' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-amber-500 text-white rounded-tr-none') : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none'}`}>
                      {m.imageUrl && <img src={m.imageUrl} alt="Uploaded" className="max-w-full sm:max-w-[250px] rounded-xl mb-3 border border-white/20" />}
                      
                      {renderMessageContent(m.content)}
                      
                      {m.role === 'bot' && (
                        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
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
                <div className="flex justify-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-blue-600" /></div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} className="h-4" />
            </div>

            <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 shrink-0 relative z-40">
              <div className="relative max-w-4xl mx-auto flex flex-col gap-2">

                {selectedImage && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-500 shadow-md">
                    <img src={selectedImage} alt="preview" className="w-full h-full object-cover" />
                    <button onClick={() => setSelectedImage(null)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"><X size={14} /></button>
                  </div>
                )}
                
                {/* UPDATED: Switched from <input> to <textarea> and set the flex wrapper 
                  to items-end so absolute elements stay at the bottom when text expands. 
                */}
                <div className="relative flex items-end">
                  <input type="file" accept="image/*" className="hidden" id="general-image-upload" onChange={handleImageUpload} disabled={isUploadingImage} />
                  <label htmlFor="general-image-upload" className="absolute left-2 bottom-[14px] p-2 text-slate-400 hover:text-blue-600 cursor-pointer transition">
                    <ImageIcon size={22} />
                  </label>
                  
                  <textarea 
                    ref={textareaRef}
                    rows={1}
                    value={input} 
                    onChange={handleInputChange} 
                    onKeyDown={handleKeyDown} 
                    placeholder={isListening ? "Listening..." : "Ask in any language..."} 
                    disabled={isUploadingImage} 
                    className={`w-full py-4 pl-12 pr-[140px] md:pr-[170px] rounded-2xl border bg-slate-50 dark:bg-slate-900 focus:ring-2 ${activePatientId === 'self' ? 'focus:ring-blue-600' : 'focus:ring-amber-500'} outline-none shadow-sm transition resize-none custom-scrollbar ${isListening ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-200'}`} 
                    style={{ minHeight: '56px', maxHeight: '150px' }}
                  />
                  
                  <div className="absolute right-14 bottom-[10px] flex items-center gap-1 sm:gap-2">
                    <select value={spokenLang} onChange={(e) => setSpokenLang(e.target.value)} className="bg-transparent text-[10px] sm:text-xs text-slate-500 font-bold uppercase outline-none cursor-pointer hover:text-blue-600 transition max-w-[80px] sm:max-w-[120px] truncate">
                      <option value="en-IN">English</option>
                      <option value="hi-IN">Hindi</option>
                      <option value="ta-IN">தமிழ்</option>
                      <option value="te-IN">Telugu</option>
                      <option value="kn-IN">Kannada</option>
                      <option value="ml-IN">Malayalam</option>
                      <option value="mr-IN">Marathi</option>
                      <option value="bn-IN">Bengali</option>
                      <option value="gu-IN">Gujarati</option>
                      <option value="pa-IN">Punjabi</option>
                      <option value="or-IN">Odia</option>
                      <option value="ur-IN">Urdu</option>
                    </select>
                    <button type="button" onClick={toggleListening} className={`p-2 rounded-full transition ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-blue-600'}`}><Mic size={20} /></button>
                  </div>

                  <button onClick={handleSend} disabled={isTyping || isUploadingImage || (!input.trim() && !selectedImage) || !currentSessionId} className={`absolute right-2 bottom-[8px] p-2 text-white rounded-xl transition disabled:opacity-50 ${activePatientId === 'self' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
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