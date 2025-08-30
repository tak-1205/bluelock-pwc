// supabase/functions/log-combo/index.ts

// 外部ライブラリは supabase-js だけに抑える（起動安定化）
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS（必要なら調整）
const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
};

// 環境変数（両方の名前に対応：万一旧名で登録していても起動し続ける）
const PROJECT_URL      = Deno.env.get("PROJECT_URL")      ?? Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// SHA-1 を Web Crypto で（外部依存を排除）
async function sha1Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// あなたの正規化ルールと一致させる
function canonicalId(id: string) {
  return id?.normalize("NFKC").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  // 起動時に落ちないよう、ハンドラ内でチェック
  if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing env PROJECT_URL or SERVICE_ROLE_KEY" }),
      { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
    );
  }

  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 5) {
      return new Response("Invalid ids", { status: 400, headers: corsHeaders });
    }

    // 正規化→重複除去→昇順
    const canon = Array.from(new Set(ids.map((x: string) => canonicalId(String(x))))).sort();
    if (canon.length === 0 || canon.length > 5) {
      return new Response("Invalid canonical ids", { status: 400, headers: corsHeaders });
    }

    const comboId = await sha1Hex(canon.join("-"));

    // 1) combos をUPSERT（存在しないなら作成、あれば更新）
    const { error: upsertErr } = await supabase
      .from("combos")
      .upsert(
        { combo_id: comboId, ids_sorted: canon, last_seen: new Date().toISOString() },
        { onConflict: "combo_id" }
      );
    if (upsertErr) throw upsertErr;

    // 2) count +1（RPC）
    const { error: incErr } = await supabase.rpc("increment_combo_count", { p_combo_id: comboId });
    if (incErr) throw incErr;

    // 3) 生イベントを記録（匿名）
    const ua = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip");
    const uaHash = ua ? await sha1Hex(ua) : null;
    const ipHash = ip ? await sha1Hex(ip) : null;

    const { error: evtErr } = await supabase
      .from("combo_events")
      .insert({ combo_id: comboId, ua_hash: uaHash, ip_hash: ipHash });
    if (evtErr) throw evtErr;

    return new Response(JSON.stringify({ ok: true, comboId }), {
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "content-type": "application/json", ...corsHeaders } }
    );
  }
});
