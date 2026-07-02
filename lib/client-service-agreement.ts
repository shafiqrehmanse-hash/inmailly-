export type ClientServicePreset =
  | "trial_200"
  | "starter_1000"
  | "growth_5000"
  | "pro_10000"
  | "scale_20000"
  | "custom";

export type ClientServiceAgreementForm = {
  contactName: string;
  contactEmail: string;
  clientCompany: string;
  contactTitle: string;
  projectName: string;
  packageName: string;
  inmailPackageSize: string;
  packagePriceUsd: string;
  pricePerMessageUsd: string;
  campaignStartDate: string;
  estimatedDuration: string;
  deliverables: string;
  paymentTerms: string;
  dashboardAccess: string;
  confidentialityTerms: string;
  dataOwnership: string;
  refundPolicy: string;
  additionalTerms: string;
  customOpening: string;
  signerName: string;
  signerTitle: string;
  providerName: string;
  letterDate: string;
  referenceNo: string;
};

const DEFAULT_DELIVERABLES =
  "• Verified LinkedIn Sales Navigator outreach on your approved audience.\n• Custom connection request, InMail, and follow-up scripts executed by our team.\n• Live client dashboard with send proofs (screenshots), response inbox, and package progress.\n• Campaign manager assigned for strategy, QA, and weekly progress updates.";

const DEFAULT_PAYMENT =
  "• 50% due before campaign kick-off; remaining 50% due at midpoint or upon delivery of 50% of package quota — whichever comes first.\n• Payments via bank transfer or agreed payment link. Campaign work begins after initial payment clears.\n• Late payment may pause outreach until account is current.";

const DEFAULT_DASHBOARD =
  "• Secure login at inmailly.com/client with real-time campaign visibility.\n• Every delivered InMail backed by a send proof screenshot visible in your dashboard.\n• Reply tracking and follow-up instructions directly in your portal.";

const DEFAULT_CONFIDENTIALITY =
  "• Both parties agree to keep campaign scripts, prospect lists, performance data, and business information confidential.\n• InMailly will not share your campaign details with other clients or third parties without written consent.";

const DEFAULT_DATA_OWNERSHIP =
  "• You retain ownership of your brand, scripts, and prospect data you provide.\n• InMailly retains ownership of outreach methodology, internal tools, and operational processes.\n• Response data and campaign analytics generated during the engagement are shared with you for the duration of service.";

const DEFAULT_REFUND =
  "• Unused InMail quota may be eligible for partial refund at InMailly's discretion if service ends early due to our operational constraints.\n• No refund for delivered InMails (each backed by send proof). Refund requests must be submitted within 14 days of service end notice.";

export const CLIENT_SERVICE_PRESETS: Record<
  ClientServicePreset,
  { label: string; patch: Partial<ClientServiceAgreementForm> }
> = {
  trial_200: {
    label: "Trial — 200 InMails",
    patch: {
      packageName: "Trial",
      inmailPackageSize: "200",
      packagePriceUsd: "0",
      pricePerMessageUsd: "0.00",
      estimatedDuration: "2–3 weeks",
      paymentTerms:
        "• Complimentary trial package — no payment required for the trial quota.\n• Upgrade to a paid package to continue beyond trial delivery.",
      additionalTerms:
        "• Trial campaigns run in preview mode until upgraded.\n• Trial quota is non-transferable and valid for one campaign only.",
    },
  },
  starter_1000: {
    label: "Starter — 1,000 InMails ($275)",
    patch: {
      packageName: "Starter",
      inmailPackageSize: "1000",
      packagePriceUsd: "275",
      pricePerMessageUsd: "0.27",
      estimatedDuration: "4–6 weeks",
    },
  },
  growth_5000: {
    label: "Growth — 5,000 InMails ($1,100)",
    patch: {
      packageName: "Growth",
      inmailPackageSize: "5000",
      packagePriceUsd: "1100",
      pricePerMessageUsd: "0.22",
      estimatedDuration: "8–12 weeks",
      additionalTerms:
        "• Priority campaign manager assignment.\n• Bi-weekly performance review calls available on request.",
    },
  },
  pro_10000: {
    label: "Pro — 10,000 InMails ($2,000)",
    patch: {
      packageName: "Pro",
      inmailPackageSize: "10000",
      packagePriceUsd: "2000",
      pricePerMessageUsd: "0.20",
      estimatedDuration: "12–16 weeks",
      additionalTerms:
        "• Dedicated campaign manager with direct Slack/email line.\n• Custom audience segmentation support included.",
    },
  },
  scale_20000: {
    label: "Scale — 20,000 InMails ($3,800)",
    patch: {
      packageName: "Scale",
      inmailPackageSize: "20000",
      packagePriceUsd: "3800",
      pricePerMessageUsd: "0.19",
      estimatedDuration: "16–24 weeks",
      additionalTerms:
        "• Dedicated ops pod and SLA-backed delivery cadence.\n• Quarterly strategy review with founder included.",
    },
  },
  custom: {
    label: "Blank / custom",
    patch: {},
  },
};

export function defaultClientServiceAgreementForm(): ClientServiceAgreementForm {
  const today = new Date().toISOString().slice(0, 10);
  const ref = `IMC-${today.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    contactName: "",
    contactEmail: "",
    clientCompany: "",
    contactTitle: "Authorized Representative",
    projectName: "",
    packageName: "Starter",
    inmailPackageSize: "1000",
    packagePriceUsd: "275",
    pricePerMessageUsd: "0.27",
    campaignStartDate: today,
    estimatedDuration: "4–6 weeks",
    deliverables: DEFAULT_DELIVERABLES,
    paymentTerms: DEFAULT_PAYMENT,
    dashboardAccess: DEFAULT_DASHBOARD,
    confidentialityTerms: DEFAULT_CONFIDENTIALITY,
    dataOwnership: DEFAULT_DATA_OWNERSHIP,
    refundPolicy: DEFAULT_REFUND,
    additionalTerms: "",
    customOpening: "",
    signerName: "Shafiq Rehman",
    signerTitle: "Founder, InMailly",
    providerName: "InMailly — Shafiq's Marketing Automations Valley",
    letterDate: today,
    referenceNo: ref,
  };
}

export function formatUsd(amount: string | number) {
  const n = typeof amount === "string" ? parseFloat(amount.replace(/[^\d.]/g, "")) : amount;
  if (Number.isNaN(n)) return "—";
  if (n === 0) return "Complimentary";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatLetterDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatInmailCount(size: string | number) {
  const n = typeof size === "string" ? parseInt(size.replace(/\D/g, ""), 10) : size;
  if (!n || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US");
}

export function buildClientServiceBodyParagraphs(form: ClientServiceAgreementForm): string[] {
  const opening =
    form.customOpening.trim() ||
    `Thank you for choosing ${form.providerName} for your LinkedIn outreach campaign. This Service Agreement outlines the scope, deliverables, and terms for your ${form.packageName} InMail package — designed to build trust through transparent delivery and a live client dashboard.`;

  const priceLine =
    parseFloat(form.packagePriceUsd) === 0
      ? "Complimentary trial package — no charge for the agreed trial quota."
      : `Total package investment: ${formatUsd(form.packagePriceUsd)} USD for ${formatInmailCount(form.inmailPackageSize)} LinkedIn InMails (${form.pricePerMessageUsd ? `$${form.pricePerMessageUsd}/message` : "per agreed rate"}).`;

  const paras = [
    `Dear ${form.contactName.trim() || "Client"},`,
    "",
    opening,
    "",
    "Parties",
    `• Service provider: ${form.providerName}`,
    `• Client: ${form.clientCompany.trim() || form.contactName} — ${form.contactTitle}`,
    `• Authorized contact: ${form.contactName} (${form.contactEmail})`,
    "",
    "Campaign scope",
    `• Project / campaign name: ${form.projectName || "As agreed"}`,
    `• Package: ${form.packageName} — ${formatInmailCount(form.inmailPackageSize)} InMails`,
    `• Campaign start (target): ${formatLetterDate(form.campaignStartDate)}`,
    `• Estimated duration: ${form.estimatedDuration}`,
    "",
    "Investment",
    `• ${priceLine}`,
    "",
    "Deliverables",
    ...form.deliverables.split("\n").filter(Boolean),
    "",
    "Payment terms",
    ...form.paymentTerms.split("\n").filter(Boolean),
    "",
    "Client dashboard & transparency",
    ...form.dashboardAccess.split("\n").filter(Boolean),
    "",
    "Confidentiality",
    ...form.confidentialityTerms.split("\n").filter(Boolean),
    "",
    "Data ownership",
    ...form.dataOwnership.split("\n").filter(Boolean),
    "",
    "Refund & service end",
    ...form.refundPolicy.split("\n").filter(Boolean),
    "",
    "Service terms — important",
    "• This is a fixed-scope outreach service agreement for the InMail package stated above — not an open-ended retainer unless separately agreed in writing.",
    "• InMailly delivers outreach using verified Sales Navigator profiles and approved scripts. Results depend on market, audience, and offer quality; specific reply or conversion rates are not guaranteed.",
    "• Either party may request service pause or end with written notice. Delivered InMails (with send proofs) are non-refundable. Any partial refund for undelivered quota is at InMailly's discretion per the refund policy above.",
    "• Campaign may be paused if payment is overdue, scripts are not approved, or LinkedIn platform restrictions affect delivery.",
    "• By signing, the client confirms they have authority to bind their organization and agree to provide accurate audience targeting and compliant messaging.",
  ];

  if (form.additionalTerms.trim()) {
    paras.push("", "Additional terms", ...form.additionalTerms.split("\n").filter(Boolean));
  }

  paras.push(
    "",
    "Electronic acceptance",
    "• By signing this agreement in your InMailly client portal, you confirm you have read, understood, and agree to all terms above — including payment, delivery scope, confidentiality, and refund policy.",
    "",
    "Warm regards,",
    form.signerName,
    form.signerTitle,
    form.providerName
  );

  return paras;
}
