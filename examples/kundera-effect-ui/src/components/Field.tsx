import type { ReactNode } from 'react';

interface FieldProps {
  readonly label: string;
  readonly children: ReactNode;
  readonly mono?: boolean;
  readonly large?: boolean;
}

/**
 * Labeled field display. Replaces repeated div.field > span.label + span.value markup.
 */
export function Field({ label, children, mono, large }: FieldProps) {
  const cls = large ? 'value large' : 'value';
  const Tag = mono ? 'code' : 'span';

  return (
    <div className="field">
      <span className="label">{label}</span>
      <Tag className={cls}>{children}</Tag>
    </div>
  );
}
