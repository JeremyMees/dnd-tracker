import { cva, type VariantProps } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        'default':
          'border-4 bg-primary/50 hover:bg-primary/60 border-primary text-foreground shadow-sm',
        'default-ghost':
          'hover:bg-primary hover:text-primary-foreground',
        'secondary':
          'border-4 bg-secondary/50 hover:bg-secondary/60 border-secondary text-foreground shadow-sm',
        'secondary-ghost':
          'hover:bg-secondary hover:text-secondary-foreground',
        'tertiary':
          'border-4 bg-tertiary/50 hover:bg-tertiary/60 border-tertiary text-foreground shadow-sm',
        'tertiary-ghost':
          'hover:bg-tertiary hover:text-tertiary-foreground',
        'destructive':
          'border-4 bg-destructive/50 hover:bg-destructive/60 border-destructive text-foreground shadow-sm',
        'destructive-ghost':
          'hover:bg-destructive hover:text-destructive-foreground',
        'success':
          'border-4 bg-success/50 hover:bg-success/60 border-success text-foreground shadow-sm',
        'success-ghost':
          'hover:bg-success hover:text-success-foreground',
        'warning':
          'border-4 bg-warning/50 hover:bg-warning/60 border-warning text-foreground shadow-sm',
        'warning-ghost':
          'hover:bg-warning hover:text-warning-foreground',
        'info':
          'border-4 bg-info/50 hover:bg-info/60 border-info text-foreground shadow-sm',
        'info-ghost':
          'hover:bg-info hover:text-info-foreground',
        'help':
          'border-4 bg-help/50 hover:bg-help/60 border-help text-foreground shadow-sm',
        'help-ghost':
          'hover:bg-help hover:text-help-foreground',
        'foreground':
          'border-4 bg-foreground/50 hover:bg-foreground/60 border-foreground text-background shadow-sm',
        'foreground-ghost':
          'hover:bg-foreground hover:text-background',
        'background':
          'border-4 bg-background/50 hover:bg-background/60 border-background text-foreground shadow-sm',
        'background-ghost':
          'hover:bg-background hover:text-foreground',
        'link': 'text-muted-foreground underline-offset-4 hover:underline',
      },
      size: {
        'default': 'h-10 px-4 py-2',
        'sm': 'h-8 rounded-md px-3 text-xs',
        'lg': 'h-11 rounded-md px-8',
        'icon': 'size-10',
        'icon-sm': 'size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
