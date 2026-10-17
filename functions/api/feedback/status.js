import { corsOptions, json, statusPayload } from "../../utils/feedback.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return corsOptions();
  if (context.request.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }
  return json(await statusPayload(context.env));
}
