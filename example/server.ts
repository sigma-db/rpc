import { Channel } from "../src";
import { Client, Server } from "./interface";

export async function startServer(port: MessagePort) {
    const { event: self, remote } = Channel.create<Server, Client>(port);

    while (true) {
        const [word] = await self.checkPalindrome();

        const forwards = word.toLowerCase();
        const backwards = [...forwards].reverse().join("");

        remote.result(forwards === backwards);
    }
}
