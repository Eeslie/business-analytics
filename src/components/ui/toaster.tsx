// Save this file as: @/components/ui/toaster.tsx

"use client"
import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ style, toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  
  return (
    <Sonner
      className="toaster group tracking-widest uppercase text-sm !font-bold"
      style={{
        "--normal-bg": "#065f46",
        "--normal-border": "#065f46",
        "--normal-text": "#ffffff",
        "--success-bg": "#065f46",
        "--success-border": "#065f46", 
        "--success-text": "#ffffff",
        "--error-bg": "#991b1b",
        "--error-border": "#991b1b",
        "--error-text": "#ffffff",
        "--warning-bg": "#d97706",
        "--warning-border": "#d97706",
        "--warning-text": "#ffffff",
        "--info-bg": "#0369a1",
        "--info-border": "#0369a1", 
        "--info-text": "#ffffff",
        ...style,
      } as React.CSSProperties}
      toastOptions={{
        classNames: {
          error: '!bg-red-900 !text-white font-bold uppercase tracking-wide',
          success: '!bg-green-900 !text-white font-bold uppercase tracking-wide',
          warning: '!bg-amber-600 !text-white font-bold uppercase tracking-wide',
          info: '!bg-blue-700 !text-white !border-blue-700 font-bold uppercase tracking-wide',
          default: 'bg-emerald-800 !text-white !border-0 font-bold uppercase tracking-wide',
        },
        ...toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }
