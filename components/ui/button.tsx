import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[17px] font-normal leading-tight tracking-tight transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground rounded-full hover:bg-primary/90 hover:shadow-lg shadow-md',
        destructive:
          'bg-destructive text-white rounded-full hover:bg-destructive/90 shadow-md',
        outline:
          'border-2 border-primary bg-transparent text-primary rounded-full hover:bg-primary hover:text-primary-foreground shadow-sm',
        secondary:
          'bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 shadow-sm',
        ghost:
          'rounded-full hover:bg-secondary/80',
        link: 'text-primary underline-offset-4 hover:underline rounded-none',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2 text-[15px]',
        lg: 'h-14 px-8 py-4 text-[17px]',
        icon: 'size-12 rounded-full',
        'icon-sm': 'size-10 rounded-full',
        'icon-lg': 'size-14 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
