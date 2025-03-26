import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now - you might want to restrict this in production
    methods: [ "GET", "POST" ],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id, "from origin:", socket.handshake.headers.origin || "unknown");

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("ping", () => {
    console.log("Received ping from:", socket.id);
    socket.emit("pong", { timestamp: Date.now() });
  });

  // Handle custom events here
  socket.on("message", (data) => {
    console.log("Received message:", data);
    // Broadcast the message to all connected clients
    io.emit("message", data);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
