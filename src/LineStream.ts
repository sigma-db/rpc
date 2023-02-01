export class LineStream extends TransformStream<string, string> {
    constructor() {
        super({
            transform(chunk, controller) {
                chunk.split("\n").forEach(line => controller.enqueue(line));
            },
        });
    }
}
