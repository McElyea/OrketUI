import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface JsonViewerProps {
  title: string;
  value: unknown;
}

export function JsonViewer({ title, value }: JsonViewerProps) {
  const rendered = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <section className="viewer-shell viewer-shell-muted">
      <div className="section-heading section-heading-tight">
        <p className="title-label">Inspector</p>
        <h2>{title}</h2>
      </div>
      <CodeMirror
        value={rendered}
        editable={false}
        extensions={[markdown()]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
      />
    </section>
  );
}
