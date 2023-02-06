import { MessagePortChannel } from "./message-port-channel";
import { ExtractMethod, MethodName } from "./method";

type Invert<T> =
    T extends (...args: infer A) => Promise<infer R> ? R extends void ? () => Promise<A> : (args: R) => Promise<A> : never;

type EventHandler<T> = {
    [Method in keyof T & string]: Invert<T[Method]>;
};

type Interface<T> = {
    [Method in keyof T & string]: T[Method] extends (...args: infer A) => unknown ? { "@rpc": Method, args: A } : never;
}[keyof T & string];

export class Channel<R, W> {
    readonly #event: R;
    readonly #remote: W;

    private constructor(event: R, remote: W) {
        this.#event = event;
        this.#remote = remote;
    }

    public static create<R extends object, W extends object>(port: MessagePort): Channel<EventHandler<R>, W> {
        const channel = new MessagePortChannel<Interface<R>, Interface<W>>(port);

        const event = new Proxy({} as EventHandler<R>, {
            get<M extends Interface<R>[MethodName]>(_target: any, method: M) {
                return async (): Promise<ExtractMethod<Interface<R>, M>["args"]> => {
                    return await channel.receive(method).then(({ args }) => args);
                };
            },
        });

        const remote = new Proxy({} as W, {
            get<M extends Interface<W>[MethodName]>(_target: any, method: M) {
                return async (...args: ExtractMethod<Interface<W>, M>["args"]) => {
                    await channel.send({ "@rpc": method, args } as any);
                };
            },
        });

        return new Channel(event, remote);
    }

    public get event() {
        return this.#event;
    }

    public get remote() {
        return this.#remote;
    }
}
