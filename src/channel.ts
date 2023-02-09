import { MessagePortChannel } from "./message-port-channel";
import { ExtractMethod, Interface, Tag } from "./method";

type Args<T> = T extends void ? [] : T extends unknown[] ? T : [arg: T];
type Return<T extends unknown[]> = T extends [] ? void : T;
type Inverse<T> = T extends (...args: infer A) => Promise<infer R> ? (...args: Args<R>) => Promise<Return<A>> : never;

type EventHandler<T> = {
    [Method in keyof T]: Inverse<T[Method]>;
};

export class Channel<R, W> {
    readonly #event: R;
    readonly #remote: W;

    private constructor(event: R, remote: W) {
        this.#event = event;
        this.#remote = remote;
    }

    public static create<R extends object, W extends object>(port: MessagePort): Channel<EventHandler<R>, W> {
        type _R = Interface<R>;
        type _W = Interface<W>;

        const channel = new MessagePortChannel<_R, _W>(port);

        const event = new Proxy({} as EventHandler<R>, {
            get<M extends _R[Tag]>(_target: any, tag: M) {
                return async (): Promise<ExtractMethod<_R, M>["args"]> => {
                    return await channel.receive(tag).then(({ args }) => args);
                };
            },
        });

        const remote = new Proxy({} as W, {
            get<M extends _W[Tag]>(_target: any, tag: M) {
                return async (...args: ExtractMethod<_W, M>["args"]) => {
                    await channel.send(tag, { args } as Omit<ExtractMethod<_W, M>, Tag>);
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
