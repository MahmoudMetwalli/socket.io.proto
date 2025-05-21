import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import protobuf from "protobufjs";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

let ChatMessage: any;
protobuf.load("message.proto").then((root) => {
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
    } catch (error) {
      console.error("Error decoding message:", error);
    }
  });
});

// Only call listen once
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
