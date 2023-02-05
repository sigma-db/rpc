import { MessagePortChannel } from "../src";
import { ClientInterface, ServerInterface } from "./interface";

export async function startServer(port: MessagePort) {
    const { self, client } = MessagePortChannel.forServer<ClientInterface, ServerInterface>(port);

    const value1 = await self.run();
    client.result(value1 ? "success" : "failure");

    const value2 = await self.run();
    client.result(value2 ? "success" : "failure");
}
