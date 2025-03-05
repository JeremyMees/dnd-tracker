import type { ToastRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'

import { cva, type VariantProps } from 'class-variance-authority'

export { default as Toast } from './Toast.vue'
export { default as ToastAction } from './ToastAction.vue'
export { default as ToastClose } from './ToastClose.vue'
export { default as ToastDescription } from './ToastDescription.vue'
export { default as Toaster } from './Toaster.vue'
export { default as ToastProvider } from './ToastProvider.vue'
export { default as ToastTitle } from './ToastTitle.vue'
export { default as ToastViewport } from './ToastViewport.vue'
export { toast, useToast } from './use-toast'

export const toastVariants = cva(
  'text-foreground backdrop-blur-xl group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border-4 p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[--radix-toast-swipe-end-x] data-[swipe=move]:translate-x-[--radix-toast-swipe-move-x] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border-muted-foreground bg-muted-foreground/50',
        destructive: 'border-destructive bg-destructive/50',
        primary: 'border-primary bg-primary/50',
        secondary: 'border-secondary bg-secondary/50',
        tertiary: 'border-tertiary bg-tertiary/50',
        info: 'border-info bg-info/50',
        success: 'border-success bg-success/50',
        warning: 'border-warning bg-warning/50',
        help: 'border-help bg-help/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

type ToastVariants = VariantProps<typeof toastVariants>

export interface ToastProps extends ToastRootProps {
  class?: HTMLAttributes['class']
  variant?: ToastVariants['variant']
  onOpenChange?: ((value: boolean) => void) | undefined
}
