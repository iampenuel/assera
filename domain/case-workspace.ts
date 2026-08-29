import { getCaseFixture } from "../data/case-fixture";
import { mayaEvidence } from "../data/evidence-fixture";
import { mayaCoveragePolicy } from "../data/policy-fixture";
import {
  createAppealDraft,
  DraftStatementError,
  PrepareBlockedError,
  validateDraftStatement,
} from "./appeal-draft";
import { evaluateAppealReadiness } from "./readiness";
import {
  createTreatmentDateConfirmation,
  deriveEffectiveEvidence,
  validateTreatmentDates,
} from "./treatment-dates";
import type {
  AppealDraft,
  CaseWorkspaceAdapter,
  CaseWorkspaceSnapshot,
  CaseWorkspaceState,
  ConfirmTreatmentDatesResult,
  PrepareAppealResult,
  TreatmentDateConfirmation,
  WorkspaceActivity,
  WorkspaceActivityInput,
  WorkspaceActor,
} from "../types/case";

export type CaseWorkspaceAction =
  | {
      readonly type: "activity_recorded";
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "treatment_dates_confirmed";
      readonly confirmation: TreatmentDateConfirmation;
      readonly appealDraft: AppealDraft | null;
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "appeal_draft_prepared";
      readonly appealDraft: AppealDraft;
      readonly activity: WorkspaceActivity;
    }
  | {
      readonly type: "appeal_draft_updated";
      readonly appealDraft: AppealDraft;
      readonly activity: WorkspaceActivity;
    };

export function createInitialCaseWorkspaceState(caseId: string): CaseWorkspaceState {
  if (!getCaseFixture(caseId)) {
    throw new Error(`Unsupported ASSERA case: ${caseId}`);
  }

  return {
    caseId,
    treatmentDateConfirmation: null,
    appealDraft: null,
    activities: [],
  };
}

export function caseWorkspaceReducer(
  state: CaseWorkspaceState,
  action: CaseWorkspaceAction,
): CaseWorkspaceState {
  switch (action.type) {
    case "activity_recorded":
      return {
        ...state,
        activities: [...state.activities, action.activity],
      };
    case "treatment_dates_confirmed":
      return {
        ...state,
        treatmentDateConfirmation: action.confirmation,
        appealDraft: action.appealDraft,
        activities: [...state.activities, action.activity],
      };
    case "appeal_draft_prepared":
    case "appeal_draft_updated":
      return {
        ...state,
        appealDraft: action.appealDraft,
        activities: [...state.activities, action.activity],
      };
    default:
      return state;
  }
}

export function selectCaseWorkspaceSnapshot(
  state: CaseWorkspaceState,
): CaseWorkspaceSnapshot {
  const caseData = getCaseFixture(state.caseId);
  if (!caseData || mayaCoveragePolicy.case_id !== state.caseId) {
    throw new Error(`Unsupported ASSERA case: ${state.caseId}`);
  }

  const effectiveEvidence = deriveEffectiveEvidence(
    mayaEvidence,
    state.treatmentDateConfirmation,
  );
  const readiness = evaluateAppealReadiness(
    state.caseId,
    mayaCoveragePolicy,
    effectiveEvidence,
  );

  return {
    caseId: state.caseId,
    caseData,
    policy: mayaCoveragePolicy,
    baseEvidence: mayaEvidence,
    effectiveEvidence,
    treatmentDateConfirmation: state.treatmentDateConfirmation,
    readiness,
    appealDraft: state.appealDraft,
    activities: state.activities,
  };
}

export function getInitialCaseWorkspaceSnapshot(
  caseId: string,
): CaseWorkspaceSnapshot {
  return selectCaseWorkspaceSnapshot(createInitialCaseWorkspaceState(caseId));
}

type ApplyWorkspaceAction = (action: CaseWorkspaceAction) => CaseWorkspaceState;

interface CreateCaseWorkspaceAdapterOptions {
  readonly getState: () => CaseWorkspaceState;
  readonly applyAction: ApplyWorkspaceAction;
  readonly now?: () => string;
}

function confirmationsMatch(
  current: TreatmentDateConfirmation | null,
  next: Pick<TreatmentDateConfirmation, "start_date" | "end_date">,
): boolean {
  return (
    current?.start_date === next.start_date && current.end_date === next.end_date
  );
}

export function createCaseWorkspaceAdapter({
  getState,
  applyAction,
  now = () => new Date().toISOString(),
}: CreateCaseWorkspaceAdapterOptions): CaseWorkspaceAdapter {
  const getSnapshot = () => selectCaseWorkspaceSnapshot(getState());

  const materializeActivity = (
    input: WorkspaceActivityInput,
    occurredAt: string,
  ): WorkspaceActivity => ({
    ...input,
    id: `${input.toolName ?? input.actor.toLowerCase()}-${occurredAt}-${getState().activities.length}`,
    occurredAt,
  }) as WorkspaceActivity;

  const recordActivity = (input: WorkspaceActivityInput): WorkspaceActivity => {
    const occurredAt = now();
    const activity = materializeActivity(input, occurredAt);
    applyAction({ type: "activity_recorded", activity });
    return activity;
  };

  return {
    getSnapshot,

    recordActivity,

    confirmTreatmentDates(input, actor): ConfirmTreatmentDatesResult {
      const snapshot = getSnapshot();
      const physicalTherapy = snapshot.baseEvidence.find(
        (document) => document.id === "evidence-physical-therapy",
      );
      if (!physicalTherapy) {
        throw new Error("The physical-therapy evidence record is unavailable.");
      }

      const validated = validateTreatmentDates(input, physicalTherapy.document_date);
      if (confirmationsMatch(snapshot.treatmentDateConfirmation, validated)) {
        return {
          action: "unchanged",
          confirmation: snapshot.treatmentDateConfirmation!,
          readiness: snapshot.readiness,
          draft_invalidated: false,
        };
      }

      const occurredAt = now();
      const confirmation = createTreatmentDateConfirmation(validated, occurredAt);
      const draftInvalidated = snapshot.appealDraft !== null;
      const isUpdate = snapshot.treatmentDateConfirmation !== null;
      const activity = materializeActivity(
        {
          title: draftInvalidated ? "Treatment dates updated" : "Treatment dates confirmed",
          category: "PREPARE",
          actor,
          outcome: "completed",
          impact: draftInvalidated
            ? "Case workspace updated; the previous draft must be prepared again. Nothing submitted."
            : "Case workspace updated; nothing submitted",
        },
        occurredAt,
      );

      const nextState = applyAction({
        type: "treatment_dates_confirmed",
        confirmation,
        appealDraft: null,
        activity,
      });
      const nextSnapshot = selectCaseWorkspaceSnapshot(nextState);

      return {
        action: isUpdate ? "updated" : "confirmed",
        confirmation,
        readiness: nextSnapshot.readiness,
        draft_invalidated: draftInvalidated,
      };
    },

    prepareAppeal(actor: WorkspaceActor): PrepareAppealResult {
      const snapshot = getSnapshot();

      try {
        if (
          snapshot.appealDraft &&
          confirmationsMatch(
            snapshot.treatmentDateConfirmation,
            snapshot.appealDraft.treatment_date_confirmation,
          )
        ) {
          recordActivity({
            title: "Existing appeal draft opened",
            category: "PREPARE",
            actor,
            outcome: "completed",
            impact: "No new draft created; nothing submitted",
            ...(actor === "AGENT" ? { toolName: "prepare_appeal" } : {}),
          });
          return {
            case_id: snapshot.caseId,
            action: "reused",
            draft: snapshot.appealDraft,
          };
        }

        if (
          !snapshot.readiness.ready_to_prepare ||
          !snapshot.treatmentDateConfirmation
        ) {
          throw new PrepareBlockedError(snapshot);
        }

        const occurredAt = now();
        const appealDraft = createAppealDraft(snapshot, occurredAt);
        const activity = materializeActivity(
          {
            title: "Appeal draft prepared",
            category: "PREPARE",
            actor,
            outcome: "completed",
            impact: "Draft created in ASSERA; nothing submitted",
            ...(actor === "AGENT" ? { toolName: "prepare_appeal" } : {}),
          },
          occurredAt,
        );
        applyAction({
          type: "appeal_draft_prepared",
          appealDraft,
          activity,
        });

        return {
          case_id: snapshot.caseId,
          action: "created",
          draft: appealDraft,
        };
      } catch (error) {
        if (error instanceof PrepareBlockedError) {
          recordActivity({
            title: "Appeal preparation blocked",
            category: "PREPARE",
            actor,
            outcome: "blocked",
            impact:
              "Treatment dates require confirmation; no draft created or submitted",
            ...(actor === "AGENT" ? { toolName: "prepare_appeal" } : {}),
          });
        }
        throw error;
      }
    },

    updateDraftStatement(statement, actor): AppealDraft {
      const snapshot = getSnapshot();
      if (!snapshot.appealDraft) {
        throw new DraftStatementError(
          "DRAFT_NOT_FOUND",
          "Prepare an appeal draft before saving changes.",
        );
      }

      const occurredAt = now();
      const appealDraft = {
        ...snapshot.appealDraft,
        statement: validateDraftStatement(statement),
        updated_at: occurredAt,
      };
      const activity = materializeActivity(
        {
          title: "Appeal draft updated",
          category: "PREPARE",
          actor,
          outcome: "completed",
          impact: "Draft updated in ASSERA; nothing submitted",
        },
        occurredAt,
      );
      applyAction({
        type: "appeal_draft_updated",
        appealDraft,
        activity,
      });
      return appealDraft;
    },
  };
}

export function createStandaloneCaseWorkspace(caseId: string): {
  readonly adapter: CaseWorkspaceAdapter;
  readonly getState: () => CaseWorkspaceState;
} {
  let state = createInitialCaseWorkspaceState(caseId);
  const getState = () => state;
  const adapter = createCaseWorkspaceAdapter({
    getState,
    applyAction: (action) => {
      state = caseWorkspaceReducer(state, action);
      return state;
    },
  });
  return { adapter, getState };
}

export { DraftStatementError, PrepareBlockedError };
