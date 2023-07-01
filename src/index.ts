import { EngineMessage, BinarySection, ClientNetwork, Context } from "nengi";
import { DataViewReader, DataViewWriter } from "nengi-dataviews";
import geckos, { ClientChannel } from "@geckos.io/client";
import { ClientOptions } from "@geckos.io/common/lib/types.js";

export class GeckosClientAdapter {
  channel?: ClientChannel;
  network: ClientNetwork;
  context: Context;

  constructor(network: ClientNetwork) {
    this.network = network;
    this.context = this.network.client.context;
  }

  connect(
    url: string,
    handshake: any,
    geckosOptions: Omit<ClientOptions, "url" | "port"> = {}
  ) {
    return new Promise((resolve, reject) => {
      const { protocol, hostname, port } = new URL(url);
      const channel = geckos({
        url: `${protocol}//${hostname}`,
        port: Number(port),
        ...geckosOptions,
      });

      channel.onConnect(() => {
        channel.raw.emit(
          this.network.createHandshakeBuffer(handshake, DataViewWriter)
        );
      });

      channel.onDisconnect((error) => {
        reject(error);
      });

      // initially the only thing we care to read is a response to our handshake
      // we don't even setup the parser for the rest of what a nengi client can receive
      channel.onRaw((message) => {
        if (message instanceof ArrayBuffer) {
          const dr = new DataViewReader(message, 0);
          const type = dr.readUInt8(); // type of message
          if (type === BinarySection.EngineMessages) {
            const count = dr.readUInt8(); // quantity of engine messages
            const connectionResponseByte = dr.readUInt8();
            if (connectionResponseByte === EngineMessage.ConnectionAccepted) {
              (channel as any).bridge.removeAllListeners();

              // setup listeners for normal game data
              this.setup(channel);
              resolve("accepted");
            } else if (
              connectionResponseByte === EngineMessage.ConnectionDenied
            ) {
              const denyReason = JSON.parse(dr.readString());
              reject(denyReason);
            }
          }
        }
      });
    });
  }

  private setup(channel: ClientChannel) {
    this.channel = channel;

    channel.onRaw((message) => {
      if (message instanceof ArrayBuffer) {
        const dr = new DataViewReader(message, 0);
        this.network.readSnapshot(dr);
      }
    });

    channel.onDisconnect((error) => {
      this.network.onDisconnect(error);
    });
  }

  flush() {
    if (!this.channel) {
      console.log("CANCELED, no channel");
      return;
    }

    const buffer = this.network.createOutboundBuffer(DataViewWriter);
    this.channel.raw.emit(buffer);
  }
}
