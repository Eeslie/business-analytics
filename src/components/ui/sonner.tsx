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
          error: 'bg-red-800 text-white border-red-800 font-bold uppercase tracking-widest',
          success: 'bg-emerald-800 text-white border-emerald-800 font-bold uppercase tracking-widest',
          warning: 'bg-amber-600 text-white border-amber-600 font-bold uppercase tracking-widest',
          info: 'bg-blue-700 text-white border-blue-700 font-bold uppercase tracking-widest',
          default: 'bg-emerald-800 text-white border-emerald-800 font-bold uppercase tracking-widest',
        },
        ...toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }