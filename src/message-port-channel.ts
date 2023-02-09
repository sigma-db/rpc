import { MessagePortReader } from "./message-port-reader";
import { MessagePortWriter } from "./message-port-writer";
import { ClientMethod, ExtractMethod, ServerMethod, Tag } from "./method";

export class MessagePortChannel<R extends ClientMethod, W extends ServerMethod> implements AsyncIterable<R> {
    private readonly inbox: MessagePortReader<R>;
    private readonly outbox: MessagePortWriter<W>;

    constructor(port: MessagePort) {
        this.inbox = MessagePortReader.create(port);
        this.outbox = MessagePortWriter.create(port);
        port.start();
    }

    public async receive<M extends R[Tag]>(tags: M | M[], throwIfDone?: true): Promise<ExtractMethod<R, M>>
    public async receive<M extends R[Tag]>(tags: M | M[], throwIfDone?: false): Promise<ExtractMethod<R, M> | undefined>
    public async receive<M extends R[Tag]>(tags: M | M[], throwIfDone = true): Promise<ExtractMethod<R, M> | undefined> {
        tags = (Array.isArray(tags) ? tags : [tags]);
        const { done, value } = await this.inbox.read(...tags);
        if (!done) {
            return value;
        }
        if (throwIfDone) {
            throw new Error(`The underlying stream reported to be done.`);
        }
        return undefined;
    }

    public async send<M extends W[Tag]>(tag: M, message: Omit<ExtractMethod<W, M>, Tag>): Promise<void> {
        const _message = { tag, ...message } as ExtractMethod<W, M>;    // cf. comment in method.ts :(
        await this.outbox.write(_message);
    }

    public receiveAll<M extends R[Tag]>(...tags: M[]): AsyncIterable<ExtractMethod<R, M>> {
        return {
            [Symbol.asyncIterator]: () => ({
                next: async () => {
                    const { done, value } = await this.inbox.read(...tags);
                    if (!done) {
                        return { done, value };
                    } else {
                        return { done, value: undefined };
                    }
                },
            }),
        };
    }

    public async *[Symbol.asyncIterator](): AsyncIterableIterator<ExtractMethod<R, R[Tag]>> {
        yield* this.receiveAll();
    }
}
