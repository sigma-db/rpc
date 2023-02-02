import { MessagePortChannel } from "../MessagePortChannel";
import { ClientInterface, ServerInterface } from "./Interface";

export async function startClient(port: MessagePort) {
    const channel = MessagePortChannel.createClient<ClientInterface, ServerInterface>(port);

    await channel.write({ method: "run", args: [false] });
    const { args: [result1] } = await channel.read("result");
    console.log(result1);

    await channel.write({ method: "run", args: [true] });
    const { args: [result2] } = await channel.read("result");
    console.log(result2);
}
