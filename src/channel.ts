import { MessagePortChannel } from "./message-port-channel";
import { ExtractMethod, Tag } from "./method";

type Invert<T> =
    T extends (...args: infer A) => Promise<infer R> ? R extends void ? () => Promise<A> : (args: R) => Promise<A> : never;

type EventHandler<T> = {
    [Method in keyof T & string as Method | `on${Capitalize<Method>}`]: Invert<T[Method]>;
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
            get<M extends Interface<R>[Tag]>(_target: any, tag: M) {
                return async (): Promise<ExtractMethod<Interface<R>, M>["args"]> => {
                    return await channel.receive(tag).then(({ args }) => args);
                };
            },
        });

        const remote = new Proxy({} as W, {
            get<M extends Interface<W>[Tag]>(_target: any, tag: M) {
                return async (message: Omit<ExtractMethod<Interface<W>, M>, Tag>) => {
                    await channel.send(tag, message);
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
