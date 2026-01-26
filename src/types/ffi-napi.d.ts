declare module 'ffi-napi' {
  const ffi: {
    Library: (
      path: string,
      definitions: Record<string, [string, Array<string | object>]>
    ) => Record<string, (...args: any[]) => any>;
  };
  export = ffi;
}

declare module 'ref-napi' {
  const ref: unknown;
  export = ref;
}
