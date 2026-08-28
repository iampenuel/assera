export type Decision = "denied";

export interface DenialDetails {
  readonly case_id: string;
  readonly service: string;
  readonly decision: Decision;
  readonly decision_date: string;
  readonly reason_code: string;
  readonly reason: string;
  readonly appeal_deadline: string;
  readonly payer: string;
}

export interface EvidenceDocument {
  readonly id: string;
  readonly title: string;
}

export interface AdministrativeRequirement {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
}

export interface PatientCase extends DenialDetails {
  readonly patient: {
    readonly name: string;
    readonly age: number;
    readonly location: string;
  };
  readonly plain_language_explanation: string;
  readonly evidence: readonly EvidenceDocument[];
  readonly readiness: readonly AdministrativeRequirement[];
}

export interface AgentActivity {
  readonly id: string;
  readonly title: string;
  readonly category: "READ";
  readonly impact: "No information changed";
  readonly occurredAt: string;
}

export type WebMCPStatus = "checking" | "available" | "unavailable" | "error";
