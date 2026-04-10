import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { Link, useSearchParams } from "react-router-dom";

import { usePromptReforgerContextQuery } from "../api/queries";
import { StatusPill } from "../components/StatusPill";
import { SurfaceMessage } from "../components/SurfaceMessage";
import { CompactRail } from "../components/WorkspaceChrome";
import { useUIStore } from "../state/uiStore";

function resultTone(resultClass: string): "emerald" | "amber" | "rose" | "slate" {
  if (resultClass === "certified") {
    return "emerald";
  }
  if (resultClass === "unsupported") {
    return "rose";
  }
  if (resultClass === "unknown") {
    return "slate";
  }
  return "amber";
}

function deriveResultClass(cardId: string | undefined, sourcePrompt: string, observedResult: string): string {
  if (!cardId || !sourcePrompt.trim()) {
    return "unsupported";
  }
  if (observedResult === "success" || observedResult === "partial success") {
    return "certified_with_limits";
  }
  return "unsupported";
}

function buildDerivedVariant(sourcePrompt: string): string {
  const trimmed = sourcePrompt.trim();
  if (!trimmed) {
    return "No source prompt is available on the admitted card surfaces.";
  }
  return [
    "Derived comparison shell",
    "",
    "System role",
    "Preserve the selected card as the only admitted prompt source.",
    "",
    "Task",
    trimmed,
    "",
    "Operator notes",
    "- Keep result vocabulary subordinate to the generic service contract.",
    "- Treat this variant as extension-local analysis, not host-confirmed deployment truth.",
    "- Return to the source card before saving any broader prompt changes.",
  ].join("\n");
}

export function PromptReforgerPage() {
  const [searchParams] = useSearchParams();
  const selectedCardId = useUIStore((state) => state.selectedCardId);
  const cardId = searchParams.get("cardId") ?? selectedCardId;
  const contextQuery = usePromptReforgerContextQuery(cardId ?? undefined);

  if (contextQuery.isLoading) {
    return <SurfaceMessage title="Loading Prompt Reforger context" body="Fetching bounded Prompt Reforger context for the selected card." />;
  }

  const context = contextQuery.data;
  if (!context) {
    return <SurfaceMessage title="No Prompt Reforger context" body="The bounded Prompt Reforger context is unavailable." tone="warning" />;
  }

  const primaryResult = deriveResultClass(cardId ?? undefined, context.source_prompt.source_text, context.observed_result);
  const derivedVariant = buildDerivedVariant(context.source_prompt.source_text);
  const cardSummary = String((context.card_view as Record<string, unknown> | undefined)?.summary ?? "").trim();

  return (
    <section className="mock-workspace">
      <CompactRail activeKey="artifacts" />

      <div className="mock-prompt-page">
        <section className="mock-prompt-main">
          <header className="mock-page-heading mock-prompt-heading">
            <div>
              <h1>Prompt Reforger</h1>
              <p className="mock-prompt-kicker">
                Refining task: {cardSummary || (cardId ?? "card-bound persona unavailable")}
              </p>
            </div>
          </header>

          {!cardId && (
            <SurfaceMessage
              title="No card context selected"
              body="Choose a card first to bind Prompt Reforger to a concrete source prompt."
            />
          )}

          {cardId && (
            <div className="mock-prompt-grid">
              <section className="mock-prompt-column">
                <div className="mock-prompt-column-head">
                  <h2>Source Prompt</h2>
                  <span>{context.source_prompt.source_label}</span>
                </div>
                <div className="mock-editor-card">
                  <CodeMirror
                    value={context.source_prompt.source_text || "No source prompt is available on the admitted card surfaces."}
                    editable={false}
                    extensions={[markdown()]}
                    basicSetup={{
                      lineNumbers: false,
                      foldGutter: false,
                      highlightActiveLine: false,
                      highlightActiveLineGutter: false,
                    }}
                  />
                </div>
                <div className="mock-prompt-hint">
                  <span className="material-symbols-outlined">info</span>
                  <span>{context.status_note}</span>
                </div>
              </section>

              <section className="mock-prompt-column">
                <div className="mock-prompt-column-head">
                  <h2>Derived Variant</h2>
                  <StatusPill tone={resultTone(primaryResult)}>
                    {primaryResult.replace(/_/g, " ")}
                  </StatusPill>
                </div>
                <div className="mock-editor-card">
                  <CodeMirror
                    value={derivedVariant}
                    editable={false}
                    extensions={[markdown()]}
                    basicSetup={{
                      lineNumbers: false,
                      foldGutter: false,
                      highlightActiveLine: false,
                      highlightActiveLineGutter: false,
                    }}
                  />
                </div>
                <div className="mock-prompt-actions">
                  <Link className="mock-primary-button" to={`/cards/${cardId}`}>
                    Return to Card
                  </Link>
                  <Link className="mock-icon-square" to={`/inspector/card/${cardId}`} aria-label="Open Inspector">
                    <span className="material-symbols-outlined">open_in_new</span>
                  </Link>
                </div>
                <Link className="mock-inline-link" to={`/cards/${cardId}?from=prompt-reforger`}>
                  Continue editing in Cards
                </Link>
              </section>
            </div>
          )}
        </section>

        <aside className="mock-prompt-sidebar">
          <section className="mock-sidebar-panel">
            <h2>Evaluation</h2>
            <div className="mock-evaluation-badge">
              <div className="mock-evaluation-icon">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <strong>{primaryResult.replace(/_/g, " ")}</strong>
              <span>Derived UI-local outcome</span>
            </div>

            <div className="mock-score-band">
              <div>
                <p className="mock-sidebar-kicker">Observed result</p>
                <strong>{context.observed_result}</strong>
              </div>
              <div>
                <p className="mock-sidebar-kicker">Observed path</p>
                <strong>{context.observed_path}</strong>
              </div>
            </div>
          </section>

          <section className="mock-sidebar-panel">
            <p className="mock-sidebar-kicker">Service result classes</p>
            <div className="mock-score-grid">
              {context.supported_result_classes.map((item) => (
                <div key={item} className="mock-score-tile">
                  <span>{item.replace(/_/g, " ")}</span>
                  <StatusPill tone={resultTone(item)}>{item}</StatusPill>
                </div>
              ))}
            </div>
          </section>

          <section className="mock-quote-panel">
            <p>{context.status_note} The derived variant shown here is extension-local and does not imply host deployment or save truth.</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
