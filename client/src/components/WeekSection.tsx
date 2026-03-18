export function WeekSection({ weekNumber, theme }: { weekNumber: number; theme: string }) {
  return (
    <div
      className="flex items-center gap-4 py-4"
      data-testid={`week-divider-${weekNumber}`}
    >
      <div
        className="flex-1 h-px rounded-full"
        style={{ background: "rgba(180,188,208,0.1)" }}
      />
      <p
        style={{
          fontFamily: "'Afacad', sans-serif",
          fontWeight: 400,
          fontSize: "12px",
          color: "#d0d6e0",
          letterSpacing: "2.4px",
          lineHeight: "24px",
          whiteSpace: "nowrap",
        }}
      >
        WEEK {weekNumber} — {theme.toUpperCase()}
      </p>
      <div
        className="flex-1 h-px rounded-full"
        style={{ background: "rgba(180,188,208,0.1)" }}
      />
    </div>
  );
}
