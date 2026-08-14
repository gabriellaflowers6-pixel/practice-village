import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Brand palette, translated for print
const INK = rgb(0.169, 0.125, 0.075);
const SOFT = rgb(0.365, 0.31, 0.243);
const CLAY = rgb(0.659, 0.259, 0.078);
const LINE = rgb(0.85, 0.8, 0.72);

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 64;
const FOOTER_Y = 36;
const BODY_W = PAGE_W - MARGIN * 2;

// Standard fonts speak WinAnsi only: tame smart punctuation, drop what cannot print
function printable(value) {
  return String(value == null ? "" : value)
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF·]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(text, font, size, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    // a single token wider than the measure gets broken by characters (long URLs, queries)
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        if (font.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    } else {
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function composeRecordPdf(cards, { downloadedOn }) {
  const doc = await PDFDocument.create();
  doc.setTitle("Your Record · Practice Village");
  doc.setProducer("Practice Village");
  doc.setCreator("Practice Village");

  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensure = (needed) => {
    if (y - needed >= FOOTER_Y + 28) return;
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  const put = (text, { font = sans, size = 10, color = INK, indent = 0, gap = 3, width = BODY_W } = {}) => {
    const clean = printable(text);
    if (!clean) return;
    for (const lineText of wrap(clean, font, size, width - indent)) {
      ensure(size + gap);
      page.drawText(lineText, { x: MARGIN + indent, y: y - size, size, font, color });
      y -= size + gap;
    }
  };

  const space = (amount) => { y -= amount; };
  const rule = () => {
    ensure(12);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.6, color: LINE });
    y -= 12;
  };

  // Title block
  put("Your Record", { font: serifBold, size: 26, gap: 6 });
  put("The Personal Intelligence Layer", { font: sansBold, size: 10, color: CLAY, gap: 8 });
  put(
    "Entries in this record were chosen and kept by the member from conversations with the Practice Village Concierge. Verify details before acting on them.",
    { size: 9, color: SOFT, gap: 3 },
  );
  space(6);
  rule();
  space(6);

  for (const card of cards) {
    ensure(48);
    put(card.text, { font: sansBold, size: 12, gap: 4 });
    if (card.keptOn) put(`Kept ${card.keptOn}`, { size: 8.5, color: SOFT, gap: 6 });

    const detail = card.detail;
    if (detail?.kind === "search") {
      put("Run this search:", { size: 9, color: SOFT, indent: 12, gap: 4 });
      put(detail.query, { font: mono, size: 9.5, color: CLAY, indent: 12, gap: 5 });
      if (detail.trustNote) put(detail.trustNote, { size: 9, color: SOFT, indent: 12, gap: 5 });
      (detail.steps || []).forEach((step, index) => {
        put(`${index + 1}. ${step}`, { size: 9.5, indent: 20, gap: 4 });
      });
    } else if (detail?.kind === "resources") {
      for (const item of detail.items || []) {
        put(`${item.name}${item.detail ? ` · ${item.detail}` : ""}`, { size: 9.5, indent: 12, gap: 2 });
        put(item.href, { size: 8.5, color: CLAY, indent: 20, gap: 5 });
      }
      if (detail.sourceNote) put(detail.sourceNote, { size: 9, color: SOFT, indent: 12, gap: 4 });
    }

    space(8);
    rule();
    space(6);
  }

  // Footer on every page, stamped once the page count is known
  const pages = doc.getPages();
  const footerLeft = printable(`Practice Village · thepracticevillage.org · Downloaded ${downloadedOn}`);
  pages.forEach((p, index) => {
    p.drawText(footerLeft, { x: MARGIN, y: FOOTER_Y, size: 8, font: sans, color: SOFT });
    const pageLabel = `Page ${index + 1} of ${pages.length}`;
    const labelWidth = sans.widthOfTextAtSize(pageLabel, 8);
    p.drawText(pageLabel, { x: PAGE_W - MARGIN - labelWidth, y: FOOTER_Y, size: 8, font: sans, color: SOFT });
  });

  return doc.save();
}
