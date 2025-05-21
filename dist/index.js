"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const protobufjs_1 = __importDefault(require("protobufjs"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
let ChatMessage;
protobufjs_1.default.load("message.proto").then((root) => {
    ChatMessage = root.lookupType("ChatMessage");
    // Server setup now moved outside this callback
    console.log("Protocol buffer loaded successfully");
}).catch(err => {
    console.error("Failed to load protocol buffer:", err);
});
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("message", (buffer) => {
        if (!ChatMessage) {
            console.error("Chat message type not loaded yet");
            return;
        }
        try {
            console.log("Message received:", buffer);
            const message = ChatMessage.decode(Buffer.from(buffer));
            console.log("Decoded message:", message);
            // Forward the message to all clients
            io.emit("message", buffer);
        }
        catch (error) {
            console.error("Error decoding message:", error);
        }
    });
});
// Only call listen once
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
