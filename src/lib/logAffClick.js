// src/lib/logAffClick.js
export function logAffClick({ id, source }) {
  try {
    const url  = import.meta.env.VITE_FUNCTION_LOG_AFF_URL;   // 例: https://<PROJECT>.supabase.co/functions/v1/log-aff-click
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;      // Supabase anon public key
    if (!url || !anon) return; // 必須設定がなければ何もしない

    fetch(url, {
      method: "POST",
      mode: "cors",
      keepalive: true, // 画面遷移をブロックしない
      headers: {
        "Content-Type": "application/json",
        "apikey": anon,
        "Authorization": `Bearer ${anon}`,
      },
      body: JSON.stringify({ item_id: id, source }),
    }).catch(() => {});
  } catch {}
}
