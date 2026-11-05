import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl shadow-black/40 transition-all duration-200 ${className}`}
    >
      {/* Subtle top glow highlight */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-pink-500/10 blur-2xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
