import { io } from "socket.io-client";
import readline from "readline";
import protobuf from "protobufjs";

// Create a Socket.IO client instance
const socket = io("http://localhost:3001");

// Create readline interface for terminal input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

// Load the protobuf schema
const root = await protobuf.load("message.proto");
const ChatMessage = root.lookupType("ChatMessage");

// Handle connection events
socket.on("connect", () => {
  console.log(`\x1b[32m✓ Connected to server. Socket ID: ${socket.id}\x1b[0m`);
  promptUser();
});

socket.on("disconnect", () => {
  console.log("\x1b[31m✗ Disconnected from server\x1b[0m");
});

// Handle incoming messages
socket.on("message", (buffer) => {
  // Decode the incoming buffer
  const data = ChatMessage.decode(Buffer.from(buffer));
  
  // Clear the current line if we're in the middle of typing
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  
  // Only show messages from others
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
    } else if (input.trim()) {
      // Create a protobuf message
      const messageData = {
        text: input,
        sender: `Terminal Client (${socket.id ? socket.id.substring(0, 6) : 'unknown'})`,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      };

      // Verify and encode the message
      const errMsg = ChatMessage.verify(messageData);
      if (errMsg) {
        console.error("Invalid message:", errMsg);
        promptUser();
        return;
      }
      
      const message = ChatMessage.create(messageData);
      const buffer = ChatMessage.encode(message).finish();
      
      // Send the encoded buffer
      socket.emit("message", buffer);
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