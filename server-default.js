import { Server } from "socket.io";
import { initReporting } from "./reporting.js";
import { createServer } from "http";
import { instrument } from "@socket.io/admin-ui";
import { createAdapter } from "@socket.io/postgres-adapter";
import pg from "pg";

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

if (process.env.PG_HOST) {
  const pool = new pg.Pool({
    user: process.env.PG_USER || "postgres",
    host: process.env.PG_HOST || "localhost",
    database: process.env.PG_DB || "postgres",
    password: process.env.PG_PASSWORD || "postgres",
    port: process.env.PG_PORT || 5432,
  });

  pool.query(`
  CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
  );
`);

  io.adapter(createAdapter(pool));
}

initReporting(io);
io.on("connection", (socket) => {
  //console.log({ socket });
  socket.on("ping", (cb) => {
    cb("pong");
  });

  socket.on("disconnect", (reason) => {
    console.log({ reason });
    const lastToDisconnect = io.sockets.sockets.size === 0;
    if (lastToDisconnect) {
      gc();
    }
  });
});
httpServer.listen(PORT);
