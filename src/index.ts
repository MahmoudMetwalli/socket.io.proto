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
  
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("message", (buffer) => {
    const message = ChatMessage.decode(Buffer.from(buffer));
    console.log("Message received:", message);


  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
