import type { PDFFont, PDFImage, PDFPage } from "pdf-lib";
import type { Quotation } from "../../../types";

export interface PdfFonts {
  font: PDFFont;
  boldFont: PDFFont;
  serifFont: PDFFont;
  serifBold: PDFFont;
  serifItalic: PDFFont;
  serifBoldItalic: PDFFont;
}

export interface PdfImages {
  logo: PDFImage | null;
  barcode: PDFImage | null;
  background: PDFImage | null;
  headerBg: PDFImage | null;
  footerBg: PDFImage | null;
  signature: PDFImage | null;
  stamp: PDFImage | null;
}

export interface PdfContext {
  quotation: Quotation;
  fonts: PdfFonts;
  images: PdfImages;
  business: {
    businessName: string;
    address: string;
    phone: string;
    email: string;
    siteUrl: string;
  };
}

export interface PageState {
  page: PDFPage;
  y: number;
}
