'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/navbar'
import { Bot, User, Sparkles, AlertCircle } from 'lucide-react'

export default function SharedChatPage() {
  const params = useParams()
  const [chat, setChat] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_chats')
          .select('*')
          .eq('id', params.id as string)
          .single()

        if (error) throw error
        setChat(data)
      } catch (err) {
        console.error("Chat not found", err)
      } finally {
        setLoading(false)
      }
    }
    
    if (params.id) fetchSharedChat()
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center text-slate-500">Loading chat...</div>
    </div>
  )

  if (!chat) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
        <AlertCircle size={40} className="text-slate-300" />
        <p>This shared chat link is invalid or no longer exists.</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      
      <main className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full bg-white dark:bg-slate-950 shadow-sm border-x border-slate-100 dark:border-slate-800">
        <div className="p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-blue-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">{chat.title}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Shared Read-Only View</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            {new Date(chat.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {chat.messages.map((m: any, i: number) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${m.role === 'user' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-50 border-slate-200'}`}>
                  {m.role === 'user' ? <User size={14}/> : <Bot size={14}/>}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-50 border border-slate-100 dark:border-slate-800 rounded-tl-none whitespace-pre-line'}`}>
                  {m.imageUrl && <img src={m.imageUrl} alt="Uploaded" className="max-w-full sm:max-w-[250px] rounded-xl mb-3 border border-white/20" />}
                  <span>{m.content}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}