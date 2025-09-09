import { Server } from "@hocuspocus/server";
import { app } from "./app.js";
import { documentSaver } from "./utils/documentSaver.js";

const PORT = process.env.PORT || 1234;

// Create HocusPocus server
const server = Server.configure({
  port: PORT,

  // Authentication
  async onAuthenticate(data) {
    return {
      user: {
        id: Math.random().toString(36).substr(2, 9),
        name: `User ${Math.floor(Math.random() * 1000)}`,
      },
    };
  },

  // Handle custom save events
  async onStateless(data) {
    await documentSaver.handleSaveEvent(data);
  },

  // Clean up unused handlers
  async onChange(data) {},
  async onConnect(data) {},
  async onDisconnect(data) {},
  async onStoreDocument(data) {},
  async onLoadDocument(data) {
    return null;
  },
});

server.listen().then(() => {
  console.log(
    `🚀 HocusPocus WebSocket server running on ws://localhost:${PORT}`
  );
});
