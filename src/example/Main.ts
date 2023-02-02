import { startClient } from "./Client";
import { startServer } from "./Server";

const { port1, port2 } = new MessageChannel();

startClient(port1);
startServer(port2);
