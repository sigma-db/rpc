import type { ClientMethod, MethodType, ServerMethod } from "./Method";
import { MessagePortReader } from "./MessagePortReader";
import { MessagePortWriter } from "./MessagePortWriter";

export class MessagePortChannel<R extends ClientMethod, W extends ServerMethod> {
    private readonly inbox: MessagePortReader<R>;
    private readonly outbox: MessagePortWriter<W>;

    constructor(port: MessagePort) {
        this.inbox = MessagePortReader.create(port);
        this.outbox = MessagePortWriter.create(port);
    }

    public static create<R extends ClientMethod, W extends ServerMethod>(port: MessagePort): MessagePortChannel<R, W> {
        return new MessagePortChannel(port);
    }

    public async read<M extends R["method"]>(method: M, throwIfDone?: true): Promise<MethodType<R, M>>
    public async read<M extends R["method"]>(method: M, throwIfDone?: false): Promise<MethodType<R, M> | undefined>
    public async read<M extends R["method"]>(method: M, throwIfDone = true): Promise<MethodType<R, M> | undefined> {
        const { done, value } = await this.inbox.read(method);
        if (!done) {
            return value;
        }
        if (throwIfDone) {
            throw new Error(`The underlying stream reported to be done.`);
        }
        return undefined;
    }

    public async write(message: W): Promise<void> {
        await this.outbox.write(message);
    }
}
