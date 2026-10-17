import { corsOptions, json } from "../../utils/feedback.js";

/**
 * GET /api/feedback/export?token=…&since=ISO
 * Lists submitted reports for the local AI digest tool.
 * Requires FEEDBACK_EXPORT_TOKEN secret (Pages env). Without token → 404.
 */
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return corsOptions();
  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const expected = env.FEEDBACK_EXPORT_TOKEN;
  if (!expected) {
    return json({ error: "not_found" }, 404);
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  if (token !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  if (!env.FEEDBACK_KV) {
    return json({ error: "kv_unavailable" }, 503);
  }

  const since = url.searchParams.get("since") || "";
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") || "200")));

  const listed = await env.FEEDBACK_KV.list({ prefix: "report:", limit: 1000 });
  const reports = [];
  for (const key of listed.keys) {
    const raw = await env.FEEDBACK_KV.get(key.name);
    if (!raw) continue;
    try {
      const r = JSON.parse(raw);
      if (r.status !== "submitted") continue;
      if (since && r.submittedAt && r.submittedAt < since) continue;
      reports.push(r);
    } catch {
      /* skip */
    }
    if (reports.length >= limit) break;
  }

  reports.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));

  return json({
    ok: true,
    count: reports.length,
    reports,
  });
}
