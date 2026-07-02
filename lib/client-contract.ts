import {
  formatLetterDate,
  formatUsd,
  formatInmailCount,
  type ClientServiceAgreementForm,
} from "@/lib/client-service-agreement";

export type ClientContractStatus = "pending_signature" | "signed" | "terminated";

export type ClientServiceContractRow = {
  id: string;
  reference_no: string;
  access_token: string;
  client_id: string | null;
  project_id: string | null;
  contact_name: string;
  contact_email: string;
  form_data: ClientServiceAgreementForm;
  status: ClientContractStatus;
  signature_png: string | null;
  signed_at: string | null;
  sent_at: string;
  created_at: string;
};

export type ClientContractTerminationRow = {
  id: string;
  contract_id: string;
  client_id: string | null;
  effective_date: string;
  inmails_delivered: number;
  inmails_remaining: number;
  refund_amount_usd: number;
  reason: string | null;
  notice_body: string;
  notified_at: string;
};

export function buildClientServiceEndNotice(opts: {
  contactName: string;
  clientCompany: string;
  projectName: string;
  packageName: string;
  inmailPackageSize: string;
  referenceNo: string;
  effectiveDate: string;
  inmailsDelivered: number;
  inmailsRemaining: number;
  refundAmountUsd: number;
  reason?: string;
  providerName: string;
  signerName: string;
}): string {
  const total = parseInt(opts.inmailPackageSize.replace(/\D/g, ""), 10) || 0;
  const lines = [
    `SERVICE END NOTICE`,
    ``,
    `Dear ${opts.contactName},`,
    ``,
    `This notice confirms that the InMail outreach service agreement between ${opts.clientCompany || opts.contactName} and ${opts.providerName} for project "${opts.projectName}" (${opts.packageName} package — ${formatInmailCount(total)} InMails, ref: ${opts.referenceNo}) ends effective ${formatLetterDate(opts.effectiveDate)}.`,
    ``,
    `Delivery summary`,
    `• InMails delivered (with send proofs): ${opts.inmailsDelivered.toLocaleString("en-US")}`,
    `• InMails remaining in package: ${opts.inmailsRemaining.toLocaleString("en-US")}`,
    `• Refund amount (if applicable): ${formatUsd(opts.refundAmountUsd)}`,
    `• Agreement status: Ended — no further outreach will be performed unless a new written agreement is signed.`,
    ``,
    `Your client dashboard will reflect final delivery counts. Any approved refund will be processed within 14 business days of this notice.`,
  ];

  if (opts.reason?.trim()) {
    lines.push(``, `Reason provided:`, opts.reason.trim());
  }

  lines.push(
    ``,
    `Thank you for partnering with InMailly. If you have questions about final delivery or billing, reply to this notice within 14 days.`,
    ``,
    opts.signerName,
    opts.providerName
  );

  return lines.join("\n");
}
