import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_METERS_PER_STROKE = 8;

/**
 * Loads the user's saved distance-per-stroke calibration from user_settings.
 * Falls back to 8 m/stroke if no saved value exists or the fetch fails.
 * Call `reload()` after the user saves a new value on the DPS screen so
 * downstream screens pick up the update without a full page reload.
 */
export function useMetersPerStroke() {
  const [metersPerStroke, setMetersPerStroke] = useState(DEFAULT_METERS_PER_STROKE);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("meters_per_stroke")
        .maybeSingle();

      if (error) {
        console.error("[useMetersPerStroke] load error:", error.message);
      } else if (data?.meters_per_stroke != null) {
        setMetersPerStroke(Number(data.meters_per_stroke));
      }
    } catch (err) {
      console.error("[useMetersPerStroke] load threw:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { metersPerStroke, loading, reload: load };
}
