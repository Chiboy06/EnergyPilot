import * as React from "react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export type ToastActionElement = React.ReactElement
