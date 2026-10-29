import { PDFDocument, PDFPage } from "pdf-lib";
import type { Quotation } from "../../types";
import {
  downloadPDF,
  getSettings,
} from "../../lib/documentUtils";
import {
  ITEMS_PER_MIDDLE_PAGE,
  ITEMS_PER_PAGE,
} from "./documentHelpers";

import type { PdfContext, PageState } from "./pdf/types";
import { loadFonts, loadImages } from "./pdf/assets";
import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAD_TOP,
  CONTENT_BOTTOM,
} from "./pdf/layout";

import { drawPageBackground, drawHeader } from "./pdf/sections/header";
import { drawFooter } from "./pdf/sections/footer";
import { drawBillToAndFor } from "./pdf/sections/billToAndFor";
import { drawItems } from "./pdf/sections/itemsTable";
import { drawTotalsAndNotes } from "./pdf/sections/totalsAndNotes";
import { drawStampAndSign } from "./pdf/sections/stampAndSign";

export async function generateQuotationPDF(
  quotation: Quotation,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts = await loadFonts(doc);
  const images = await loadImages(doc, quotation);

  const settings = getSettings();
  const { businessName, address, phone, email, website } = settings.business;
  const ctx: PdfContext = {
    quotation,
    fonts,
    images,
    business: {
      businessName,
      address,
      phone,
      email,
      siteUrl: website || "www.infield.co.ke",
    },
  };

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - PAD_TOP;
  const state: PageState = {
    get page() {
      return page;
    },
    get y() {
      return y;
    },
    set page(v: PDFPage) {
      page = v;
    },
    set y(v: number) {
      y = v;
    },
  };

  const addPage = (): void => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawPageBackground(page, ctx);
    drawFooter(page, ctx);
    state.y = PAGE_HEIGHT - PAD_TOP;
    drawHeader(state, ctx);
  };

  drawPageBackground(page, ctx);
  drawFooter(page, ctx);
  drawHeader(state, ctx);
  drawBillToAndFor(state, ctx);

  const firstPageItems = quotation.items.slice(0, ITEMS_PER_PAGE);
  drawItems(state, ctx, firstPageItems, 0);
  const remainingItems = quotation.items.slice(ITEMS_PER_PAGE);

  for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
    addPage();
    drawItems(
      state,
      ctx,
      remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE),
      i + ITEMS_PER_PAGE,
    );
  }

  drawTotalsAndNotes(state, ctx);
  drawStampAndSign(state, ctx);

  return doc.save();
}

export async function downloadQuotationPDF(
  quotation: Quotation,
): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);
  const filename = `Quotation_${quotation.quotationCode || quotation.id.toUpperCase()}.pdf`;
  downloadPDF(bytes, filename);
}
