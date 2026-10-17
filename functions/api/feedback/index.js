import {
  bumpQuota,
  corsOptions,
  FORM_BASE,
  gate,
  json,
  MAX_DETAILS,
  MAX_SUMMARY,
  newId,
  sanitizeMeta,
  statusPayload,
  buildMailto,
} from "../../utils/feedback.js";

/**
 * GET  → same as /status (convenience)
 * POST → submit completed report { summary, details, ...meta, reportId? }
 */
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return corsOptions();

  if (request.method === "GET") {
    return json(await statusPayload(env));
  }

  if (request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const summary = String(body.summary || "").trim().slice(0, MAX_SUMMARY);
  const details = String(body.details || "").trim().slice(0, MAX_DETAILS);
  if (!summary) {
    return json({ error: "summary_required" }, 400);
  }

  const meta = sanitizeMeta(body);
  const reportId = String(body.reportId || "").trim().slice(0, 24) || newId();

  const g = await gate(env, meta);
  if (!g.ok) {
    return json(
      {
        mode: "mailto",
        reason: g.reason,
        mailto: buildMailto({
          type: meta.type,
          summary,
          details,
          meta,
          reportId,
        }),
        supportEmail: "feedback_meteor@jlundmark.org",
      },
      503,
    );
  }

  // Prefer merging an existing draft when reportId matches
  let draft = null;
  if (body.reportId) {
    const raw = await g.kv.get(`draft:${reportId}`);
    if (raw) {
      try {
        draft = JSON.parse(raw);
      } catch {
        draft = null;
      }
    }
  }

  const record = {
    id: reportId,
    status: "submitted",
    createdAt: draft?.createdAt || new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    type: meta.type || draft?.type || "other",
    appVersion: meta.appVersion || draft?.appVersion || "",
    versionCode: meta.versionCode || draft?.versionCode || "",
    buildType: meta.buildType || draft?.buildType || "",
    device: meta.device || draft?.device || "",
    osSdk: meta.osSdk || draft?.osSdk || "",
    locale: meta.locale || draft?.locale || "",
    installId: meta.installId || draft?.installId || "",
    diagnostic: meta.diagnostic || draft?.diagnostic || "",
    summary,
    details,
  };

  await g.kv.put(`report:${reportId}`, JSON.stringify(record));
  await g.kv.put(`report_index:${record.submittedAt}:${reportId}`, reportId);
  if (draft) {
    await g.kv.delete(`draft:${reportId}`);
  } else {
    // New direct submit (no prior draft) counts against quota
    await bumpQuota(g.kv, g.dayKey, g.monthKey);
  }

  return json({
    mode: "form",
    ok: true,
    reportId,
    formUrl: `${FORM_BASE}/${reportId}`,
  });
}
