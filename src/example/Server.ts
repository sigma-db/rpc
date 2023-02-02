import { MessagePortChannel } from "../message-port-channel";
import { ClientInterface, ServerInterface } from "./interface";

export async function startServer(port: MessagePort) {
    const channel = MessagePortChannel.createServer<ClientInterface, ServerInterface>(port);

    const { args: [value1] } = await channel.read("run");
    channel.write({ method: "result", args: [value1 ? "success" : "failure"] });

    const { args: [value2] } = await channel.read("run");
    channel.write({ method: "result", args: [value2 ? "success" : "failure"] });
}
