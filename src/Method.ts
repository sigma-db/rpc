const TAG = "@rpc"; // this constant's value should not occur *anywhere* outside this file

export type Tag = typeof TAG;

export interface Method<T = any> {
    readonly [TAG]: string;
    readonly args?: T;
}

export interface ServerMethod<T = any> extends Method<T> {
    readonly transfer?: Transferable[];
}

export interface ClientMethod<T = any> extends Method<T> {
    readonly ports?: readonly MessagePort[];
}

export type ExtractMethod<T extends Method, M extends T[Tag]> = M extends never ? T : Extract<T, { readonly [TAG]: M }>;

export function hasTag<T extends Method<unknown>, M extends Array<T[Tag]>>(value: T, tags: M): value is ExtractMethod<T, M[number]> {
    return tags.length === 0 || tags.includes(value[TAG]);
}

export function getTag<T extends Method<unknown>>(message: T): T[Tag] {
    return message[TAG];
}

export interface Message<T = any> {
    data: Method<T>;
    transfer: Transferable[];
}

export type Interface<T> = {
    [M in keyof T]: T[M] extends (...args: infer A) => Promise<void> ? { [TAG]: M, args: A } : never;
}[keyof T & string];
