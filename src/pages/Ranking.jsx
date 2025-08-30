import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Ranking({ period = "30d" }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const view = period === "7d" ? "popular_7d" : period === "all" ? "combos" : "popular_30d";
    supabase.from(view).select("*").limit(100).then(({ data, error }) => {
      if (error) console.error(error);
      setRows(data || []);
    });
  }, [period]);

  if (!rows) return <div className="animate-pulse h-40 rounded-2xl border" />;

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={r.combo_id} className="flex items-center gap-3 rounded-2xl border p-3">
          <div className="w-8 text-center font-semibold">{i+1}</div>
          <div className="flex-1 text-sm">{(r.ids_sorted || []).join(" / ")}</div>
          <div className="w-16 text-right">{r.cnt ?? r.count}</div>
          <a className="btn" href={`/?ids=${btoa((r.ids_sorted || []).join(","))}`}>見る</a>
        </div>
      ))}
    </div>
  );
}
