import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getHttpErrorDetail, postJson, putJson } from "../api/client";
import { useCardDetailQuery, useCardsQuery, useMetaQuery } from "../api/queries";
import type {
  CardDraftPayload,
  CardValidationResponse,
  CardWriteResponse,
  RawCard,
} from "../api/types";
import { StatusPill } from "../components/StatusPill";
import { SurfaceMessage } from "../components/SurfaceMessage";
import { CompactRail } from "../components/WorkspaceChrome";
import { useUIStore } from "../state/uiStore";

type EditableCardDraft = {
  name: string;
  purpose: string;
  cardKind: string;
  prompt: string;
  inputsText: string;
  expectedOutputsText: string;
  expectedOutputType: string;
  displayCategory: string;
  notes: string;
  constraintsText: string;
  approvalExpectation: string;
  artifactExpectation: string;
};

type ActionFeedback = {
  headline: string;
  detail: string;
  tone: "ok" | "warning" | "muted";
};

const EMPTY_CARD_DRAFT: EditableCardDraft = {
  name: "New Requirement Card",
  purpose: "Describe the operator-facing objective.",
  cardKind: "requirement",
  prompt: "Write the next truthful card prompt here.",
  inputsText: "",
  expectedOutputsText: "summary.md",
  expectedOutputType: "markdown",
  displayCategory: "Definition",
  notes: "",
  constraintsText: "",
  approvalExpectation: "operator_review",
  artifactExpectation: "summary.md",
};

const REQUIRED_CARD_DEFAULT_FIELDS: Array<[keyof EditableCardDraft, string]> = [
  ["name", EMPTY_CARD_DRAFT.name],
  ["purpose", EMPTY_CARD_DRAFT.purpose],
  ["cardKind", EMPTY_CARD_DRAFT.cardKind],
  ["prompt", EMPTY_CARD_DRAFT.prompt],
  ["expectedOutputsText", EMPTY_CARD_DRAFT.expectedOutputsText],
  ["expectedOutputType", EMPTY_CARD_DRAFT.expectedOutputType],
  ["displayCategory", EMPTY_CARD_DRAFT.displayCategory],
  ["approvalExpectation", EMPTY_CARD_DRAFT.approvalExpectation],
  ["artifactExpectation", EMPTY_CARD_DRAFT.artifactExpectation],
];

function arrayFieldToText(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }
  return value.map((entry) => String(entry)).join("\n");
}

function stringField(value: unknown, fallback = ""): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function buildDraftFromRaw(raw: RawCard | undefined, promptSource: string): EditableCardDraft {
  if (!raw) {
    return EMPTY_CARD_DRAFT;
  }
  const params = raw.params ?? {};
  return {
    name: stringField(raw.summary, EMPTY_CARD_DRAFT.name),
    purpose: stringField(params.purpose, EMPTY_CARD_DRAFT.purpose),
    cardKind: stringField(params.original_card_kind, EMPTY_CARD_DRAFT.cardKind),
    prompt: stringField(params.prompt, promptSource || EMPTY_CARD_DRAFT.prompt),
    inputsText: arrayFieldToText(params.inputs),
    expectedOutputsText: arrayFieldToText(params.expected_outputs),
    expectedOutputType: stringField(params.expected_output_type, EMPTY_CARD_DRAFT.expectedOutputType),
    displayCategory: stringField(params.display_category, EMPTY_CARD_DRAFT.displayCategory),
    notes: stringField(raw.note, ""),
    constraintsText: arrayFieldToText(params.constraints),
    approvalExpectation: stringField(params.approval_expectation, EMPTY_CARD_DRAFT.approvalExpectation),
    artifactExpectation: stringField(params.artifact_expectation, EMPTY_CARD_DRAFT.artifactExpectation),
  };
}

function withRequiredCardDefaults(draft: EditableCardDraft): EditableCardDraft {
  const nextDraft = { ...draft };
  for (const [key, fallback] of REQUIRED_CARD_DEFAULT_FIELDS) {
    if (!String(nextDraft[key] ?? "").trim()) {
      nextDraft[key] = fallback;
    }
  }
  return nextDraft;
}

function requiredDefaultsApplied(current: EditableCardDraft, normalized: EditableCardDraft): string[] {
  return REQUIRED_CARD_DEFAULT_FIELDS.flatMap(([key]) =>
    String(current[key] ?? "").trim() || current[key] === normalized[key] ? [] : [key],
  );
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toCardDraftPayload(draft: EditableCardDraft): CardDraftPayload {
  return {
    name: draft.name.trim(),
    purpose: draft.purpose.trim(),
    card_kind: draft.cardKind.trim(),
    prompt: draft.prompt.trim(),
    inputs: splitLines(draft.inputsText),
    expected_outputs: splitLines(draft.expectedOutputsText),
    expected_output_type: draft.expectedOutputType.trim(),
    display_category: draft.displayCategory.trim(),
    notes: draft.notes.trim(),
    constraints: splitLines(draft.constraintsText),
    approval_expectation: draft.approvalExpectation.trim(),
    artifact_expectation: draft.artifactExpectation.trim(),
  };
}

function revisionIdFromRaw(raw: RawCard | undefined): string | undefined {
  const params = raw?.params;
  if (!params || typeof params !== "object") {
    return undefined;
  }
  const value = params.authoring_revision_id;
  const text = String(value ?? "").trim();
  return text || undefined;
}

export function CardsPage() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSelectedCardId = useUIStore((state) => state.setSelectedCardId);
  const cardsQuery = useCardsQuery(18);
  const metaQuery = useMetaQuery();
  const cardItems = cardsQuery.data?.cards.items ?? [];
  const detailQuery = useCardDetailQuery(cardId);
  const [draft, setDraft] = useState<EditableCardDraft>(EMPTY_CARD_DRAFT);
  const [draftSourceCardId, setDraftSourceCardId] = useState<string | undefined>(undefined);
  const [draftBaseSnapshot, setDraftBaseSnapshot] = useState<string>(JSON.stringify(EMPTY_CARD_DRAFT));
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | undefined>(undefined);
  const [validationResult, setValidationResult] = useState<CardValidationResponse | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cardId) {
      return;
    }
    setDraft(EMPTY_CARD_DRAFT);
    setDraftSourceCardId(undefined);
    setDraftBaseSnapshot(JSON.stringify(EMPTY_CARD_DRAFT));
    setValidationResult(undefined);
  }, [cardId]);

  useEffect(() => {
    setSelectedCardId(cardId);
  }, [cardId, setSelectedCardId]);

  const detailRaw = detailQuery.data?.raw;
  const promptSourceText = detailQuery.data?.prompt_source.source_text ?? "";
  const currentRevisionId = revisionIdFromRaw(detailRaw);

  useEffect(() => {
    if (!detailRaw || !cardId) {
      return;
    }
    const nextDraft = buildDraftFromRaw(detailRaw, promptSourceText);
    setDraft(nextDraft);
    setDraftSourceCardId(detailRaw.id);
    setDraftBaseSnapshot(JSON.stringify(nextDraft));
    setValidationResult(undefined);
  }, [cardId, detailRaw?.id, currentRevisionId, promptSourceText]);

  if (cardsQuery.isLoading) {
    return <SurfaceMessage title="Loading cards" body="Fetching the admitted card-view surface." />;
  }

  const draftDirty = JSON.stringify(draft) !== draftBaseSnapshot;
  const dependencies = Array.isArray(detailRaw?.depends_on)
    ? detailRaw.depends_on.map((dependency) => String(dependency))
    : [];
  const visibleCards = cardItems.slice(0, 4);
  const writeActions = metaQuery.data?.write_actions ?? [];
  const writeSummary =
    writeActions.find((item) => item.action === "save card")?.status ??
    metaQuery.data?.observed_result ??
    "unknown";
  const detailView = detailQuery.data?.view as Record<string, unknown> | undefined;
  const relatedRun = (detailView?.run ?? detailView?.last_run) as Record<string, unknown> | undefined;
  const relatedRunId = String(relatedRun?.session_id ?? detailView?.session_id ?? "").trim() || undefined;
  const defaultInstruction = !draftSourceCardId
    ? "Required fields are prefilled for quick create. You can press Create Card immediately."
    : "Edits remain extension-local until Save Card completes against the host card authoring seam.";
  const activeFeedback = actionFeedback ?? {
    headline: draftSourceCardId ? `Editing ${draftSourceCardId}` : "New card draft ready",
    detail: defaultInstruction,
    tone: "muted" as const,
  };

  async function refreshCardSurfaces(nextCardId: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["cards"] }),
      queryClient.invalidateQueries({ queryKey: ["card-detail", nextCardId] }),
    ]);
  }

  function resetToHostOrEmpty() {
    if (detailRaw && cardId) {
      const nextDraft = buildDraftFromRaw(detailRaw, promptSourceText);
      setDraft(nextDraft);
      setDraftBaseSnapshot(JSON.stringify(nextDraft));
      setActionFeedback({
        headline: "Draft restored",
        detail: "Discarded extension-local edits and restored the last host-confirmed card revision.",
        tone: "ok",
      });
      setValidationResult(undefined);
      return;
    }
    setDraft(EMPTY_CARD_DRAFT);
    setDraftSourceCardId(undefined);
    setDraftBaseSnapshot(JSON.stringify(EMPTY_CARD_DRAFT));
    setActionFeedback({
      headline: "Draft reset",
      detail: "Returned to the quick-create draft defaults.",
      tone: "ok",
    });
    setValidationResult(undefined);
  }

  function startNewDraft() {
    setDraft(EMPTY_CARD_DRAFT);
    setDraftSourceCardId(undefined);
    setDraftBaseSnapshot(JSON.stringify(EMPTY_CARD_DRAFT));
    setActionFeedback({
      headline: "New draft ready",
      detail: "Switched to a new extension-local card draft with required fields already populated.",
      tone: "ok",
    });
    setValidationResult(undefined);
    if (cardId) {
      navigate("/cards");
    }
  }

  async function handleValidate() {
    const normalizedDraft = withRequiredCardDefaults(draft);
    const defaultedFields = requiredDefaultsApplied(draft, normalizedDraft);
    if (defaultedFields.length > 0) {
      setDraft(normalizedDraft);
    }
    setIsValidating(true);
    try {
      const result = await postJson<CardValidationResponse>("/api/cards/validate", {
        draft: toCardDraftPayload(normalizedDraft),
      });
      setValidationResult(result);
      setActionFeedback({
        headline: result.is_valid ? "Validation passed" : "Validation returned issues",
        detail:
          defaultedFields.length > 0
            ? `${result.summary} Applied defaults for ${defaultedFields.join(", ")}.`
            : result.summary,
        tone: result.is_valid ? "ok" : "warning",
      });
    } catch (error) {
      setActionFeedback({
        headline: "Validation failed",
        detail: getHttpErrorDetail(error, "Card validation failed."),
        tone: "warning",
      });
    } finally {
      setIsValidating(false);
    }
  }

  async function handleCreate() {
    const normalizedDraft = withRequiredCardDefaults(draft);
    const defaultedFields = requiredDefaultsApplied(draft, normalizedDraft);
    if (defaultedFields.length > 0) {
      setDraft(normalizedDraft);
      setDraftBaseSnapshot(JSON.stringify(normalizedDraft));
    }
    setIsCreating(true);
    try {
      const result = await postJson<CardWriteResponse>("/api/cards", {
        draft: toCardDraftPayload(normalizedDraft),
      });
      setValidationResult(result.validation);
      setActionFeedback({
        headline: `Created ${result.card_id}`,
        detail:
          defaultedFields.length > 0
            ? `${result.summary} Applied defaults for ${defaultedFields.join(", ")}.`
            : result.summary,
        tone: "ok",
      });
      await refreshCardSurfaces(result.card_id);
      navigate(`/cards/${result.card_id}`);
    } catch (error) {
      setActionFeedback({
        headline: "Create failed",
        detail: getHttpErrorDetail(error, "Card creation failed."),
        tone: "warning",
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSave() {
    if (!draftSourceCardId) {
      return;
    }
    const normalizedDraft = withRequiredCardDefaults(draft);
    const defaultedFields = requiredDefaultsApplied(draft, normalizedDraft);
    if (defaultedFields.length > 0) {
      setDraft(normalizedDraft);
    }
    setIsSaving(true);
    try {
      const result = await putJson<CardWriteResponse>(`/api/cards/${draftSourceCardId}`, {
        draft: toCardDraftPayload(normalizedDraft),
        expected_revision_id: currentRevisionId,
      });
      setValidationResult(result.validation);
      setActionFeedback({
        headline: `Saved ${draftSourceCardId}`,
        detail:
          defaultedFields.length > 0
            ? `${result.summary} Applied defaults for ${defaultedFields.join(", ")}.`
            : result.summary,
        tone: "ok",
      });
      await refreshCardSurfaces(draftSourceCardId);
      await queryClient.refetchQueries({ queryKey: ["card-detail", draftSourceCardId] });
    } catch (error) {
      setActionFeedback({
        headline: "Save failed",
        detail: getHttpErrorDetail(error, "Card save failed."),
        tone: "warning",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mock-workspace">
      <CompactRail activeKey="flows" />

      <div className="mock-cards-page">
        <section className="mock-card-editor">
          <header className="mock-card-header">
            <div className="mock-card-kicker">
              <span className="material-symbols-outlined">description</span>
              <span>Card Definition</span>
            </div>
            <input
              className="mock-card-title-input"
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Untitled Card"
            />
            <p className="mock-card-subtitle">{draft.purpose}</p>
          </header>

          <section className="mock-card-meta-grid">
            <div>
              <p className="mock-field-kicker">Mode</p>
              <strong>{draftSourceCardId ? "Host-backed card" : "New draft"}</strong>
            </div>
            <div>
              <p className="mock-field-kicker">Card Kind</p>
              <strong>{draft.cardKind}</strong>
            </div>
            <div>
              <p className="mock-field-kicker">Display Category</p>
              <strong>{draft.displayCategory}</strong>
            </div>
            <div>
              <p className="mock-field-kicker">Output Type</p>
              <strong>{draft.expectedOutputType}</strong>
            </div>
          </section>

          <section className="mock-editor-section">
            <h2>Purpose</h2>
            <textarea
              className="mock-editor-textarea"
              value={draft.purpose}
              onChange={(event) => setDraft((current) => ({ ...current, purpose: event.target.value }))}
            />
          </section>

          <section className="mock-editor-section">
            <div className="mock-section-head">
              <h2>System Prompt</h2>
              <button className="mock-inline-button" type="button" disabled>
                <span className="material-symbols-outlined">auto_fix</span>
                Optimizing
              </button>
            </div>
            <div className="mock-prompt-editor-frame">
              <CodeMirror
                value={draft.prompt}
                onChange={(value) => setDraft((current) => ({ ...current, prompt: value }))}
                extensions={[markdown()]}
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  highlightActiveLine: false,
                  highlightActiveLineGutter: false,
                }}
              />
            </div>
          </section>

          <div className="mock-two-column-grid">
            <section className="mock-editor-section">
              <h2>Inputs</h2>
              <textarea
                className="mock-editor-textarea mock-editor-textarea-compact"
                value={draft.inputsText}
                onChange={(event) => setDraft((current) => ({ ...current, inputsText: event.target.value }))}
                placeholder="One input per line"
              />
            </section>

            <section className="mock-editor-section">
              <h2>Outputs</h2>
              <textarea
                className="mock-editor-textarea mock-editor-textarea-compact"
                value={draft.expectedOutputsText}
                onChange={(event) => setDraft((current) => ({ ...current, expectedOutputsText: event.target.value }))}
                placeholder="One output per line"
              />
              <label className="mock-inline-field">
                <span>Artifact expectation</span>
                <input
                  type="text"
                  value={draft.artifactExpectation}
                  onChange={(event) => setDraft((current) => ({ ...current, artifactExpectation: event.target.value }))}
                />
              </label>
            </section>
          </div>

          <div className="mock-two-column-grid">
            <section className="mock-editor-section">
              <h2>Notes</h2>
              <textarea
                className="mock-editor-textarea mock-editor-textarea-compact"
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Operator-facing notes"
              />
            </section>

            <section className="mock-editor-section">
              <h2>Approval Expectation</h2>
              <textarea
                className="mock-editor-textarea mock-editor-textarea-compact"
                value={draft.approvalExpectation}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, approvalExpectation: event.target.value }))
                }
              />
            </section>
          </div>
        </section>

        <aside className="mock-card-sidebar">
          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Action feedback</p>
            <div className="mock-validation-stack">
              <div className={`mock-validation-card ${activeFeedback.tone === "ok" ? "is-ok" : activeFeedback.tone === "warning" ? "is-warning" : "is-muted"}`}>
                <strong>{activeFeedback.headline}</strong>
                <p>{activeFeedback.detail}</p>
              </div>
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Live validation</p>
            <div className="mock-validation-stack">
              <div className={`mock-validation-card ${validationResult?.is_valid ? "is-ok" : "is-muted"}`}>
                <strong>{validationResult?.is_valid ? "Card Ready" : draftDirty ? "Draft changed" : "Awaiting validation"}</strong>
                <p>
                  {validationResult?.summary ??
                    (draftDirty
                      ? "Local edits differ from the last host-confirmed revision."
                      : "Run validation or save the draft to refresh host confirmation.")}
                </p>
              </div>
              {(validationResult?.warnings ?? splitLines(draft.constraintsText)).slice(0, 2).map((warning) => (
                <div key={warning} className="mock-validation-card is-warning">
                  <strong>Attention</strong>
                  <p>{warning}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Dependencies</p>
            <div className="mock-list-stack">
              {dependencies.length > 0 ? (
                dependencies.map((dependency) => <span key={dependency}>{dependency}</span>)
              ) : (
                <span>No host-confirmed dependencies are attached to this card yet.</span>
              )}
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Known cards</p>
            <div className="mock-recent-list">
              {visibleCards.map((item) => (
                <Link key={item.card_id} className="mock-recent-row" to={`/cards/${item.card_id}`}>
                  <span className="material-symbols-outlined">description</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.card_id}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Run context</p>
            <div className="mock-list-stack">
              {relatedRunId ? (
                <>
                  <Link className="mock-inline-link" to={`/runs/${relatedRunId}`}>
                    Open run {relatedRunId}
                  </Link>
                  <Link className="mock-inline-link" to={`/inspector/run/${relatedRunId}`}>
                    Inspect run
                  </Link>
                </>
              ) : (
                <span>Create or select a card to pick up host-confirmed run context here.</span>
              )}
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Host seam status</p>
            <StatusPill tone={writeSummary.startsWith("admitted") ? "emerald" : "amber"}>
              {writeSummary}
            </StatusPill>
            {currentRevisionId && <p className="mock-sidebar-note">Host revision {currentRevisionId}</p>}
            <p className="mock-sidebar-note">{defaultInstruction}</p>
          </section>

          <div className="mock-card-sidebar-actions">
            <button className="mock-secondary-button" type="button" onClick={startNewDraft}>
              New Card Draft
            </button>
            <button className="mock-primary-button" type="button" onClick={draftSourceCardId ? handleSave : handleCreate} disabled={isSaving || isCreating}>
              {draftSourceCardId ? (isSaving ? "Saving..." : "Save Card") : isCreating ? "Creating..." : "Create Card"}
            </button>
            <button className="mock-secondary-button" type="button" onClick={resetToHostOrEmpty}>
              Discard Draft
            </button>
            <button className="mock-secondary-button" type="button" onClick={handleValidate} disabled={isValidating}>
              {isValidating ? "Validating..." : "Validate Card"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
