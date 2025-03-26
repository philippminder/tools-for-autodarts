import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: [ "GET", "POST" ],
    credentials: true,
    allowedHeaders: [ "*" ],
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
});

const PORT = process.env.PORT || 4455;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
