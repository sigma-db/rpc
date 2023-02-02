import { assertMethod, ClientMethod, MethodType } from "./method";

export class MessagePortReadableStream<T> extends ReadableStream<MessageEvent<T>> {
    constructor(port: MessagePort) {
        super({
            start(controller) {
                port.onmessage = (event: MessageEvent<T>) => {
                    controller.enqueue(event);
                };
            },
        });
    }
}

export class MessagePortReader<T extends ClientMethod> extends ReadableStreamDefaultReader<T> implements AsyncIterable<T> {
    constructor(stream: ReadableStream<T>) {
        super(stream);
    }

    public static create<T extends ClientMethod>(port: MessagePort): MessagePortReader<T> {
        const stream = new MessagePortReadableStream<T>(port).pipeThrough(new MessageStream());
        return new MessagePortReader(stream);
    }

    public override async read<M extends T["method"]>(method?: M): Promise<ReadableStreamReadResult<MethodType<T, M>>> {
        const { done, value } = await super.read();
        if (done) {
            return { done };
        }
        assertMethod(value, method);
        return { done, value };
    }

    public override async *[Symbol.asyncIterator]() {
        while (true) {
            const { value, done } = await this.read();
            if (done) {
                break;
            }
            yield value;
        }
    }
}

class MessageStream<T extends ClientMethod> extends TransformStream<MessageEvent<T>, T> {
    constructor() {
        super({
            transform({ data, ports }, controller) {
                controller.enqueue({ ...data, ports });
            },
        });
    }
}
