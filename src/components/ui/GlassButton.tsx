import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'solid' | 'glass';
  fullWidth?: boolean;
}

export default function GlassButton({ children, variant = 'glass', fullWidth = true, className = '', ...props }: ButtonProps) {
  const cls = variant === 'solid' ? 'btn-solid' : 'btn-glass';
  return (
    <button
      type="button"
      className={`${cls} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
