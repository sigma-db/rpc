import { ClientMethod, Interface, MethodType, ServerMethod } from "./method";
import { MessagePortReader } from "./message-port-reader";
import { MessagePortWriter } from "./message-port-writer";

export class MessagePortChannel<R extends ClientMethod, W extends ServerMethod> {
    private readonly inbox: MessagePortReader<R>;
    private readonly outbox: MessagePortWriter<W>;

    private constructor(port: MessagePort) {
        this.inbox = MessagePortReader.create(port);
        this.outbox = MessagePortWriter.create(port);
        port.start();
    }

    public static createClient<R, W>(port: MessagePort): MessagePortChannel<Interface<R>, Interface<W>> {
        return new MessagePortChannel(port);
    }

    public static createServer<R, W>(port: MessagePort): MessagePortChannel<Interface<W>, Interface<R>> {
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
