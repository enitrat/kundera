declare module "bun:ffi" {
	export type Pointer = number | bigint;

	export const FFIType: {
		readonly ptr: number;
		readonly i32: number;
		readonly u64: number;
	};

	export function ptr(value: ArrayBufferView): Pointer;

	export function dlopen<T extends Record<string, unknown>>(
		path: string,
		symbols: T,
	): {
		symbols: {
			[K in keyof T]: (...args: unknown[]) => number;
		};
		close(): void;
	};
}
