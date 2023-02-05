import { ClientMethod, Interface, ExtractMethod, ServerMethod, MethodName } from "./method";
import { MessagePortReader } from "./message-port-reader";
import { MessagePortWriter } from "./message-port-writer";

type WriteInterface<T> = {
    [Method in Extract<keyof T, string>]: T[Method] extends (...args: infer A) => void ? (...args: A) => Promise<void> : never;
};

type ReadInterface<T> = {
    [Method in Extract<keyof T, string>]: T[Method] extends (...args: infer A) => void ? () => Promise<A[0]> : never;
};

interface ChannelInterfaceClient<R, W> {
    self: ReadInterface<R>;
    server: WriteInterface<W>;
}

interface ChannelInterfaceServer<R, W> {
    self: ReadInterface<W>;
    client: WriteInterface<R>;
}

export class MessagePortChannel<R extends ClientMethod, W extends ServerMethod> {
    private readonly inbox: MessagePortReader<R>;
    private readonly outbox: MessagePortWriter<W>;

    private constructor(port: MessagePort) {
        this.inbox = MessagePortReader.create(port);
        this.outbox = MessagePortWriter.create(port);
        port.start();
    }

    public static forClient<R, W>(port: MessagePort): ChannelInterfaceClient<R, W> {
        const channel = new MessagePortChannel<Interface<R>, Interface<W>>(port);

        const self = new Proxy<ReadInterface<R>>({} as ReadInterface<R>, {
            get(_target, p: Interface<R>[MethodName]) {
                return async () => {
                    return channel.receive(p);
                };
            },
        });

        const server = new Proxy<WriteInterface<W>>({} as WriteInterface<W>, {
            get<M extends Interface<W>[MethodName]>(_target: any, p: M) {
                return async (...args: ExtractMethod<Interface<W>, M>["args"]) => {
                    channel.send({ "@rpc": p, args } as any)
                };
            },
        });

        return { self, server };
    }

    public static forServer<R, W>(port: MessagePort): ChannelInterfaceServer<R, W> {
        const { server: client, self } = MessagePortChannel.forClient<W, R>(port);
        return { client, self };
    }

    public async receive<M extends R[MethodName]>(method: M, throwIfDone?: true): Promise<ExtractMethod<R, M>>
    public async receive<M extends R[MethodName]>(method: M, throwIfDone?: false): Promise<ExtractMethod<R, M> | undefined>
    public async receive<M extends R[MethodName]>(method: M, throwIfDone = true): Promise<ExtractMethod<R, M> | undefined> {
        const { done, value } = await this.inbox.read(method);
        if (!done) {
            return value;
        }
        if (throwIfDone) {
            throw new Error(`The underlying stream reported to be done.`);
        }
        return undefined;
    }

    public async send(message: W): Promise<void> {
        await this.outbox.write(message);
    }
}
