import React from 'react';

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
          <span className="mb-2 inline-flex items-center rounded-full bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-400 border border-pink-500/20">
            {badge}
          </span>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        {subtitle && <p className="mt-2 text-sm text-slate-400 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
};
