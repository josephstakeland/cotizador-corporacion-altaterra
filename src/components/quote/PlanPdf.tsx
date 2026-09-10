import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const PAGE = { width: 1190.55, height: 841.89 };
const PAD = 18;
const HEADER = 42;

const styles = StyleSheet.create({
  page: {
    padding: PAD,
    backgroundColor: "#ffffff",
    color: "#122033",
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#0f2744" },
  legend: { fontSize: 9, color: "#44403c" },
});

type Props = {
  projectName: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
};

export function PlanPdf({ projectName, imageSrc, imageWidth, imageHeight }: Props) {
  const maxW = PAGE.width - PAD * 2;
  const maxH = PAGE.height - PAD * 2 - HEADER;
  const scale = Math.min(maxW / imageWidth, maxH / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return (
    <Document>
      <Page size={[PAGE.width, PAGE.height]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Plano de lotización · {projectName}</Text>
          <Text style={styles.legend}>Verde: disponible · Rojo: vendido · Oro: seleccionado</Text>
        </View>
        <Image src={imageSrc} style={{ width, height }} />
      </Page>
    </Document>
  );
}
