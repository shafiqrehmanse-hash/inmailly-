export const INFO_DOC_BUCKET = "employee-info-docs";

export type InfoDocStatus = "pending_fill" | "submitted" | "reviewed";

export type InfoDocForm = {
  govtIdNumber: string;
  fatherName: string;
  homeAddress: string;
  personalPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  referenceName: string;
  referencePhone: string;
  referenceRelation: string;
  qualification: string;
  currentEmployment: string;
  govtIdFrontPath: string | null;
  govtIdBackPath: string | null;
  experienceLetterPath: string | null;
};

export type InfoDocStats = {
  usedLinks30d: number;
  closedDeals30d: number;
};

export type EmployeeInfoDocRow = {
  id: string;
  reference_no: string;
  member_id: string | null;
  employee_name: string;
  employee_email: string;
  admin_note: string | null;
  form_data: InfoDocForm;
  stats_snapshot: InfoDocStats | null;
  status: InfoDocStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  sent_at: string;
  created_at: string;
  updated_at: string;
};

export function defaultInfoDocForm(): InfoDocForm {
  return {
    govtIdNumber: "",
    fatherName: "",
    homeAddress: "",
    personalPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    referenceName: "",
    referencePhone: "",
    referenceRelation: "",
    qualification: "",
    currentEmployment: "",
    govtIdFrontPath: null,
    govtIdBackPath: null,
    experienceLetterPath: null,
  };
}

export function newInfoDocReferenceNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `IML-INFO-${y}${m}${day}-${n}`;
}

export function validateInfoDocForm(form: Partial<InfoDocForm>): string | null {
  if (!form.govtIdNumber?.trim()) return "Government ID number is required";
  if (!form.fatherName?.trim()) return "Father name is required";
  if (!form.homeAddress?.trim()) return "Home address is required";
  if (!form.emergencyContactName?.trim() || !form.emergencyContactPhone?.trim()) {
    return "Emergency contact name and phone are required";
  }
  if (!form.referenceName?.trim() || !form.referencePhone?.trim()) {
    return "Reference name and phone are required";
  }
  if (!form.qualification?.trim()) return "Qualification is required";
  if (!form.currentEmployment?.trim()) {
    return "Current employment details are required — this helps us offer better opportunities";
  }
  if (!form.govtIdFrontPath) return "Government ID front photo is required";
  if (!form.govtIdBackPath) return "Government ID back photo is required";
  return null;
}
