// // // components\QuotationDocument\quotationPDF.ts

// // import { PDFDocument, PDFPage } from "pdf-lib";
// // import type { Quotation } from "../../types";
// // import { downloadPDF, getSettings } from "../../lib/documentUtils";
// // import { ITEMS_PER_MIDDLE_PAGE, ITEMS_PER_PAGE } from "./documentHelpers";

// // import type { PdfContext, PageState } from "./pdf/types";
// // import { loadFonts, loadImages } from "./pdf/assets";
// // import { PAGE_WIDTH, PAGE_HEIGHT, PAD_TOP, CONTENT_BOTTOM } from "./pdf/layout";

// // import { drawPageBackground, drawHeader } from "./pdf/sections/header";
// // import { drawFooter } from "./pdf/sections/footer";
// // import { drawBillToAndFor } from "./pdf/sections/billToAndFor";
// // import { drawItems } from "./pdf/sections/itemsTable";
// // import { drawTotalsAndNotes } from "./pdf/sections/totalsAndNotes";
// // import { drawStampAndSign } from "./pdf/sections/stampAndSign";

// // export async function generateQuotationPDF(
// //   quotation: Quotation,
// // ): Promise<Uint8Array> {
// //   const doc = await PDFDocument.create();
// //   const fonts = await loadFonts(doc);
// //   const images = await loadImages(doc, quotation);

// //   const settings = getSettings();
// //   const { businessName, address, phone, email, website } = settings.business;
// //   const ctx: PdfContext = {
// //     quotation,
// //     fonts,
// //     images,
// //     business: {
// //       businessName,
// //       address,
// //       phone,
// //       email,
// //       siteUrl: website || "www.infield.co.ke",
// //     },
// //   };

// //   let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
// //   let y = PAGE_HEIGHT - PAD_TOP;
// //   const state: PageState = {
// //     get page() {
// //       return page;
// //     },
// //     get y() {
// //       return y;
// //     },
// //     set page(v: PDFPage) {
// //       page = v;
// //     },
// //     set y(v: number) {
// //       y = v;
// //     },
// //   };

// //   const addPage = (): void => {
// //     page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
// //     drawPageBackground(page, ctx);
// //     drawFooter(page, ctx);
// //     state.y = PAGE_HEIGHT - PAD_TOP;
// //     drawHeader(state, ctx);
// //   };

// //   drawPageBackground(page, ctx);
// //   drawFooter(page, ctx);
// //   drawHeader(state, ctx);
// //   drawBillToAndFor(state, ctx);

// //   const firstPageItems = quotation.items.slice(0, ITEMS_PER_PAGE);
// //   drawItems(state, ctx, firstPageItems, 0);
// //   const remainingItems = quotation.items.slice(ITEMS_PER_PAGE);

// //   for (let i = 0; i < remainingItems.length; i += ITEMS_PER_MIDDLE_PAGE) {
// //     addPage();
// //     drawItems(
// //       state,
// //       ctx,
// //       remainingItems.slice(i, i + ITEMS_PER_MIDDLE_PAGE),
// //       i + ITEMS_PER_PAGE,
// //     );
// //   }

// //   drawTotalsAndNotes(state, ctx);
// //   drawStampAndSign(state, ctx);

// //   return doc.save();
// // }

// // export async function downloadQuotationPDF(
// //   quotation: Quotation,
// // ): Promise<void> {
// //   const bytes = await generateQuotationPDF(quotation);
// //   const filename = `Quotation_${quotation.quotationCode || quotation.id.toUpperCase()}.pdf`;
// //   downloadPDF(bytes, filename);
// // }

// import { PDFDocument, PDFPage } from "pdf-lib";
// import type { Quotation } from "../../types";
// import { downloadPDF, getSettings } from "../../lib/documentUtils";

// import type { PdfContext, PageState } from "./pdf/types";
// import { loadFonts, loadImages } from "./pdf/assets";
// import { PAGE_WIDTH, PAGE_HEIGHT, PAD_TOP } from "./pdf/layout";

// import { drawPageBackground, drawHeader } from "./pdf/sections/header";
// import { drawFooter } from "./pdf/sections/footer";
// import { drawBillToAndFor } from "./pdf/sections/billToAndFor";
// import { drawItems } from "./pdf/sections/itemsTable";
// import { drawTotalsAndNotes } from "./pdf/sections/totalsAndNotes";
// import { drawStampAndSign } from "./pdf/sections/stampAndSign";

// export async function generateQuotationPDF(
//   quotation: Quotation,
// ): Promise<Uint8Array> {
//   const doc = await PDFDocument.create();
//   const fonts = await loadFonts(doc);
//   const images = await loadImages(doc, quotation);

//   const settings = getSettings();
//   const { businessName, address, phone, email, website } = settings.business;

//   const ctx: PdfContext = {
//     quotation,
//     fonts,
//     images,
//     business: {
//       businessName,
//       address,
//       phone,
//       email,
//       siteUrl: website || "www.infield.co.ke",
//     },
//   };

//   let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
//   let y = PAGE_HEIGHT - PAD_TOP;

//   const state: PageState = {
//     get page() {
//       return page;
//     },

//     get y() {
//       return y;
//     },

//     set page(value: PDFPage) {
//       page = value;
//     },

//     set y(value: number) {
//       y = value;
//     },
//   };

//   const addPage = (): void => {
//     page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

//     drawPageBackground(page, ctx);
//     drawFooter(page, ctx);

//     state.y = PAGE_HEIGHT - PAD_TOP;

//     drawHeader(state, ctx);
//   };

//   // Initialize the first page.
//   drawPageBackground(page, ctx);
//   drawFooter(page, ctx);
//   drawHeader(state, ctx);
//   drawBillToAndFor(state, ctx);

//   // Paginate using the actual height of each row.
//   // No fixed ITEMS_PER_PAGE or ITEMS_PER_MIDDLE_PAGE values are needed.
//   const items = quotation.items;

//   let itemIndex = 0;
//   let needsNewPage = false;

//   // Preserve the table header when the quotation has no items.
//   if (items.length === 0) {
//     drawItems(state, ctx, [], 0);
//   }

//   while (itemIndex < items.length) {
//     const isNewPage = needsNewPage;

//     if (isNewPage) {
//       addPage();
//     }

//     // Pass all remaining items. drawItems determines how many fit
//     // on the current page and returns the number actually drawn.
//     const drawnCount = drawItems(state, ctx, items.slice(itemIndex), itemIndex);

//     if (drawnCount === 0) {
//       // The current page cannot fit even the next row.
//       // Retry once on a fresh page.
//       if (isNewPage) {
//         throw new Error(
//           `Quotation item ${itemIndex + 1} is too tall to fit on a page.`,
//         );
//       }

//       needsNewPage = true;
//       continue;
//     }

//     itemIndex += drawnCount;

//     // If any items remain, the next iteration starts a new page.
//     needsNewPage = itemIndex < items.length;
//   }

//   // Keep the existing totals, notes, stamp and signature rendering.
//   drawTotalsAndNotes(state, ctx);
//   drawStampAndSign(state, ctx);

//   return doc.save();
// }

// export async function downloadQuotationPDF(
//   quotation: Quotation,
// ): Promise<void> {
//   const bytes = await generateQuotationPDF(quotation);

//   const filename = `Quotation_${
//     quotation.quotationCode || quotation.id.toUpperCase()
//   }.pdf`;

//   downloadPDF(bytes, filename);
// }

import { PDFDocument, PDFPage } from "pdf-lib";
import type { Quotation } from "../../types";
import { downloadPDF, getSettings } from "../../lib/documentUtils";

import type { PdfContext, PageState } from "./pdf/types";
import { loadFonts, loadImages } from "./pdf/assets";

import {
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAD_TOP,
  CONTENT_BOTTOM,
  TOTALS_NOTES_HEIGHT,
  STAMP_SIGN_HEIGHT,
  mm,
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

    set page(value: PDFPage) {
      page = value;
    },

    set y(value: number) {
      y = value;
    },
  };

  // Create a continuation page with the existing header and footer.
  const addPage = (): void => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    drawPageBackground(page, ctx);
    drawFooter(page, ctx);

    state.y = PAGE_HEIGHT - PAD_TOP;

    drawHeader(state, ctx);
  };

  // =========================================================
  // 1. FIRST PAGE HEADER AND QUOTATION DETAILS
  // =========================================================

  drawPageBackground(page, ctx);
  drawFooter(page, ctx);
  drawHeader(state, ctx);
  drawBillToAndFor(state, ctx);

  // =========================================================
  // 2. ITEMS — PAGINATE BY ACTUAL ROW HEIGHT
  // =========================================================

  const items = quotation.items;

  let itemIndex = 0;
  let needsNewPage = false;

  if (items.length === 0) {
    drawItems(state, ctx, [], 0);
  }

  while (itemIndex < items.length) {
    const isNewPage = needsNewPage;

    if (isNewPage) {
      addPage();
    }

    const drawnCount = drawItems(state, ctx, items.slice(itemIndex), itemIndex);

    if (drawnCount === 0) {
      // Retry an item that cannot fit on the current page.
      // Fail explicitly if it cannot fit on a fresh page.
      if (isNewPage) {
        throw new Error(
          `Quotation item ${itemIndex + 1} is too tall to fit on a page.`,
        );
      }

      needsNewPage = true;
      continue;
    }

    itemIndex += drawnCount;
    needsNewPage = itemIndex < items.length;
  }

  // =========================================================
  // 3. TOTALS, NOTES, STAMP AND SIGNATURE
  // Keep these closing sections together and above the footer.
  // =========================================================

  const closingSectionsHeight = TOTALS_NOTES_HEIGHT + STAMP_SIGN_HEIGHT;

  // Leave 3mm of extra clearance for drawing edges and the rotated stamp.
  const closingBottomLimit = CONTENT_BOTTOM + mm(3);

  // PDF coordinates increase upward. The closing sections extend
  // downward from the current state.y, so check their final bottom.
  if (state.y - closingSectionsHeight < closingBottomLimit) {
    addPage();
  }

  drawTotalsAndNotes(state, ctx);
  drawStampAndSign(state, ctx);

  return doc.save();
}

export async function downloadQuotationPDF(
  quotation: Quotation,
): Promise<void> {
  const bytes = await generateQuotationPDF(quotation);

  const filename = `Quotation_${
    quotation.quotationCode
  }.pdf`;

  downloadPDF(bytes, filename);
}
