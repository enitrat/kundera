const normalize = (value: string): string => value.replace(/\\/gu, '/');

export const join = (...segments: ReadonlyArray<string>): string =>
  normalize(
    segments
      .filter((segment) => segment.length > 0)
      .join('/')
      .replace(/\/+/gu, '/'),
  );

export const dirname = (value: string): string => {
  const normalized = normalize(value);
  const withoutQuery = normalized.split('?')[0] ?? normalized;
  const index = withoutQuery.lastIndexOf('/');

  if (index <= 0) {
    return '.';
  }

  return withoutQuery.slice(0, index);
};
