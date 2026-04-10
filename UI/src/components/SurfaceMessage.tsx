interface SurfaceMessageProps {
  title: string;
  body: string;
  tone?: "default" | "warning";
}

export function SurfaceMessage({ title, body, tone = "default" }: SurfaceMessageProps) {
  return (
    <section className={`surface-message surface-message-${tone}`}>
      <p className="title-label">Surface</p>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}
