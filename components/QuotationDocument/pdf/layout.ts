import { rgb } from "pdf-lib";

export const MM = 2.834646;
export const PT = 1.0;
export const PX = 0.75;

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;

export const PAD_TOP = 10 * MM;
export const PAD_SIDE = 15 * MM;
export const PAD_BOTTOM = 35 * MM;
export const CONTENT_WIDTH = PAGE_WIDTH - PAD_SIDE * 2;
export const CONTENT_BOTTOM = PAD_BOTTOM;

export const HEADER_HEIGHT = 45 * MM;
export const HEADER_GAP = 6 * MM;

export const BF_HEIGHT = 35 * MM;
export const BF_GAP = 5 * MM;
export const FOR_HEIGHT = 19 * MM;
export const FOR_LABEL_W = 20 * MM;

export const TABLE_HEADER_HEIGHT = 8 * MM;
export const TABLE_ROW_HEIGHT = 29 * PX;
export const TABLE_BODY_FONT = 15 * PX;

export const TOTALS_NOTES_HEIGHT = 40 * MM;
export const STAMP_SIGN_HEIGHT = 35 * MM;
export const FOOTER_HEIGHT = 35 * MM;

export const NOTES_W = 80 * MM;
export const TOTALS_W = 75 * MM;

export const STAMP_SIGN_PAD = 17 * MM;
export const SIGN_LABEL_W = 40 * MM;
export const SIGN_LABEL_H = 27 * MM;
export const SIGN_IMG_W = 50 * MM;
export const SIGN_IMG_H = 20 * MM;

export const HEADER_LEFT_W = (CONTENT_WIDTH - HEADER_GAP) * (1.2 / 2.0);
export const HEADER_RIGHT_W = (CONTENT_WIDTH - HEADER_GAP) * (0.8 / 2.0);
export const HEADER_RIGHT_X = PAD_SIDE + HEADER_LEFT_W + HEADER_GAP;

export const BF_LEFT_W = (CONTENT_WIDTH - BF_GAP) * (1.0 / 2.8);
export const BF_RIGHT_W = (CONTENT_WIDTH - BF_GAP) * (1.8 / 2.8);
export const BF_RIGHT_X = PAD_SIDE + BF_LEFT_W + BF_GAP;

export const COL_WIDTHS: Record<string, number> = {
  no: CONTENT_WIDTH * 0.06,
  unit: CONTENT_WIDTH * 0.12,
  qty: CONTENT_WIDTH * 0.1,
  price: CONTENT_WIDTH * 0.13,
  total: CONTENT_WIDTH * 0.17,
};
COL_WIDTHS.desc =
  CONTENT_WIDTH -
  COL_WIDTHS.no -
  COL_WIDTHS.unit -
  COL_WIDTHS.qty -
  COL_WIDTHS.price -
  COL_WIDTHS.total;

export const COL_XS: Record<string, number> = {
  no: PAD_SIDE,
  desc: PAD_SIDE + COL_WIDTHS.no,
  unit: PAD_SIDE + COL_WIDTHS.no + COL_WIDTHS.desc,
  qty: PAD_SIDE + COL_WIDTHS.no + COL_WIDTHS.desc + COL_WIDTHS.unit,
  price:
    PAD_SIDE + COL_WIDTHS.no + COL_WIDTHS.desc + COL_WIDTHS.unit + COL_WIDTHS.qty,
  total:
    PAD_SIDE +
    COL_WIDTHS.no +
    COL_WIDTHS.desc +
    COL_WIDTHS.unit +
    COL_WIDTHS.qty +
    COL_WIDTHS.price,
};

export const BRAND_BLUE = rgb(0.086, 0.282, 0.396);
export const TABLE_HEADER_BG = rgb(0.063, 0.294, 0.408);
export const TABLE_HEADER_BORDER = rgb(1, 1, 1);
export const ROW_BORDER = rgb(0.843, 0.898, 0.922);
export const EVEN_ROW_BG = rgb(0.941, 0.961, 0.953);
export const FOR_LABEL_BG = rgb(0.741, 0.741, 0.741);
export const FOR_CONTENT_BG = rgb(0.831, 0.831, 0.831);
export const GRAND_TOTAL_BG = rgb(0.835, 0.922, 0.925);
export const TOTALS_BORDER = rgb(0.737, 0.737, 0.737);
export const STAMP_RED = rgb(0.753, 0.224, 0.169);
export const HEADER_BORDER = rgb(0.369, 0.369, 0.369);
export const WHITE = rgb(1, 1, 1);
export const DARK = rgb(0.063, 0.094, 0.125);
export const DETAILS_DARK = rgb(0.082, 0.082, 0.082);
export const BLACK = rgb(0, 0, 0);
export const CONTACT_BLUE = rgb(0.0, 0.585, 1.0);
export const BILLTO_LABEL = rgb(0.071, 0.071, 0.071);

export function mm(v: number): number {
  return v * MM;
}
