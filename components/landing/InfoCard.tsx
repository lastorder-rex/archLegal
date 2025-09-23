import type { ReactNode } from 'react';

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur">
      <div className="text-3xl text-primary" aria-hidden>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
