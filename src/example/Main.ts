import { startClient } from "./client";
import { startServer } from "./server";

const { port1, port2 } = new MessageChannel();

startClient(port1);
startServer(port2);
