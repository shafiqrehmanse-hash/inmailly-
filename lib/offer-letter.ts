export type OfferLetterPreset = "outreach_worker" | "senior_outreach" | "team_leader" | "custom";

export type OfferLetterForm = {
  candidateName: string;
  candidateEmail: string;
  candidateCity: string;
  roleTitle: string;
  department: string;
  startDate: string;
  monthlySalaryPkr: string;
  commissionText: string;
  employmentType: string;
  probationMonths: string;
  workLocation: string;
  workingHours: string;
  additionalTerms: string;
  customOpening: string;
  signerName: string;
  signerTitle: string;
  companyName: string;
  letterDate: string;
  referenceNo: string;
};

export const OFFER_PRESETS: Record<
  OfferLetterPreset,
  { label: string; patch: Partial<OfferLetterForm> }
> = {
  outreach_worker: {
    label: "Outreach worker",
    patch: {
      roleTitle: "Outreach Worker",
      department: "Outreach Operations",
      monthlySalaryPkr: "25000",
      commissionText:
        "PKR 1,500 bonus per qualified lead logged. PKR 5,000 commission per closed deal attributed to your outreach.",
      employmentType: "Part-time / flexible",
      probationMonths: "1",
      workLocation: "Remote — Pakistan",
      workingHours: "Flexible; minimum daily outreach targets apply",
      additionalTerms:
        "• Access to InMailly work links, scripts, and team workspace.\n• Performance reviewed weekly.\n• Confidentiality of client and prospect data is required.",
    },
  },
  senior_outreach: {
    label: "Senior outreach",
    patch: {
      roleTitle: "Senior Outreach Worker",
      department: "Outreach Operations",
      monthlySalaryPkr: "40000",
      commissionText:
        "PKR 2,000 per qualified lead. PKR 8,000 per closed deal. Higher rates for referral-sourced conversions.",
      employmentType: "Part-time / flexible",
      probationMonths: "1",
      workLocation: "Remote — Pakistan",
      workingHours: "Flexible with senior output expectations",
      additionalTerms:
        "• Mentor newer team members when requested.\n• Priority access to link pool batches.\n• All standard outreach policies apply.",
    },
  },
  team_leader: {
    label: "Team leader",
    patch: {
      roleTitle: "Team Leader",
      department: "Outreach Leadership",
      monthlySalaryPkr: "55000",
      commissionText:
        "PKR 3,000 team bonus per team closed deal (shared pool). Personal outreach commissions as per senior worker rates.",
      employmentType: "Part-time leadership + outreach",
      probationMonths: "2",
      workLocation: "Remote — Pakistan",
      workingHours: "Leadership duties plus personal outreach quota",
      additionalTerms:
        "• Leader workspace access: team pulse, invites, nudges, and worker task assignment.\n• Responsible for team activity and onboarding support.\n• Reports directly to founder.",
    },
  },
  custom: {
    label: "Blank / custom",
    patch: {},
  },
};

export function defaultOfferLetterForm(): OfferLetterForm {
  const today = new Date().toISOString().slice(0, 10);
  const ref = `IML-${today.replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    candidateName: "",
    candidateEmail: "",
    candidateCity: "Pakistan",
    roleTitle: "Outreach Worker",
    department: "Outreach Operations",
    startDate: today,
    monthlySalaryPkr: "25000",
    commissionText: "As per team commission policy — details in section below.",
    employmentType: "Part-time / flexible",
    probationMonths: "1",
    workLocation: "Remote — Pakistan",
    workingHours: "Flexible",
    additionalTerms: "",
    customOpening: "",
    signerName: "Shafiq Rehman",
    signerTitle: "Founder, InMailly",
    companyName: "InMailly — Shafiq's Marketing Automations Valley",
    letterDate: today,
    referenceNo: ref,
  };
}

export function formatPkr(amount: string | number) {
  const n = typeof amount === "string" ? parseInt(amount.replace(/\D/g, ""), 10) : amount;
  if (!n || Number.isNaN(n)) return "—";
  return `PKR ${n.toLocaleString("en-PK")}`;
}

export function formatLetterDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildOfferBodyParagraphs(form: OfferLetterForm): string[] {
  const opening =
    form.customOpening.trim() ||
    `We are pleased to offer you the position of ${form.roleTitle} at ${form.companyName}. We were impressed by your profile and believe you will be a strong addition to our outreach team.`;

  const paras = [
    `Dear ${form.candidateName.trim() || "Candidate"},`,
    "",
    opening,
    "",
    "Position details",
    `• Role: ${form.roleTitle}`,
    `• Department: ${form.department}`,
    `• Employment type: ${form.employmentType}`,
    `• Start date: ${formatLetterDate(form.startDate)}`,
    `• Work location: ${form.workLocation}`,
    `• Working hours: ${form.workingHours}`,
    `• Probation period: ${form.probationMonths} month(s)`,
    "",
    "Compensation",
    `• Monthly fixed salary: ${formatPkr(form.monthlySalaryPkr)} (Pakistani Rupees), payable monthly upon satisfactory performance.`,
    `• Commission & incentives: ${form.commissionText}`,
    "",
    "This offer is subject to successful completion of probation and continued adherence to InMailly team policies, including data confidentiality and professional conduct on all outreach channels.",
  ];

  if (form.additionalTerms.trim()) {
    paras.push("", "Additional terms", ...form.additionalTerms.split("\n").filter(Boolean));
  }

  paras.push(
    "",
    "Please confirm your acceptance by replying to this offer or signing below. We look forward to working with you.",
    "",
    "Warm regards,",
    form.signerName,
    form.signerTitle,
    form.companyName
  );

  return paras;
}
