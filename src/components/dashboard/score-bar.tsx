export function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number | null | undefined;
}) {
  const value = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  const tone =
    value >= 80 ? "bg-emerald-600" : value >= 60 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{score != null ? score : "—"}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className={`h-full rounded-full ${score != null ? tone : "bg-[var(--border)]"}`}
          style={{ width: `${score != null ? value : 0}%` }}
        />
      </div>
    </div>
  );
}
