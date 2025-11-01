/* eslint-env browser */

// @ts-check
/** @typedef {import("partykit/server").Room} Room */
/** @typedef {import("partykit/server").Server} Server */
/** @typedef {import("partykit/server").Connection} Connection */
/** @typedef {import("partykit/server").ConnectionContext} ConnectionContext */

/**
 * @implements {Server}
 */
class PartyServer {
  /**
   * @param {Room} room
   */
  constructor(room) {
    this.room = room;
    this.devices = new Map(); // Store connected devices
  }

  /**
   * @param {Connection} conn
   * @param {ConnectionContext} ctx
   */
  onConnect(conn, ctx) {
    const origin = ctx.request.headers.get("origin");


    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // Send current room state to new connection
    conn.send(
      JSON.stringify({
        type: "connected",
        connectionId: conn.id,
        roomId: this.room.id,
        connectedDevices: Array.from(this.devices.keys()),
      })
    );
  }

  /**
   * @param {string} message
   * @param {Connection} sender
   */
  onMessage(message, sender) {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case "register":
          // Register device type (desktop/mobile)
          this.devices.set(sender.id, {
            deviceType: data.deviceType,
            timestamp: Date.now(),
          });

          // Notify all connections about new device
          this.room.broadcast(
            JSON.stringify({
              type: "device-joined",
              connectionId: sender.id,
              deviceType: data.deviceType,
              connectedDevices: Array.from(this.devices.entries()),
            })
          );
          break;

        case "data":
          // Forward data to all other devices
          this.room.broadcast(
            JSON.stringify({
              type: "data",
              from: sender.id,
              payload: data.payload,
            }),
            [sender.id]
          );
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (e) {
      console.error("Error parsing message:", e);
    }
  }

  /**
   * @param {Connection} conn
   */
  onClose(conn) {
    this.devices.delete(conn.id);

    // Notify remaining connections
    this.room.broadcast(
      JSON.stringify({
        type: "device-left",
        connectionId: conn.id,
        connectedDevices: Array.from(this.devices.entries()),
      })
    );
  }
}

export default PartyServer;
