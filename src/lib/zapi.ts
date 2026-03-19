const ZAPI_BASE = process.env.ZAPI_BASE_URL!;
const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID!;
const TOKEN = process.env.ZAPI_TOKEN!;

function zapiUrl(path: string) {
  return `${ZAPI_BASE}/instances/${INSTANCE_ID}/token/${TOKEN}${path}`;
}

async function zapiPost(path: string, body: object) {
  const res = await fetch(zapiUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Token": process.env.ZAPI_CLIENT_TOKEN ?? "",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Z-API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function sendTextMessage(phone: string, message: string) {
  // Z-API expects phone without "+" e.g. "5511999998888"
  const cleanPhone = phone.replace(/\D/g, "");
  return zapiPost("/send-text", {
    phone: cleanPhone,
    message,
  });
}

export async function sendLinkMessage(
  phone: string,
  message: string,
  link: string,
  title: string
) {
  const cleanPhone = phone.replace(/\D/g, "");
  return zapiPost("/send-link", {
    phone: cleanPhone,
    message,
    linkUrl: link,
    title,
  });
}
