'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-forest text-white disabled:opacity-50',
  ghost: 'bg-transparent text-ink/70 hover:text-ink',
  danger: 'bg-red-500 text-white disabled:opacity-50',
};

const sizes = {
  sm: 'px-4 py-2 text-sm min-h-[44px]',
  md: 'px-5 py-3 text-base min-h-[56px]',
  lg: 'px-6 py-4 text-lg min-h-[64px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`w-full rounded-xl font-mukta font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
