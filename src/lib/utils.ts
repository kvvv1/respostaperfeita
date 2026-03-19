export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  // Ensure Brazilian international format
  if (clean.startsWith("55") && clean.length >= 12) return clean;
  if (clean.length === 11 || clean.length === 10) return `55${clean}`;
  return clean;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function isPast(date: Date | string): boolean {
  return new Date(date) < new Date();
}

export function hoursFromNow(date: Date | string): number {
  const diff = new Date(date).getTime() - Date.now();
  return diff / (1000 * 60 * 60);
}
