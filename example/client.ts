import { MessagePortChannel } from "../src";
import { ClientInterface, ServerInterface } from "./interface";

export async function startClient(port: MessagePort) {
    const { self, server } = MessagePortChannel.forClient<ClientInterface, ServerInterface>(port);

    server.run(false);
    const result1 = await self.result();
    console.log(result1);

    server.run(true);
    const result2 = await self.result();
    console.log(result2);
}
