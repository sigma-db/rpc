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

export type ExtractMethod<T extends Method, M extends T[Tag]> = Extract<T, { readonly [TAG]: M }>;

export type ExtractMethod2<T extends Method, M extends T[Tag]> = [M, Omit<ExtractMethod<T, M>, Tag>];

export function assertTag<T extends Method, M extends T[Tag]>(value: T, tag?: M): asserts value is ExtractMethod<T, M> {
    if (typeof tag !== "undefined" && value[TAG] !== tag) {
        throw new Error(`Method mismatch: Expected ${tag} but got ${value[TAG]}.`);
    }
}

export interface Message<T = any> {
    data: Method<T>;
    transfer: Transferable[];
}
