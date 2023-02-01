import type { ServerMethod } from "./Method";

interface Message<T = any> {
    data: {
        method: string;
        args?: T;
    };
    transfer: Transferable[];
}

export class MessagePortWritableStream<T extends ServerMethod> extends WritableStream<Message<T>> {
    constructor(port: MessagePort) {
        super({
            write({ data, transfer }) {
                port.postMessage(data, { transfer });
            },
        });
    }
}

export class MessagePortWriter<T extends ServerMethod> extends WritableStreamDefaultWriter<T> {
    private constructor(stream: WritableStream<T>) {
        super(stream);
    }

    public static create<T extends ServerMethod>(port: MessagePort): MessagePortWriter<T> {
        const { readable, writable } = new MessageStream<T>();
        readable.pipeTo(new MessagePortWritableStream<T>(port));
        return new MessagePortWriter(writable);
    }

    public override async write(message: T): Promise<void> {
        await super.write(message);
    }
}

class MessageStream<T extends ServerMethod> extends TransformStream<T, Message<T>> {
    constructor() {
        super({
            transform({ transfer = [], ...data }: T, controller) {
                controller.enqueue({ data, transfer });
            },
        });
    }
}
