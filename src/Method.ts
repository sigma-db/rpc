const methodName = "@rpc";
export type MethodName = typeof methodName;

interface MethodBase<Name extends string> {
    readonly [methodName]: Name;
}

export interface Method<T = any> extends MethodBase<string> {
    readonly args?: T;
}

export interface ServerMethod<T = any> extends Method<T> {
    readonly transfer?: Transferable[];
}

export interface ClientMethod<T = any> extends Method<T> {
    readonly ports?: readonly MessagePort[];
}

export type ExtractMethod<T extends Method, M extends T[MethodName]> = Extract<T, MethodBase<M>>;

export type Interface<T> = {
    [Method in Extract<keyof T, string>]: T[Method] extends (...args: infer A) => void ? { [methodName]: Method, args: A } : never;
}[Extract<keyof T, string>];

export function assertMethod<T extends Method, M extends T[MethodName]>(value: T, method?: M): asserts value is ExtractMethod<T, M> {
    if (typeof method !== "undefined" && value[methodName] !== method) {
        throw new Error(`Method mismatch: Expected ${method} but got ${value[methodName]}.`);
    }
}

export interface Message<T = any> {
    data: Method<T>;
    transfer: Transferable[];
}
