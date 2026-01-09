import { cva, type VariantProps } from "class-variance-authority"
import type { InputHTMLAttributes, ReactNode } from "react"
import { forwardRef, useId } from "react"
import { cn } from "../../lib/utils"

const inputVariants = cva(
  "flex w-full rounded-xl border border-input bg-background text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      inputSize: {
        default: "h-12 px-4 py-3",
        sm: "h-10 px-3 py-2 text-xs",
        lg: "h-14 px-5 py-4 text-base",
      },
      hasError: {
        true: "border-destructive focus-visible:ring-destructive",
        false: "",
      },
      hasIcon: {
        true: "pl-11",
        false: "",
      },
    },
    defaultVariants: {
      inputSize: "default",
      hasError: false,
      hasIcon: false,
    },
  },
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    Omit<VariantProps<typeof inputVariants>, "hasIcon"> {
  label?: string
  error?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, label, error, icon, id, ...props }, ref) => {
    const fallbackId = useId()
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-") || fallbackId

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              inputVariants({
                inputSize,
                hasError: !!error,
                hasIcon: !!icon,
                className,
              }),
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = "Input"

export { Input, inputVariants }
