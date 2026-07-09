'use client'

import { ReactNode } from 'react'

export type ActionButtonVariant = 'primary' | 'secondary' | 'preview' | 'edit' | 'delete' | 'ghost'

interface InventoryActionButtonProps {
  variant?: ActionButtonVariant
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
  title?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
}

/**
 * InventoryActionButton - Reusable button component for entire Inventory module
 * 
 * Variants:
 * - primary: Green button for main actions (create, save)
 * - secondary: Outlined button for secondary actions
 * - preview: Blue button for viewing details
 * - edit: Amber button for editing
 * - delete: Red button for deleting
 * - ghost: Transparent button for minimal UI
 * 
 * Supports:
 * - Icon buttons (h-9 w-9 for consistency)
 * - Text buttons (with icons or text)
 * - Loading states
 * - Disabled states
 * - Light & Dark themes
 */
export default function InventoryActionButton({
  variant = 'primary',
  onClick,
  disabled = false,
  loading = false,
  icon,
  children,
  title,
  className = '',
  size = 'md',
  fullWidth = false,
  type = 'button',
}: InventoryActionButtonProps) {
  
  // Base styles for all buttons
  const baseStyles = 'transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  // Size variants
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  }

  // Icon button styles (h-9 w-9)
  const iconButtonStyles = 'h-9 w-9 rounded-lg border flex items-center justify-center'

  // Variant styles
  const variantStyles = {
    primary: `bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600 focus:ring-emerald-500`,
    secondary: `bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700 focus:ring-gray-400 dark:focus:ring-slate-600`,
    preview: `bg-sky-500 hover:bg-sky-600 text-white dark:bg-sky-600 dark:hover:bg-sky-700 focus:ring-sky-500`,
    edit: `bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 focus:ring-amber-500`,
    delete: `bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500`,
    ghost: `text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 focus:ring-gray-400`,
  }

  // Icon button variant styles (for use with iconButtonStyles)
  const iconVariantStyles = {
    primary: `bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white dark:bg-emerald-500 dark:border-emerald-600 dark:hover:bg-emerald-600`,
    secondary: `bg-white hover:bg-gray-50 border-gray-300 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white`,
    preview: `bg-sky-600 hover:bg-sky-700 border-sky-700 text-sky-400 dark:bg-sky-800 dark:border-sky-700 dark:hover:bg-sky-700`,
    edit: `bg-amber-600 hover:bg-amber-700 border-amber-700 text-amber-400 dark:bg-amber-800 dark:border-amber-700 dark:hover:bg-amber-700`,
    delete: `bg-red-600 hover:bg-red-700 border-red-700 text-red-500 dark:bg-red-800 dark:border-red-700 dark:hover:bg-red-700`,
    ghost: `bg-transparent hover:bg-gray-100 border-gray-300 text-gray-700 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-gray-300`,
  }

  // Determine if this is an icon-only button
  const isIconOnly = icon && !children

  // Build class names
  const classes = isIconOnly
    ? `${baseStyles} ${iconButtonStyles} ${iconVariantStyles[variant]} ${className}`
    : `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={classes}
    >
      {isIconOnly ? (
        icon
      ) : (
        <div className="flex items-center justify-center gap-2">
          {icon}
          {children}
        </div>
      )}
    </button>
  )
}
