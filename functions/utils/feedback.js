/**
 * Shared helpers for Meteor structured feedback (FEAT-096).
 * Free-tier only: soft quotas + mailto fallback when over / KV missing / kill-switch.
 */

export const SUPPORT_EMAIL = "feedback_meteor@jlundmark.org";
export const FORM_BASE = "https://meteor.jlundmark.org/feedback";

/** Soft caps under Cloudflare free ceiling — we close the form before billing. */
export const QUOTA_PER_DAY = 100;
export const QUOTA_PER_MONTH = 2000;

export const MAX_SUMMARY = 500;
export const MAX_DETAILS = 4000;
export const MAX_DIAGNOSTIC = 4096;
export const DRAFT_TTL_SECONDS = 60 * 60 * 24; // 24h

const TYPES = new Set(["bug", "feedback", "resolve", "playback", "other"]);

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}

export function newId() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

function utcParts(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return { dayKey: `${y}-${m}-${day}`, monthKey: `${y}-${m}` };
}

export function normalizeType(raw) {
  const t = String(raw || "other").trim().toLowerCase();
  return TYPES.has(t) ? t : "other";
}

export function sanitizeMeta(input = {}) {
  return {
    type: normalizeType(input.type),
    appVersion: String(input.appVersion || "").trim().slice(0, 32),
    versionCode: String(input.versionCode || "").trim().slice(0, 16),
    buildType: String(input.buildType || "").trim().slice(0, 24),
    device: String(input.device || "").trim().slice(0, 16),
    osSdk: String(input.osSdk || "").trim().slice(0, 8),
    locale: String(input.locale || "").trim().slice(0, 16),
    installId: String(input.installId || "").trim().slice(0, 40),
    diagnostic: String(input.diagnostic || "").trim().slice(0, MAX_DIAGNOSTIC),
  };
}

export function buildMailto({ type, summary, details, meta, reportId }) {
  const subject = `[Meteor ${type}] ${String(summary || "Feedback").trim().slice(0, 80)}`;
  const lines = [
    String(details || summary || "").trim(),
    "",
    "---",
    `type: ${type}`,
    `reportId: ${reportId || ""}`,
    `appVersion: ${meta.appVersion || ""}`,
    `versionCode: ${meta.versionCode || ""}`,
    `buildType: ${meta.buildType || ""}`,
    `device: ${meta.device || ""}`,
    `osSdk: ${meta.osSdk || ""}`,
    `locale: ${meta.locale || ""}`,
    meta.diagnostic ? `diagnostic:\n${meta.diagnostic}` : "",
  ].filter(Boolean);
  const body = lines.join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * @returns {{ ok: true, kv: KVNamespace } | { ok: false, reason: string, mailto: string }}
 */
export async function gate(env, metaForMailto = {}) {
  const meta = sanitizeMeta(metaForMailto);
  const mailto = buildMailto({
    type: meta.type,
    summary: "Feedback (quota / offline)",
    details: "Structured form unavailable — sending via email.",
    meta,
  });

  if (!env || !env.FEEDBACK_KV) {
    return { ok: false, reason: "kv_unavailable", mailto };
  }

  const enabled = await env.FEEDBACK_KV.get("feedback_enabled");
  if (enabled === "0" || enabled === "false") {
    return { ok: false, reason: "disabled", mailto };
  }

  const { dayKey, monthKey } = utcParts();
  const dayCount = Number((await env.FEEDBACK_KV.get(`quota:day:${dayKey}`)) || "0");
  const monthCount = Number((await env.FEEDBACK_KV.get(`quota:month:${monthKey}`)) || "0");

  if (dayCount >= QUOTA_PER_DAY || monthCount >= QUOTA_PER_MONTH) {
    return {
      ok: false,
      reason: "quota",
      mailto,
      dayCount,
      monthCount,
      quotaDay: QUOTA_PER_DAY,
      quotaMonth: QUOTA_PER_MONTH,
    };
  }

  return {
    ok: true,
    kv: env.FEEDBACK_KV,
    dayKey,
    monthKey,
    dayCount,
    monthCount,
    quotaDay: QUOTA_PER_DAY,
    quotaMonth: QUOTA_PER_MONTH,
  };
}

export async function bumpQuota(kv, dayKey, monthKey) {
  const dayCount = Number((await kv.get(`quota:day:${dayKey}`)) || "0") + 1;
  const monthCount = Number((await kv.get(`quota:month:${monthKey}`)) || "0") + 1;
  await kv.put(`quota:day:${dayKey}`, String(dayCount), { expirationTtl: 60 * 60 * 48 });
  await kv.put(`quota:month:${monthKey}`, String(monthCount), { expirationTtl: 60 * 60 * 24 * 40 });
  return { dayCount, monthCount };
}

export async function statusPayload(env) {
  const g = await gate(env, {});
  if (!g.ok) {
    return {
      mode: "mailto",
      reason: g.reason,
      mailto: g.mailto,
      supportEmail: SUPPORT_EMAIL,
      formUrl: FORM_BASE + "/",
      quotaDay: QUOTA_PER_DAY,
      quotaMonth: QUOTA_PER_MONTH,
      dayCount: g.dayCount ?? null,
      monthCount: g.monthCount ?? null,
    };
  }
  return {
    mode: "form",
    supportEmail: SUPPORT_EMAIL,
    formUrl: FORM_BASE + "/",
    quotaDay: g.quotaDay,
    quotaMonth: g.quotaMonth,
    dayCount: g.dayCount,
    monthCount: g.monthCount,
  };
}
