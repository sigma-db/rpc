import { MessagePortChannel } from "./MessagePortChannel";

type ConverterClientMethods =
    | { method: "stdio", ports: [stdout: MessagePort, stderr: MessagePort] }
    | { method: "result", args: [success: boolean] };

type ConverterServerMethods =
    | { method: "run", args: [value: boolean] };

function setupServer() {
    const { port1, port2 } = new MessageChannel();
    port2.onmessage = ({ data: { method, args } }) => {
        if (method === "run") {
            const [result] = args;
            port2.postMessage({ method: "result", args: [result] });
            port2.postMessage({ method: "result", args: [result] });
        }
    };
    port2.start();
    return port1;
}

const port = setupServer();
const channel = MessagePortChannel.create<ConverterClientMethods, ConverterServerMethods>(port);

async function client(result: boolean) {
    await channel.write({ method: "run", args: [result] });

    const { args: [success] } = await channel.read("result");
    console.log(success);

    const { args: [success2] } = await channel.read("result");
    console.log(success2);
}

client(false);
