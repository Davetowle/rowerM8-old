export type View =
  | "home"
  | "active"
  | "summary"
  | "history"
  | "connect-sensor"
  | "buy-sensor"
  | "fit-chart"
  | "stroke-estimator"
  | "rowerm8"
  | "distance-per-stroke";

export interface SessionRecord {
  id: string;
  date: number;
  durationSec: number;
  avgSpm: number;
  strokeCount: number;
}

export interface DbSession {
  id: string;
  start_time: string;
  end_time: string;
  duration_sec: number;
  spm: number;
  stroke_count: number;
}
