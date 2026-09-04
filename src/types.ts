export type View =
  | "home"
  | "active"
  | "summary"
  | "history"
  | "connect-sensor"
  | "buy-sensor"
  | "fit-chart"
  | "stroke-estimator"
  | "rowerm8";

export interface SessionRecord {
  id: string;
  date: number;
  durationSec: number;
  avgSpm: number;
  strokeCount: number;
}
