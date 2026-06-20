import type { InputHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
}

export default function GlassInput({ label, icon: Icon, ...props }: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          />
        )}
        <input
          {...props}
          className={`glass-input ${Icon ? 'pl-10' : ''} ${props.className || ''}`}
        />
      </div>
    </div>
  );
}
