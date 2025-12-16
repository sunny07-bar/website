'use client'

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin-slow"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
      </div>
    </div>
  )
}

