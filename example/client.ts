import { Channel } from "../src";
import { Client, Server } from "./interface";

export async function startClient(port: MessagePort) {
    const { event, remote } = Channel.create<Client, Server>(port);

    let words = ["Reliefpfeiler", "Insomnia"];

    for (const word of words) {
        remote.checkPalindrome(word);
        const [result] = await event.result();
        console.log(`"${word}" ${result ? "is" : "isn't"} a palindrome.`);
    }
}
