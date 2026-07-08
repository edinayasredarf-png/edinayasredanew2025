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

// Tinos — метрически совместим с Times New Roman, с кириллицей (SIL OFL).
const FONT_DIR = path.join(process.cwd(), "public", "fonts", "tinos");

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
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 112, // место под шапку (фикс. колонтитул)
    paddingBottom: 64, // место под исполнителя (фикс. колонтитул)
    paddingHorizontal: 50,
    fontFamily: "Letter",
    fontSize: 14,
    lineHeight: 1.3,
    color: "#000",
  },
  headerBox: {
    position: "absolute",
    top: 18,
    left: 50,
    right: 50,
  },
  headerImg: { width: "100%", maxHeight: 82, objectFit: "contain" },
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
  req: { fontSize: 13, marginBottom: 2 },
  addressee: { alignSelf: "flex-end", width: "55%", marginTop: 8, marginBottom: 16 },
  addresseeText: { fontSize: 13 },
  greeting: { textAlign: "center", marginBottom: 12, fontSize: 14 },
  para: { textAlign: "justify", textIndent: 32, marginBottom: 6 },
  bullet: { textAlign: "justify", marginLeft: 16, marginBottom: 3 },
  signWrap: { marginTop: 22 },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
  },
  signName: { alignItems: "center" },
  signImg: { width: 130, height: 48, objectFit: "contain", marginBottom: -6 },
});

export interface LetterRenderData {
  headerImage?: string;
  number: string;
  date: string;
  position: string;
  fioDative: string;
  greeting: string;
  body: string;
  signerRole: string;
  signatureImage?: string;
  signerName: string;
  executor: string;
}

function bodyBlocks(body: string) {
  return body
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function renderLetterPdf(d: LetterRenderData): Promise<Buffer> {
  ensureFont();
  const blocks = bodyBlocks(d.body);
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

        {/* Реквизиты */}
        <Text style={styles.req}>№ {d.number || "____"}</Text>
        <Text style={styles.req}>от {d.date || "____"}</Text>

        {/* Адресат (справа) */}
        <View style={styles.addressee}>
          <Text style={styles.addresseeText}>{d.position}</Text>
          <Text style={styles.addresseeText}>{d.fioDative}</Text>
        </View>

        {/* Обращение */}
        <Text style={styles.greeting}>{d.greeting}</Text>

        {/* Тело */}
        {blocks.map((b, i) =>
          b.startsWith("•") ? (
            <Text key={`b${i}`} style={styles.bullet}>
              {b}
            </Text>
          ) : (
            <Text key={`b${i}`} style={styles.para}>
              {b}
            </Text>
          )
        )}

        {/* Подпись */}
        <View style={styles.signWrap} wrap={false}>
          <Text>С уважением,</Text>
          <View style={styles.signRow}>
            <Text>{d.signerRole}</Text>
            <View style={styles.signName}>
              {d.signatureImage ? <Image src={d.signatureImage} style={styles.signImg} /> : null}
              <Text>{d.signerName}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );

  return (await renderToBuffer(doc)) as Buffer;
}
