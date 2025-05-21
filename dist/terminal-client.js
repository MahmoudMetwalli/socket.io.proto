"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const readline_1 = __importDefault(require("readline"));
const protobufjs_1 = __importDefault(require("protobufjs"));
const socket = (0, socket_io_client_1.io)("http://localhost:3001", { autoConnect: false });
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});
let ChatMessage;
protobufjs_1.default.load("message.proto").then(root => {
    ChatMessage = root.lookupType("ChatMessage");
    socket.connect();
}).catch(err => {
    console.error("Failed to load protobuf schema:", err);
    process.exit(1);
});
socket.on("connect", () => {
    console.log(`\x1b[32m✓ Connected to server. Socket ID: ${socket.id}\x1b[0m`);
    promptUser();
});
socket.on("message", (buffer) => {
    const data = ChatMessage.decode(Buffer.from(buffer));
    readline_1.default.clearLine(process.stdout, 0);
    readline_1.default.cursorTo(process.stdout, 0);
    if (data.socketId !== socket.id) {
        const sender = data.sender || data.socketId || "Unknown";
        console.log(`\x1b[34m${sender}:\x1b[0m ${data.text}`);
    }
    rl.prompt(true);
});
function promptUser() {
    rl.question("\x1b[33m> \x1b[0m", (input) => {
        if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
            console.log("Closing connection and exiting...");
            socket.disconnect();
            rl.close();
            process.exit(0);
        }
        else if (input.trim()) {
            const messageData = {
                text: input,
                sender: `Terminal Client (${socket.id ? socket.id.substring(0, 6) : 'unknown'})`,
                socketId: socket.id,
                timestamp: new Date().toISOString(),
            };
            const errMsg = ChatMessage.verify(messageData);
            if (errMsg) {
                console.error("Invalid message:", errMsg);
                promptUser();
                return;
            }
            const message = ChatMessage.create(messageData);
            const buffer = ChatMessage.encode(message).finish();
            socket.emit("message", buffer);
        }
        promptUser();
    });
}
rl.on("SIGINT", () => {
    console.log("\nClosing connection and exiting...");
    socket.disconnect();
    rl.close();
    process.exit(0);
});
console.log("Socket.io Terminal Client");
console.log("Type your message and press Enter to send");
console.log("Type 'exit' or 'quit' to disconnect and exit");
