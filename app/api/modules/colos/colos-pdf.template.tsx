import path from "path"
import { readFileSync } from "fs"
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer"
import type { ColosQuote } from "@/app/api/modules/colos/colos-quotes.type"
import type { ColosPdfLang } from "@/app/api/modules/colos/colos-pdf.languages"

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
  signatureImage: {
    marginTop: 12,
    height: 40,
    objectFit: "contain",
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

const DATE_LOCALE: Record<ColosPdfLang, string> = {
  fr: "fr-CH",
  it: "it-CH",
  de: "de-CH",
  en: "en-GB",
}

const COPY: Record<
  ColosPdfLang,
  {
    headerTitle: string
    headerSubtitle: string
    entreLabel: string
    nomEtPrenom: string
    adresse: string
    etLabel: string
    objetLabel: string
    objetBody: string
    obligationsMandantLabel: string
    obligationsMandantBody: string
    obligationsMandataireLabel: string
    obligationsMandataireBody: string
    paiementLabel: string
    paiementBody: string
    retributionLabel: string
    retributionBody: string
    art45Label: string
    art45Body: string
    entreeVigueurLabel: string
    entreeVigueurBody: string
    lieuDate: string
    signatureMandant: string
    signatureMandataire: string
    apercuTitle: string
    tableCompagnie: string
    tableTypeCouverture: string
    tableNumeroPolice: string
    tableAssure: string
  }
> = {
  fr: {
    headerTitle: "Attribution d'un mandat",
    headerSubtitle: "de conseil et de gestion du portefeuille d'assurances",
    entreLabel: "entre (mandant):",
    nomEtPrenom: "Nom et Prénom",
    adresse: "Adresse",
    etLabel: "et (mandataire):",
    objetLabel: "Objet du mandat:",
    objetBody:
      "COLOS SA prend en charge la gestion exclusive des contrats d'assurance du mandant et s'engage, dans le seul intérêt du client, à fournir des conseils objectifs et neutres dans le domaine des assurances. Le mandataire est habilité à demander les documents nécessaires à l'établissement d'éventuelles offres, à négocier les couvertures d'assurance avec les assureurs et à conseiller le mandant sur les procédures particulières liées aux sinistres.",
    obligationsMandantLabel: "Obligations du mandant:",
    obligationsMandantBody:
      "Le mandant est tenu d'informer sans délai le mandataire de toute situation susceptible d'affecter son portefeuille d'assurances.",
    obligationsMandataireLabel: "Obligations du mandataire:",
    obligationsMandataireBody:
      "Toutes les communications des compagnies d'assurance doivent être envoyées sans délai au mandant. Seuls les documents que COLOS SA aura demandés directement pourront lui être envoyés.",
    paiementLabel: "Paiement des primes:",
    paiementBody:
      "Le paiement des primes des couvertures d'assurance existantes ou nouvelles reste du ressort du mandant, qui s'engage à respecter les délais fixés par les compagnies d'assurance.",
    retributionLabel: "Rétribution:",
    retributionBody:
      "COLOS SA ne réclame aucune compensation du mandant pour l'exécution du mandat, mais perçoit les commissions usuelles versées par les assureurs.",
    art45Label: "Informations aux clients art. 45 LSA:",
    art45Body:
      "Les informations énoncées à l'art. 45 de la loi fédérale sur la surveillance des assurances figurent dans le document ci-joint. Par sa signature, le mandant confirme les avoir reçues et lues.",
    entreeVigueurLabel: "Entrée en vigueur et durée:",
    entreeVigueurBody:
      "Le présent mandat entre en vigueur à compter de la signature par les parties et est confié pour une durée indéterminée ou jusqu'à sa révocation écrite par l'une des parties, par courrier recommandé.",
    lieuDate: "Lieu, date",
    signatureMandant: "Le mandant: (signature):",
    signatureMandataire: "Le mandataire; COLOS SA",
    apercuTitle: "Aperçu des assurances",
    tableCompagnie: "Compagnie",
    tableTypeCouverture: "Type de couverture",
    tableNumeroPolice: "Numéro de police",
    tableAssure: "Assuré (inc. data de naissance)",
  },
  it: {
    headerTitle: "Attribuzione di un mandato",
    headerSubtitle: "di consulenza e gestione del portafoglio assicurativo",
    entreLabel: "tra (mandante):",
    nomEtPrenom: "Nome e Cognome",
    adresse: "Indirizzo",
    etLabel: "e (mandatario):",
    objetLabel: "Oggetto del mandato:",
    objetBody:
      "COLOS SA assume la gestione esclusiva dei contratti assicurativi del mandante e si impegna, nel solo interesse del cliente, a fornire consulenza obiettiva e neutrale in materia assicurativa. Il mandatario è autorizzato a richiedere i documenti necessari per l'elaborazione di eventuali offerte, a negoziare le coperture assicurative con gli assicuratori e a consigliare il mandante sulle procedure particolari legate ai sinistri.",
    obligationsMandantLabel: "Obblighi del mandante:",
    obligationsMandantBody:
      "Il mandante è tenuto a informare senza indugio il mandatario di qualsiasi situazione suscettibile di incidere sul proprio portafoglio assicurativo.",
    obligationsMandataireLabel: "Obblighi del mandatario:",
    obligationsMandataireBody:
      "Tutte le comunicazioni delle compagnie assicurative devono essere inoltrate senza indugio al mandante. Solo i documenti espressamente richiesti da COLOS SA potranno essergli inviati.",
    paiementLabel: "Pagamento dei premi:",
    paiementBody:
      "Il pagamento dei premi delle coperture assicurative esistenti o nuove resta a carico del mandante, che si impegna a rispettare le scadenze fissate dalle compagnie assicurative.",
    retributionLabel: "Retribuzione:",
    retributionBody:
      "COLOS SA non richiede alcun compenso al mandante per l'esecuzione del mandato, ma percepisce le commissioni usuali versate dagli assicuratori.",
    art45Label: "Informazioni ai clienti art. 45 LSA:",
    art45Body:
      "Le informazioni di cui all'art. 45 della legge federale sulla sorveglianza degli assicuratori figurano nel documento allegato. Con la propria firma, il mandante conferma di averle ricevute e lette.",
    entreeVigueurLabel: "Entrata in vigore e durata:",
    entreeVigueurBody:
      "Il presente mandato entra in vigore a partire dalla firma delle parti ed è conferito per una durata indeterminata, fino alla revoca scritta da parte di una delle parti, tramite lettera raccomandata.",
    lieuDate: "Luogo, data",
    signatureMandant: "Il mandante: (firma):",
    signatureMandataire: "Il mandatario; COLOS SA",
    apercuTitle: "Panoramica delle assicurazioni",
    tableCompagnie: "Compagnia",
    tableTypeCouverture: "Tipo di copertura",
    tableNumeroPolice: "Numero di polizza",
    tableAssure: "Assicurato (incl. data di nascita)",
  },
  de: {
    headerTitle: "Erteilung eines Mandats",
    headerSubtitle: "zur Beratung und Verwaltung des Versicherungsportfolios",
    entreLabel: "zwischen (Mandant):",
    nomEtPrenom: "Name und Vorname",
    adresse: "Adresse",
    etLabel: "und (Mandatar):",
    objetLabel: "Gegenstand des Mandats:",
    objetBody:
      "COLOS SA übernimmt die exklusive Verwaltung der Versicherungsverträge des Mandanten und verpflichtet sich, ausschliesslich im Interesse des Kunden objektive und neutrale Beratung im Versicherungsbereich zu leisten. Der Mandatar ist berechtigt, die für die Erstellung allfälliger Offerten erforderlichen Unterlagen anzufordern, die Versicherungsdeckungen mit den Versicherern zu verhandeln und den Mandanten bei besonderen Schadenfallverfahren zu beraten.",
    obligationsMandantLabel: "Pflichten des Mandanten:",
    obligationsMandantBody:
      "Der Mandant ist verpflichtet, den Mandatar unverzüglich über jede Situation zu informieren, die sein Versicherungsportfolio beeinträchtigen könnte.",
    obligationsMandataireLabel: "Pflichten des Mandatars:",
    obligationsMandataireBody:
      "Sämtliche Mitteilungen der Versicherungsgesellschaften sind unverzüglich an den Mandanten weiterzuleiten. Nur Unterlagen, die COLOS SA direkt angefordert hat, dürfen ihm zugestellt werden.",
    paiementLabel: "Prämienzahlung:",
    paiementBody:
      "Die Zahlung der Prämien für bestehende oder neue Versicherungsdeckungen obliegt dem Mandanten, der sich verpflichtet, die von den Versicherungsgesellschaften festgelegten Fristen einzuhalten.",
    retributionLabel: "Vergütung:",
    retributionBody:
      "COLOS SA verlangt vom Mandanten keine Entschädigung für die Ausführung des Mandats, erhält jedoch die üblichen von den Versicherern ausgerichteten Provisionen.",
    art45Label: "Kundeninformationen Art. 45 VAG:",
    art45Body:
      "Die in Art. 45 des Bundesgesetzes über die Versicherungsaufsicht genannten Informationen sind im beiliegenden Dokument enthalten. Mit seiner Unterschrift bestätigt der Mandant, diese erhalten und gelesen zu haben.",
    entreeVigueurLabel: "Inkrafttreten und Dauer:",
    entreeVigueurBody:
      "Das vorliegende Mandat tritt mit der Unterzeichnung durch die Parteien in Kraft und wird auf unbestimmte Dauer erteilt, bis es von einer der Parteien schriftlich per Einschreiben widerrufen wird.",
    lieuDate: "Ort, Datum",
    signatureMandant: "Der Mandant: (Unterschrift):",
    signatureMandataire: "Der Mandatar; COLOS SA",
    apercuTitle: "Versicherungsübersicht",
    tableCompagnie: "Gesellschaft",
    tableTypeCouverture: "Deckungsart",
    tableNumeroPolice: "Policennummer",
    tableAssure: "Versicherte Person (inkl. Geburtsdatum)",
  },
  en: {
    headerTitle: "Assignment of a mandate",
    headerSubtitle: "for advisory and management services of the insurance portfolio",
    entreLabel: "between (principal):",
    nomEtPrenom: "Full name",
    adresse: "Address",
    etLabel: "and (agent):",
    objetLabel: "Purpose of the mandate:",
    objetBody:
      "COLOS SA takes on the exclusive management of the principal's insurance contracts and undertakes, solely in the client's interest, to provide objective and neutral advice in insurance matters. The agent is authorized to request the documents necessary to prepare any offers, to negotiate insurance coverage with insurers, and to advise the principal on the specific procedures related to claims.",
    obligationsMandantLabel: "Obligations of the principal:",
    obligationsMandantBody:
      "The principal must inform the agent without delay of any situation likely to affect their insurance portfolio.",
    obligationsMandataireLabel: "Obligations of the agent:",
    obligationsMandataireBody:
      "All communications from insurance companies must be forwarded to the principal without delay. Only documents that COLOS SA has directly requested may be sent to it.",
    paiementLabel: "Payment of premiums:",
    paiementBody:
      "Payment of premiums for existing or new insurance coverage remains the responsibility of the principal, who undertakes to meet the deadlines set by the insurance companies.",
    retributionLabel: "Remuneration:",
    retributionBody:
      "COLOS SA does not charge the principal any fee for carrying out the mandate, but receives the usual commissions paid by insurers.",
    art45Label: "Client information art. 45 ISA:",
    art45Body:
      "The information set out in art. 45 of the federal act on insurance supervision is provided in the attached document. By signing, the principal confirms having received and read it.",
    entreeVigueurLabel: "Entry into force and duration:",
    entreeVigueurBody:
      "This mandate takes effect upon signature by the parties and is granted for an indefinite period, until written revocation by either party by registered mail.",
    lieuDate: "Place, date",
    signatureMandant: "The principal: (signature):",
    signatureMandataire: "The agent; COLOS SA",
    apercuTitle: "Insurance overview",
    tableCompagnie: "Company",
    tableTypeCouverture: "Coverage type",
    tableNumeroPolice: "Policy number",
    tableAssure: "Insured person (incl. date of birth)",
  },
}

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

export function ColosMandatePdf({
  quote,
  lang = "fr",
  clientSignatureSrc,
  workerSignatureSrc,
}: {
  quote: ColosQuote
  lang?: ColosPdfLang
  clientSignatureSrc?: string
  workerSignatureSrc?: string
}) {
  const copy = COPY[lang]
  const address = quote.town.includes(quote.postcode)
    ? quote.town
    : [quote.postcode, quote.town].filter(Boolean).join(" ")

  const signatureDate = new Date().toLocaleDateString(DATE_LOCALE[lang])

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Watermark />
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{copy.headerTitle}</Text>
            <Text style={styles.headerSubtitle}>{copy.headerSubtitle}</Text>
          </View>
          <Image style={styles.logo} src={LOGO_SRC} />
        </View>
        <View style={styles.hr} />

        <View style={styles.row}>
          <Text style={styles.label}>{copy.entreLabel}</Text>
          <View style={styles.value}>
            <Text style={styles.dottedLine}>
              {copy.nomEtPrenom}: {quote.name}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}></Text>
          <View style={styles.value}>
            <Text style={styles.dottedLine}>
              {copy.adresse}: {address}
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.etLabel}</Text>
          <Text style={[styles.value, { fontFamily: "Helvetica-Bold" }]}>{MANDATAIRE}</Text>
        </View>
        <View style={styles.hr} />

        <View style={styles.row}>
          <Text style={styles.label}>{copy.objetLabel}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.objetBody}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.obligationsMandantLabel}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.obligationsMandantBody}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.obligationsMandataireLabel}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.obligationsMandataireBody}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.paiementLabel}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.paiementBody}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.retributionLabel}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.retributionBody}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.art45Label}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.art45Body}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>{copy.entreeVigueurLabel}</Text>
          <Text style={[styles.value, styles.paragraph]}>{copy.entreeVigueurBody}</Text>
        </View>

        <View style={styles.signatureBlock} wrap={false}>
          <View style={styles.signatureCol}>
            <Text>{copy.lieuDate}</Text>
            <Text style={styles.signatureLine}>{signatureDate}</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text>{copy.signatureMandant}</Text>
            {clientSignatureSrc ? (
              <Image style={styles.signatureImage} src={clientSignatureSrc} />
            ) : (
              <View style={styles.signatureLine} />
            )}
            <Text style={{ marginTop: 20 }}>{copy.signatureMandataire}</Text>
            {workerSignatureSrc ? (
              <Image style={styles.signatureImage} src={workerSignatureSrc} />
            ) : (
              <View style={styles.signatureLine} />
            )}
          </View>
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <Watermark />
        <Text style={styles.headerTitle}>{copy.apercuTitle}</Text>
        <View style={styles.hr} />

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCell}>{copy.tableCompagnie}</Text>
            <Text style={styles.tableHeaderCell}>{copy.tableTypeCouverture}</Text>
            <Text style={styles.tableHeaderCell}>{copy.tableNumeroPolice}</Text>
            <Text style={styles.tableHeaderCell}>{copy.tableAssure}</Text>
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
