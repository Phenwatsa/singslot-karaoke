import React from 'react';
import { Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, actions }) => {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        {badge && (
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200/70 shadow-xs shadow-purple-100/40">
            <Sparkles className="h-3 w-3 text-pink-400" />
            {badge}
          </span>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-sky-500 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        {subtitle && <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
