import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  className?: string
}

export function Alert({ type = 'info', title, children, className }: AlertProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  }

  const icons = {
    info: Info,
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle
  }

  const Icon = icons[type]

  return (
    <div className={cn('border rounded-md p-4', styles[type], className)}>
      <div className="flex">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="ml-3">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className={cn('text-sm', title && 'mt-2')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}