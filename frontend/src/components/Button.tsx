import React from "react"
import { twMerge } from "tailwind-merge"

const variants = {
  primary: "bg-purple-500  text-purple-50",
  secondary: "bg-white  text-purple-800",
  danger: "bg-red-100  text-red-800",
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

const Button: React.FC<Props> = ({ children, className, variant = "primary", ...props }) => {
  return (
    <button className={twMerge("rounded-lg font-semibold text-center py-2  px-4", variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

export default Button
