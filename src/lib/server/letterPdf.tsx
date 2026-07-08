import "server-only";
import React from "react";
import path from "path";
import {
  Document,
  Page,
  Text,
  View,
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
  // не переносить слова по слогам
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 45,
    paddingHorizontal: 55,
    fontFamily: "Letter",
    fontSize: 12,
    lineHeight: 1.35,
    color: "#111",
  },
  para: { marginBottom: 7, textAlign: "justify" },
  sign: { marginTop: 26 },
  signLine: { marginBottom: 2 },
});

const toLines = (text: string) => text.replace(/\r/g, "").split("\n");

export interface LetterRenderData {
  body: string;
  signature: string;
}

export async function renderLetterPdf(data: LetterRenderData): Promise<Buffer> {
  ensureFont();
  const bodyLines = toLines(data.body);
  const signLines = toLines(data.signature);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {bodyLines.map((ln, i) => (
          <Text key={`b${i}`} style={styles.para}>
            {ln || " "}
          </Text>
        ))}
        <View style={styles.sign}>
          {signLines.map((ln, i) => (
            <Text key={`s${i}`} style={styles.signLine}>
              {ln || " "}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );

  return (await renderToBuffer(doc)) as Buffer;
}
