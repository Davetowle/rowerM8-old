export function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatHoursMinutes(totalSec: number): string {
  const totalMin = Math.floor(totalSec / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatPace(distance: number, elapsedSec: number): string {
  if (distance <= 0 || elapsedSec <= 0) return "--:--";
  const speed = distance / elapsedSec;
  if (speed <= 0) return "--:--";
  const paceSec = 500 / speed;
  const m = Math.floor(paceSec / 60);
  const s = Math.floor(paceSec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
