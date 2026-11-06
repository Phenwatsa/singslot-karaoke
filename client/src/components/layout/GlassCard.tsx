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
      className={`relative overflow-hidden rounded-2xl border border-pink-100/80 bg-white/90 p-6 backdrop-blur-xl shadow-sm shadow-purple-100/30 transition-all duration-200 hover:shadow-md hover:shadow-pink-100/40 hover:border-pink-200 ${className}`}
    >
      {/* Soft gentle iridescent corner glow highlights */}
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-pink-200/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-sky-100/10 blur-2xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
