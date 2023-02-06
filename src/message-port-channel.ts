import { ClientMethod, ExtractMethod, ServerMethod, MethodName } from "./method";
import { MessagePortReader } from "./message-port-reader";
import { MessagePortWriter } from "./message-port-writer";

export class MessagePortChannel<R extends ClientMethod, W extends ServerMethod> {
    private readonly inbox: MessagePortReader<R>;
    private readonly outbox: MessagePortWriter<W>;

    constructor(port: MessagePort) {
        this.inbox = MessagePortReader.create(port);
        this.outbox = MessagePortWriter.create(port);
        port.start();
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
