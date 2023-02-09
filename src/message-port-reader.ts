import { ClientMethod, ExtractMethod, Tag, hasTag } from "./method";

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

    public override async read<U extends T[Tag]>(...tags: U[]): Promise<ReadableStreamReadResult<ExtractMethod<T, U>>> {
        const { done, value } = await super.read();
        if (done) {
            return { done };
        }
        if (hasTag(value, tags)) {
            return { done, value };
        }
        throw new Error(`Tag mismatch: Expected ${tags.length === 1 && "one of"} ${tags.join(", ")}, but got ${value.tag}.`);
    }

    public async *[Symbol.asyncIterator]() {
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
