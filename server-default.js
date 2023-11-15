import { Server } from "socket.io";
import { initReporting } from "./reporting.js";
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";

const PORT = process.env.PORT || 3000;
const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
  mode: "development",
});

initReporting(io);
httpServer.listen(PORT);
io.on("connection", (socket) => {
  socket.on("ping", (cb) => {
    cb("pong");
  });

  socket.on("disconnect", () => {
    const lastToDisconnect = io.sockets.sockets.size === 0;
    if (lastToDisconnect) {
      gc();
    }
  });
});


