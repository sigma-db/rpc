export interface Method<T = any> {
    method: string;
    args?: T;
}

export interface ServerMethod<T = any> extends Method<T> {
    transfer?: Transferable[];
}

export interface ClientMethod<T = any> extends Method<T> {
    ports?: readonly MessagePort[];
}

export type MethodType<T extends Method, M extends T["method"]> = Extract<T, { method: M }>;

export function assertMethod<T extends Method, M extends T["method"]>(value: T, method?: M): asserts value is MethodType<T, M> {
    if (typeof method !== "undefined" && value.method !== method) {
        throw new Error(`Method mismatch: Expected ${method} but got ${value.method}.`);
    }
}

export type Interface<T> = {
    [Method in keyof T]: T[Method] extends (...args: infer A) => void ? { method: Method, args: A } : never;
}[Extract<keyof T, string>];
