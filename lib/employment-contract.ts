import { formatLetterDate, formatPkr, type OfferLetterForm } from "@/lib/offer-letter";

export type ContractStatus = "pending_signature" | "signed" | "terminated";

export type EmploymentContractRow = {
  id: string;
  reference_no: string;
  access_token: string;
  member_id: string | null;
  candidate_name: string;
  candidate_email: string;
  form_data: OfferLetterForm;
  status: ContractStatus;
  signature_png: string | null;
  signed_at: string | null;
  sent_at: string;
  created_at: string;
};

export type ContractTerminationRow = {
  id: string;
  contract_id: string;
  member_id: string | null;
  effective_date: string;
  total_days_worked: number;
  pending_amount_pkr: number;
  reason: string | null;
  notice_body: string;
  notified_at: string;
};

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso.slice(0, 10) + "T12:00:00");
  const end = new Date(endIso.slice(0, 10) + "T12:00:00");
  const diff = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, diff + 1);
}

export function buildTerminationNotice(opts: {
  candidateName: string;
  roleTitle: string;
  referenceNo: string;
  effectiveDate: string;
  totalDaysWorked: number;
  pendingAmountPkr: number;
  reason?: string;
  companyName: string;
  signerName: string;
}): string {
  const lines = [
    `TERMINATION NOTICE`,
    ``,
    `Dear ${opts.candidateName},`,
    ``,
    `This notice confirms that your working arrangement with ${opts.companyName} for the role of ${opts.roleTitle} (Contract ref: ${opts.referenceNo}) is ended effective ${formatLetterDate(opts.effectiveDate)}.`,
    ``,
    `Summary`,
    `• Total days worked under this contract: ${opts.totalDaysWorked}`,
    `• Pending approved payment (if any): ${formatPkr(opts.pendingAmountPkr)}`,
    `• Contract status: Terminated — no further work is to be performed unless a new written agreement is issued.`,
    ``,
    `As stated in your offer letter, this was a non-permanent, performance-based engagement. InMailly reserves the right to end work based on business outcomes, revenue, and performance. No ongoing liability exists beyond approved amounts stated above.`,
  ];

  if (opts.reason?.trim()) {
    lines.push(``, `Reason provided:`, opts.reason.trim());
  }

  lines.push(
    ``,
    `Your team workspace access may be deactivated. If you believe any approved payment is outstanding, reply to this notice within 7 days with documentation.`,
    ``,
    opts.signerName,
    opts.companyName
  );

  return lines.join("\n");
}
