import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_METERS_PER_STROKE = 8;

/**
 * Loads the user's saved distance-per-stroke calibration from user_settings.
 * Falls back to 8 m/stroke if no saved value exists or the fetch fails.
 */
export function useMetersPerStroke() {
  const [metersPerStroke, setMetersPerStroke] = useState(DEFAULT_METERS_PER_STROKE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  return { metersPerStroke, loading };
}
