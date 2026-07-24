import "server-only";
import React from "react";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { renderHtmlBody } from "./letterHtml";

// Tinos — метрически совместим с Times New Roman, с кириллицей (SIL OFL).
const FONT_DIR = path.join(process.cwd(), "public", "fonts", "tinos");
// Involve — шрифт без засечек с кириллицей (для выбора «sans» в редакторе).
const SANS_DIR = path.join(process.cwd(), "public", "fonts", "involve");

let registered = false;
function ensureFont() {
  if (registered) return;
  Font.register({
    family: "Letter",
    fonts: [
      { src: path.join(FONT_DIR, "Tinos-Regular.ttf") },
      { src: path.join(FONT_DIR, "Tinos-Bold.ttf"), fontWeight: "bold" },
      { src: path.join(FONT_DIR, "Tinos-Italic.ttf"), fontStyle: "italic" },
      { src: path.join(FONT_DIR, "Tinos-BoldItalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
    ],
  });
  // Sans-семейство (Involve): есть Regular и Medium — Medium как «жирный».
  Font.register({
    family: "LetterSans",
    fonts: [
      { src: path.join(SANS_DIR, "Involve-Regular.ttf") },
      { src: path.join(SANS_DIR, "Involve-Medium.ttf"), fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

/** Многострочная строка (теги уже раскрыты) → массив непустых строк. */
function splitLines(s?: string): string[] {
  return (s || "").replace(/\r/g, "").split("\n").filter((l) => l.trim() !== "");
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 118, // место под шапку (фикс. колонтитул, на всю ширину)
    paddingBottom: 64, // место под исполнителя (фикс. колонтитул)
    paddingHorizontal: 50,
    fontFamily: "Letter",
    fontSize: 14,
    lineHeight: 1.3,
    color: "#000",
  },
  headerBox: {
    position: "absolute",
    top: 14,
    left: 50,
    right: 50,
  },
  headerImg: { width: "100%" },
  footerBox: {
    position: "absolute",
    bottom: 22,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: "#888",
    paddingTop: 4,
  },
  footerText: { fontSize: 10, color: "#333", lineHeight: 1.25 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  reqCol: {},
  req: { fontSize: 13, marginBottom: 2 },
  addresseeCol: { maxWidth: "58%" },
  addresseeText: { fontSize: 13 },
  greeting: { textAlign: "center", marginBottom: 12, fontSize: 14, fontWeight: "bold" },
  para: { textAlign: "justify", textIndent: 32, marginBottom: 6 },
  bullet: { textAlign: "justify", marginLeft: 16, marginBottom: 3 },
  signWrap: { marginTop: 22 },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 6,
    position: "relative",
  },
  signImg: {
    position: "absolute",
    left: "50%",
    marginLeft: -75,
    top: -16,
    width: 150,
    height: 52,
    objectFit: "contain",
  },
});

export interface LetterRenderData {
  headerImage?: string;
  /** Верх письма слева (реквизиты). Многострочно, теги уже раскрыты. */
  headerLeft: string;
  /** Верх письма справа (адресат). Многострочно, теги уже раскрыты. */
  headerRight: string;
  greeting: string;
  body: string;
  signerRole: string;
  signatureImage?: string;
  signerName: string;
  executor: string;
}

export async function renderLetterPdf(d: LetterRenderData): Promise<Buffer> {
  ensureFont();
  const execLines = d.executor.replace(/\r/g, "").split("\n").filter(Boolean);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Верхний колонтитул — шапка (на каждой странице) */}
        {d.headerImage ? (
          <View style={styles.headerBox} fixed>
            <Image src={d.headerImage} style={styles.headerImg} />
          </View>
        ) : null}

        {/* Нижний колонтитул — исполнитель (на каждой странице) */}
        <View style={styles.footerBox} fixed>
          {execLines.map((ln, i) => (
            <Text key={`f${i}`} style={styles.footerText}>
              {ln}
            </Text>
          ))}
        </View>

        {/* Верх письма: слева (реквизиты) + справа (адресат) — редактируется в шаблоне */}
        <View style={styles.topRow}>
          <View style={styles.reqCol}>
            {splitLines(d.headerLeft).map((ln, i) => (
              <Text key={`hl${i}`} style={styles.req}>{ln}</Text>
            ))}
          </View>
          <View style={styles.addresseeCol}>
            {splitLines(d.headerRight).map((ln, i) => (
              <Text key={`hr${i}`} style={styles.addresseeText}>{ln}</Text>
            ))}
          </View>
        </View>

        {/* Обращение */}
        <Text style={styles.greeting}>{d.greeting}</Text>

        {/* Тело (HTML из редактора) */}
        {renderHtmlBody(d.body)}

        {/* Подпись */}
        <View style={styles.signWrap} wrap={false}>
          <Text>С уважением,</Text>
          <View style={styles.signRow}>
            <Text>{d.signerRole}</Text>
            <Text>{d.signerName}</Text>
            {d.signatureImage ? <Image src={d.signatureImage} style={styles.signImg} /> : null}
          </View>
        </View>
      </Page>
    </Document>
  );

  return (await renderToBuffer(doc)) as Buffer;
}
