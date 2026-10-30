import { PDFDocument, PDFFont, PDFImage, StandardFonts } from "pdf-lib";
import type { PdfFonts, PdfImages } from "./types";
import {
  fetchImageBytes,
  generateBarcode,
  generateBarcodePng,
  getSettings,
} from "../../../lib/documentUtils";
import type { Quotation } from "../../../types";

async function embedImage(
  doc: PDFDocument,
  bytes: Uint8Array | null,
): Promise<PDFImage | null> {
  if (!bytes) return null;
  try {
    return await doc.embedPng(bytes);
  } catch {
    try {
      return await doc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

async function embedPng(
  doc: PDFDocument,
  bytes: Uint8Array | null,
): Promise<PDFImage | null> {
  if (!bytes) return null;
  try {
    return await doc.embedPng(bytes);
  } catch {
    return null;
  }
}

async function embedJpg(
  doc: PDFDocument,
  bytes: Uint8Array | null,
): Promise<PDFImage | null> {
  if (!bytes) return null;
  try {
    return await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function loadFonts(doc: PDFDocument): Promise<PdfFonts> {
  const font: PDFFont = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont: PDFFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const serifFont: PDFFont = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold: PDFFont = await doc.embedFont(
    StandardFonts.TimesRomanBold,
  );
  const serifItalic: PDFFont = await doc.embedFont(
    StandardFonts.TimesRomanItalic,
  );
  const serifBoldItalic: PDFFont = await doc.embedFont(
    StandardFonts.TimesRomanBoldItalic,
  );
  return { font, boldFont, serifFont, serifBold, serifItalic, serifBoldItalic };
}

export async function loadImages(
  doc: PDFDocument,
  quotation: Quotation,
): Promise<PdfImages> {
  const settings = getSettings();
  const { logo, stamp, signature } = settings.business;
  const barcodeValue = generateBarcode(
    quotation.userId,
    quotation.quotationCode,
  );
  const signatureSrc = quotation.createdBySignature ? quotation.createdBySignature : signature;

  const [logoBytes, barcodeBytes, bgBytes, headerBgBytes, footerBgBytes, sigBytes, stampBytes] =
    await Promise.all([
      fetchImageBytes(logo),
      generateBarcodePng(barcodeValue),
      fetchImageBytes("/backgrounds/plain.jpg"),
      fetchImageBytes("/backgrounds/qt-header.png"),
      fetchImageBytes("/backgrounds/qt-footer.png"),
      fetchImageBytes(signatureSrc),
      fetchImageBytes(stamp),
    ]);

  return {
    logo: await embedImage(doc, logoBytes),
    barcode: await embedPng(doc, barcodeBytes),
    background: await embedJpg(doc, bgBytes),
    headerBg: await embedImage(doc, headerBgBytes),
    footerBg: await embedImage(doc, footerBgBytes),
    signature: await embedImage(doc, sigBytes),
    stamp: await embedImage(doc, stampBytes),
  };
}
