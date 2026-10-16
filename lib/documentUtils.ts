import type { AppSettings, QuotationItem } from "../types";
import { defaultSettings } from "../data/settings";

export function getSettings(): AppSettings {
  return defaultSettings;
}

export function calcItemTotal(
  item: Pick<QuotationItem, "quantity" | "unitPrice">,
): number {
  return item.quantity * item.unitPrice;
}

export interface QuotationTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function calcQuotationTotals(
  items: Pick<QuotationItem, "quantity" | "unitPrice">[],
  taxRate: number,
): QuotationTotals {
  const subtotal = items.reduce((sum, i) => sum + calcItemTotal(i), 0);
  const tax = (subtotal * taxRate) / 100;
  return { subtotal, tax, total: subtotal + tax };
}

export interface TemplateTotals {
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
}

export function calcTemplateTotals(
  items: Pick<QuotationItem, "quantity" | "unitPrice">[],
  discount: number,
  discountType: "percentage" | "fixed",
  taxRate: number,
): TemplateTotals {
  const subtotal = items.reduce((sum, i) => sum + calcItemTotal(i), 0);
  const discountAmount =
    discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = (afterDiscount * taxRate) / 100;
  return { subtotal, discountAmount, tax, total: afterDiscount + tax };
}

export function formatCurrency(amount: number): string {
  const settings = getSettings();
  const {
    currencySymbol,
    decimalPlaces,
    thousandSeparator,
    decimalSeparator,
    currencyPosition,
  } = settings.currency;
  const formatted = Math.abs(amount)
    .toLocaleString("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    })
    .replace(/,/g, thousandSeparator)
    .replace(/\./g, decimalSeparator);
  const sign = amount < 0 ? "-" : "";
  return currencyPosition === "before"
    ? `${sign}${currencySymbol}\u00A0\u00A0${formatted}`
    : `${sign}${formatted}\u00A0\u00A0${currencySymbol}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatStampDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  paid: "Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
  partial: "Partially Paid",
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned",
  new: "New",
  in_review: "In Review",
  quoted: "Quoted",
  closed: "Closed",
};

export const statusColors: Record<string, string> = {
  draft: "#6b7280",
  sent: "#3b82f6",
  accepted: "#10b981",
  rejected: "#ef4444",
  expired: "#f59e0b",
  paid: "#10b981",
  unpaid: "#f59e0b",
  overdue: "#ef4444",
  partial: "#3b82f6",
  pending: "#f59e0b",
  shipped: "#3b82f6",
  delivered: "#10b981",
  returned: "#ef4444",
  new: "#3b82f6",
  in_review: "#8b5cf6",
  quoted: "#10b981",
  closed: "#6b7280",
};

export const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  card: "Credit/Debit Card",
  bank_transfer: "Bank Transfer",
  check: "Check",
  mobile_money: "Mobile Money",
};

export function generateBarcode(userId: string, quotationCode: string): string {
  const uid = (userId || "U01").substring(0, 3).toUpperCase().padEnd(3, "0");
  return uid + quotationCode;
}

export function generateNumericId(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function generateBarcodePng(
  value: string,
): Promise<Uint8Array | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  try {
    const JsBarcode = (await import("jsbarcode")).default;
    JsBarcode(canvas, value, {
      format: "CODE128",
      displayValue: false,
      height: 40,
      width: 1.5,
      margin: 0,
      background: "#ffffff",
      lineColor: "#000000",
    });
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch {
    return null;
  }
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
