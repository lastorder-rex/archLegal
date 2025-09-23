interface TimelineProps {
  steps: string[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <ol className="relative mx-auto max-w-4xl space-y-6 border-l border-border/70 pl-6">
      {steps.map((step, index) => (
        <li key={step} className="ml-4">
          <div className="absolute -left-[11px] mt-1 h-5 w-5 rounded-full border-2 border-primary bg-background" aria-hidden />
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm bg-opacity-80">
            <p className="text-sm font-semibold text-primary">STEP {index + 1}</p>
            <p className="mt-1 text-base text-foreground">{step}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
