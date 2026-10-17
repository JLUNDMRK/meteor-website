import { corsOptions, json } from "../../utils/feedback.js";

/**
 * GET /api/feedback/:id — load draft or submitted report for the web form.
 * No listing; id must be known (from QR / app).
 */
export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method === "OPTIONS") return corsOptions();
  if (request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const id = String(params.id || "").trim().slice(0, 24);
  if (!/^[a-f0-9]{8,24}$/i.test(id)) {
    return json({ error: "invalid_id" }, 400);
  }

  if (!env.FEEDBACK_KV) {
    return json({ error: "kv_unavailable", mode: "mailto" }, 503);
  }

  const draftRaw = await env.FEEDBACK_KV.get(`draft:${id}`);
  if (draftRaw) {
    try {
      const draft = JSON.parse(draftRaw);
      return json({ mode: "form", record: draft });
    } catch {
      /* fall through */
    }
  }

  const reportRaw = await env.FEEDBACK_KV.get(`report:${id}`);
  if (reportRaw) {
    try {
      const report = JSON.parse(reportRaw);
      return json({ mode: "form", record: report });
    } catch {
      /* fall through */
    }
  }

  return json({ error: "not_found" }, 404);
}
