/** Room for the label above the history rail. */
export const RAIL_LABEL_WIDTH = 44;
export const RAIL_LABEL_SPACING = 0.3;

const MAX_FONT = 12;
/** Upper bound on Archivo Bold's average capital and digit width, in ems. */
const CHAR_EM = 0.78;

/** The largest font size, up to 12, at which the label fits on one line. */
export function railLabelFontSize(label: string): number {
  const n = Math.max(1, label.length);
  const fit = (RAIL_LABEL_WIDTH - RAIL_LABEL_SPACING * n) / (n * CHAR_EM);
  return Math.min(MAX_FONT, Math.floor(fit * 10) / 10);
}
