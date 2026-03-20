import { createHash } from "crypto";

const PIXEL_ID = "2607572796046268";
const APP_URL = "https://www.respostaperfeita.com";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface CapiEventData {
  phone?: string;
  value?: number;
  currency?: string;
  eventId?: string;
  clientIp?: string;
  userAgent?: string;
}

export async function sendCapiEvent(eventName: string, data: CapiEventData): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn("[CAPI] META_CAPI_TOKEN not set, skipping");
    return;
  }

  const userData: Record<string, string> = {};
  if (data.phone) {
    // Normalize to E.164 digits only before hashing
    const digits = data.phone.replace(/\D/g, "");
    userData.ph = sha256(digits);
  }
  if (data.clientIp) userData.client_ip_address = data.clientIp;
  if (data.userAgent) userData.client_user_agent = data.userAgent;

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_source_url: APP_URL,
    user_data: userData,
  };

  if (data.eventId) event.event_id = data.eventId;

  if (eventName === "Purchase" && data.value !== undefined) {
    event.custom_data = {
      value: data.value,
      currency: data.currency ?? "BRL",
    };
  }

  const body = {
    data: [event],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`[CAPI] Error sending ${eventName}:`, text);
    } else {
      console.log(`[CAPI] ${eventName} sent ok`);
    }
  } catch (err) {
    console.error(`[CAPI] Fetch failed for ${eventName}:`, err);
  }
}
