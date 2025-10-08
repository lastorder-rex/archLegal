interface TimelineStep {
  icon: string;
  title: string;
  description: string;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <ol className="relative mx-auto max-w-5xl space-y-8 border-l border-border/70 pl-6">
      {steps.map(({ icon, title, description }, index) => (
        <li key={title} className="ml-4">
          <div
            className="absolute -left-[13px] mt-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-card text-xl"
            aria-hidden
          >
            {icon}
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/95 p-5 shadow-md backdrop-blur transition hover:border-primary/60 hover:shadow-primary/20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">Step {index + 1}</p>
            <h4 className="mt-1 text-lg font-semibold text-card-foreground">{title}</h4>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
