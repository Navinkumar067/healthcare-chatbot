interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'default' | 'overlay' // Add this line to fix the TS error
}

export function LoadingSpinner({ 
  size = 'md', 
  text, 
  variant = 'default' 
}: LoadingSpinnerProps) {
  
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size]} border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-sm`}
      />
      {text && (
        <p className="text-sm font-bold text-slate-500 animate-pulse tracking-tight">
          {text.toLowerCase()}
        </p>
      )}
    </div>
  )

  // Full screen overlay style
  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
        {spinner}
      </div>
    )
  }

  return spinner
}