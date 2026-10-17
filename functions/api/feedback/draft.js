import {
  bumpQuota,
  corsOptions,
  FORM_BASE,
  gate,
  json,
  newId,
  sanitizeMeta,
} from "../../utils/feedback.js";

/**
 * POST { type, appVersion, ... } → { reportId, formUrl } or mailto fallback.
 * Creates a draft the web form can load; counts against soft quota.
 */
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return corsOptions();
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const meta = sanitizeMeta(body);
  const g = await gate(env, meta);
  if (!g.ok) {
    return json(
      {
        mode: "mailto",
        reason: g.reason,
        mailto: g.mailto,
        supportEmail: "feedback_meteor@jlundmark.org",
      },
      503,
    );
  }

  const reportId = newId();
  const record = {
    id: reportId,
    status: "draft",
    createdAt: new Date().toISOString(),
    ...meta,
    summary: "",
    details: "",
  };

  await g.kv.put(`draft:${reportId}`, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24,
  });
  await bumpQuota(g.kv, g.dayKey, g.monthKey);

  return json({
    mode: "form",
    reportId,
    formUrl: `${FORM_BASE}/${reportId}`,
  });
}
