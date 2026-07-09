import path from "path"
import { readFileSync } from "fs"
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer"
import type { ColosQuote } from "@/app/api/modules/colos/colos-quotes.type"

const logoBuffer = readFileSync(path.join(process.cwd(), "public", "colosLogo.png"))
const LOGO_SRC = `data:image/png;base64,${logoBuffer.toString("base64")}`

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 8.3,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  headerSubtitle: {
    fontSize: 9,
    marginTop: 2,
  },
  logo: {
    width: 110,
  },
  watermark: {
    position: "absolute",
    top: 280,
    left: 120,
    width: 400,
    opacity: 0.06,
    transform: "rotate(25deg)",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#c2185b",
    marginVertical: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 130,
    fontFamily: "Helvetica-Bold",
  },
  value: {
    flex: 1,
  },
  dottedLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#c2185b",
    borderBottomStyle: "dotted",
    paddingBottom: 2,
  },
  paragraph: {
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#666",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
  },
  signatureBlock: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureCol: {
    width: "45%",
  },
  signatureLine: {
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#c2185b",
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c2185b",
    minHeight: 30,
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 8.5,
  },
})

const MANDATAIRE = "COLOS SA, Route du Simplon 51, 1902 Evionnaz"

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>COLOS SA, Route du Simplon 51, 1902 Evionnaz</Text>
      <Text>info@colos.ch · www.colos.ch</Text>
    </View>
  )
}

function Watermark() {
  return <Image style={styles.watermark} src={LOGO_SRC} fixed />
}

export function ColosMandatePdf({ quote }: { quote: ColosQuote }) {
  const address = quote.town.includes(quote.postcode)
    ? quote.town
    : [quote.postcode, quote.town].filter(Boolean).join(" ")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Attribution d'un mandat</Text>
            <Text style={styles.headerSubtitle}>de conseil et de gestion du portefeuille d'assurances</Text>
          </View>
          <Image style={styles.logo} src={LOGO_SRC} />
        </View>
        <View style={styles.hr} />

        <View style={styles.row}>
          <Text style={styles.label}>entre (mandant):</Text>
          <View style={styles.value}>
            <Text style={styles.dottedLine}>Nom et Prénom: {quote.name}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}></Text>
          <View style={styles.value}>
            <Text style={styles.dottedLine}>Adresse: {address}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>et (mandataire):</Text>
          <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{MANDATAIRE}</Text>
        </View>
        <View style={styles.hr} />

        <View style={styles.row}>
          <Text style={styles.label}>Objet du mandat:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            COLOS SA prend en charge la gestion exclusive des contrats d'assurance du mandant et s'engage, dans le
            seul intérêt du client, à fournir des conseils objectifs et neutres dans le domaine des assurances. Le
            mandataire est habilité à demander les documents nécessaires à l'établissement d'éventuelles offres, à
            négocier les couvertures d'assurance avec les assureurs et à conseiller le mandant sur les procédures
            particulières liées aux sinistres.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Obligations du mandant:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            Le mandant est tenu d'informer sans délai le mandataire de toute situation susceptible d'affecter son
            portefeuille d'assurances.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Obligations du mandataire:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            Toutes les communications des compagnies d'assurance doivent être envoyées sans délai au mandant. Seuls
            les documents que COLOS SA aura demandés directement pourront lui être envoyés.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Paiement des primes:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            Le paiement des primes des couvertures d'assurance existantes ou nouvelles reste du ressort du mandant,
            qui s'engage à respecter les délais fixés par les compagnies d'assurance.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Rétribution:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            COLOS SA ne réclame aucune compensation du mandant pour l'exécution du mandat, mais perçoit les
            commissions usuelles versées par les assureurs.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Informations aux clients art. 45 LSA:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            Les informations énoncées à l'art. 45 de la loi fédérale sur la surveillance des assurances figurent
            dans le document ci-joint. Par sa signature, le mandant confirme les avoir reçues et lues.
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Entrée en vigueur et durée:</Text>
          <Text style={[styles.value, styles.paragraph]}>
            Le présent mandat entre en vigueur à compter de la signature par les parties et est confié pour une
            durée indéterminée ou jusqu'à sa révocation écrite par l'une des parties, par courrier recommandé.
          </Text>
        </View>

        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signatureCol}>
            <Text>Lieu, date</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureCol}>
            <Text>Le mandant: (signature):</Text>
            <View style={styles.signatureLine} />
            <Text style={{ marginTop: 20 }}>Le mandataire; COLOS SA</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Watermark />
        <Text style={styles.headerTitle}>Aperçu des assurances</Text>
        <View style={styles.hr} />

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCell}>Compagnie</Text>
            <Text style={styles.tableHeaderCell}>Type de couverture</Text>
            <Text style={styles.tableHeaderCell}>Numéro de police</Text>
            <Text style={styles.tableHeaderCell}>Assuré (inc. data de naissance)</Text>
          </View>
          {Array.from({ length: 10 }).map((_, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCell}></Text>
              <Text style={styles.tableCell}></Text>
            </View>
          ))}
        </View>

        <Footer />
      </Page>
    </Document>
  )
}
