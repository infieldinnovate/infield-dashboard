# Project memory

## Product intent & audience

- Next.js application generating quotation documents in two output formats: print view (`quotationPrint.ts`) and PDF export (`quotationPDF.ts`).
- Audience: business users creating/previewing/printing quotations and clients receiving PDF quotations.

## Brand personality & voice

- Professional, formal business documentation tone.
- Quotations include company branding (logo, business details), digitally-signed stamp, footer credits.

## Visual design & UX direction

- A4 page layout with mm-based measurements; print CSS is the source of truth for visual design.
- Key design elements:
  - Header: brand/logo column with business details, `padding-bottom: 3mm`, `justify-content: space-between`
  - Bill To: vertically centered in 35mm area, 12pt semi-bold label, 11pt content, 1mm line margins
  - Table: 3px row borders (`#d7e5eb`), 15px body font, 29px line-height
  - Totals table: right-aligned (75mm width), 7mm row height, 1mm border-bottom, grand total 12pt with 3mm padding
  - Notes: vertically centered in 40mm section, 11pt strong label + 9pt text, 1mm gap
  - Stamp/sign: 17mm side padding, 40mm×27mm label (serif bold italic), stamp image rotated -35° with date overlay at bottom 6mm, 5.2pt
  - Footer: 35mm height, 28mm contact block (90mm width), thank-you (7pt italic, 12px line-height), created-by (54mm width, 12mm from bottom, 11pt italic serif)
- PDF generation uses `pdf-lib`; maps CSS px→pt at 96dpi (`PX = 0.75pt`)
- Compromise: CSS `font-weight: 600` mapped to `HelveticaBold` (pdf-lib lacks semi-bold)

## Decisions, constraints & rationale

- `quotationPrint.ts` is the authoritative design source; `quotationPDF.ts` must replicate it exactly.
- All CSS px values converted via `PX` factor; mm values via `mm()` helper; pt values via `PT` constant.
- Print uses CSS flexbox (`justify-content`, `align-items`); PDF replicates via computed positions.
- Stamp date rendered as separate text overlay on stamp image (not embedded in image).
- `align-items: center` in print → compute block height and center in PDF.

## Open questions & assumptions

- Assumption: stamp image is shared between print and PDF (date overlaid separately in both).
- Assumption: Helvetica/HelveticaBold are acceptable substitutes for the print font stack.
- Assumption: page is always single A4 (no multi-page quotation support evident).