export const existsSync = (_path: string): boolean => false;

export const readFileSync = (
  _path: string,
): never => {
  throw new Error('Filesystem access is unavailable in browser runtime.');
};
