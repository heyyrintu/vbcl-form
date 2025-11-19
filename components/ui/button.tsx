import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "relative bg-gradient-to-r from-[#E01E1F] via-[#FEA519] to-[#E01E1F] bg-[length:200%_auto] text-white font-semibold rounded-lg shadow-[0_4px_14px_0_rgba(224,30,31,0.4)] hover:shadow-[0_6px_20px_0_rgba(224,30,31,0.5)] transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.98] hover:bg-[position:100%_0%] overflow-hidden border border-white/20 backdrop-blur-sm",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([])
  const buttonRef = React.useRef<HTMLButtonElement | HTMLElement>(null)

  const isGradient = variant === "gradient"

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLElement>) => {
    const target = e.currentTarget as HTMLElement
    
    if (isGradient && target) {
      const rect = target.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const newRipple = {
        x,
        y,
        id: Date.now(),
      }

      setRipples((prev) => [...prev, newRipple])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id))
      }, 600)
    }

    props.onClick?.(e as any)
  }
  
  return (
    <Comp
      ref={buttonRef as any}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }), isGradient && "group")}
      onClick={handleClick}
      {...props}
    >
      {isGradient && (
        <>
          {/* Animated shine sweep on hover */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out rounded-lg pointer-events-none" />
          {/* Top highlight for 3D depth effect */}
          <span className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent rounded-lg pointer-events-none" />
          {/* Outer glow effect on hover */}
          <span className="absolute -inset-0.5 bg-gradient-to-r from-[#E01E1F] via-[#FEA519] to-[#E01E1F] opacity-0 group-hover:opacity-25 blur-sm transition-opacity duration-500 rounded-lg -z-10" />
          {/* Click ripple effects */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              className="absolute rounded-full bg-white/40 pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: 0,
                height: 0,
                transform: 'translate(-50%, -50%)',
                animation: 'ripple 600ms ease-out',
              }}
            />
          ))}
        </>
      )}
      <span className={isGradient ? "relative z-10 drop-shadow-sm" : ""}>{children}</span>
    </Comp>
  )
}

export { Button, buttonVariants }
