export function WeekSection({ weekNumber, theme }: { weekNumber: number; theme: string }) {
  return (
    <div className="flex items-center gap-4 py-4" data-testid={`week-divider-${weekNumber}`}>
      <div className="flex-1 h-px bg-border" />
      <h3 className="font-['Afacad',sans-serif] font-bold text-sm tracking-wide text-muted-foreground uppercase whitespace-nowrap px-2">
        Week {weekNumber}: {theme}
      </h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
