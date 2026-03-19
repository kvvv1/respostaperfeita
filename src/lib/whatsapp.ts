const DEFAULT_BOT_PHONE = "31982655571";

function normalizeWhatsAppPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    return `55${cleanPhone}`;
  }

  return cleanPhone;
}

export function getBotPhone(): string {
  return normalizeWhatsAppPhone(
    process.env.NEXT_PUBLIC_BOT_PHONE || DEFAULT_BOT_PHONE
  );
}

export function buildWhatsAppLink(phone: string, text?: string): string {
  const whatsappUrl = new URL("https://api.whatsapp.com/send/");
  whatsappUrl.searchParams.set("phone", normalizeWhatsAppPhone(phone));
  whatsappUrl.searchParams.set("text", text ?? "");
  whatsappUrl.searchParams.set("type", "phone_number");
  whatsappUrl.searchParams.set("app_absent", "0");
  return whatsappUrl.toString();
}

export function buildUpsellLink(appUrl: string, phone: string): string {
  const upsellUrl = new URL("/upsell", appUrl);
  upsellUrl.searchParams.set("phone", normalizeWhatsAppPhone(phone));
  return upsellUrl.toString();
}
