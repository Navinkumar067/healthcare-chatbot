'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'

export function ReminderTracker() {
  useEffect(() => {
    const email = sessionStorage.getItem('userEmail')
    if (!email) return

    const checkReminders = async () => {
      const { data } = await supabase.from('medicine_reminders').select('*').eq('user_email', email)
      if (!data || data.length === 0) return

      const now = new Date()
      let hours = now.getHours()
      const minutes = now.getMinutes()
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12 
      
      const minsStr = minutes < 10 ? '0' + minutes : minutes
      const hoursStr = hours < 10 ? '0' + hours : hours
      
      // We generate variations to handle any slight formatting differences from the AI
      const timeFormats = [
        `${hoursStr}:${minsStr} ${ampm}`, // "08:00 PM"
        `${hoursStr}:${minsStr}${ampm}`,  // "08:00PM"
        `${hours}:${minsStr} ${ampm}`,    // "8:00 PM"
        `${hours}:${minsStr}${ampm}`      // "8:00PM"
      ]

      data.forEach((reminder: any) => {
        const dbTime = reminder.reminder_time?.trim().toUpperCase()
        
        if (timeFormats.includes(dbTime)) {
           // We use a session key so it only alarms ONCE per day, not 60 times during that minute
           const cacheKey = `reminder_${reminder.id}_${now.toDateString()}`
           
           if (!sessionStorage.getItem(cacheKey)) {
              toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white border border-blue-200 shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-4`}>
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
                       <Bell className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Alarm</p>
                      <p className="text-lg font-black text-slate-800">Time for Medicine!</p>
                    </div>
                  </div>
                  <p className="text-slate-600 font-medium text-lg">
                    Please take <span className="font-bold text-blue-600 text-xl px-1">{reminder.medicine_name}</span> right now.
                  </p>
                </div>
              ), { duration: 30000 })
              
              // Play a built-in browser beep sound
              try {
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg')
                audio.play()
              } catch (e) {}

              sessionStorage.setItem(cacheKey, 'true')
           }
        }
      })
    }

    // Check immediately on load, then check the clock every 30 seconds
    checkReminders()
    const interval = setInterval(checkReminders, 30000)

    return () => clearInterval(interval)
  }, [])

  return null // This component is invisible
}