import type { ReactNode } from 'react';

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/95 p-6 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="text-3xl text-primary" aria-hidden>
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>
      </div>
      <p className="text-sm text-card-foreground/80">{description}</p>
    </div>
  );
}
