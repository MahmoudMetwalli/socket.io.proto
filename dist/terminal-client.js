"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
const readline_1 = __importDefault(require("readline"));
// Create a Socket.io client instance
const socket = (0, socket_io_client_1.io)("http://localhost:3001");
// Create readline interface for terminal input
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});
// Handle connection events
socket.on("connect", () => {
    console.log(`\x1b[32m✓ Connected to server. Socket ID: ${socket.id}\x1b[0m`);
    promptUser();
});
socket.on("disconnect", () => {
    console.log("\x1b[31m✗ Disconnected from server\x1b[0m");
});
// Handle incoming messages
socket.on("message", (data) => {
    // Clear the current line if we're in the middle of typing
    readline_1.default.clearLine(process.stdout, 0);
    readline_1.default.cursorTo(process.stdout, 0);
    // Only show messages from others, not our own
    if (data.socketId !== socket.id) {
        const sender = data.sender || data.socketId || "Unknown";
        console.log(`\x1b[34m${sender}:\x1b[0m ${data.text}`);
    }
    // Re-display the prompt
    rl.prompt(true);
});
// Function to prompt user for input
function promptUser() {
    rl.question("\x1b[33m> \x1b[0m", (input) => {
        if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
            console.log("Closing connection and exiting...");
            socket.disconnect();
            rl.close();
            process.exit(0);
        }
        else if (input.trim()) {
            // Send the message
            const messageData = {
                text: input,
                sender: `Terminal Client (${socket.id ? socket.id.substring(0, 6) : 'unknown'})`,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            };
            socket.emit("message", messageData);
        }
        // Continue prompting
        promptUser();
    });
}
// Handle CTRL+C to properly clean up
rl.on("SIGINT", () => {
    console.log("\nClosing connection and exiting...");
    socket.disconnect();
    rl.close();
    process.exit(0);
});
console.log("Socket.io Terminal Client");
console.log("Type your message and press Enter to send");
console.log("Type 'exit' or 'quit' to disconnect and exit");
