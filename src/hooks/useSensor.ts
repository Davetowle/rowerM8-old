import { useContext } from "react";
import { SensorContext, type SensorContextValue } from "@/context/SensorContext";

export function useSensor(): SensorContextValue {
  const ctx = useContext(SensorContext);
  if (!ctx) {
    throw new Error("useSensor must be used within a SensorProvider");
  }
  return ctx;
}
