let last = 0;

/** 5人の選択が確定したタイミングで1回だけ呼ぶ */
export async function logCombo(ids: string[]) {
  const now = Date.now();
  if (now - last < 3000) return; // 連打ガード（3秒）
  last = now;

  const url = import.meta.env.VITE_FUNCTION_LOG_COMBO_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anon}`,
        "apikey": anon,
      },
      body: JSON.stringify({ ids }),
    });
    // 失敗時はエラーを出してデバッグしやすく
    if (!res.ok) {
      const t = await res.text();
      // eslint-disable-next-line no-console
      console.error("logCombo failed:", res.status, t);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("logCombo error:", e);
  }
}
