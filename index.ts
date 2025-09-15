// Manual Protobuf Decoder - ไม่ใช้ schema auto generation
// ตรงกับ schema ที่ถูกต้อง: master.Server และ master.ServerData

interface Player {
  name?: string;
  identifiers?: string[];
  endpoint?: string;
  ping?: number;
  id?: number;
}

interface ServerData {
  svMaxclients?: number;      // field 1
  clients?: number;           // field 2  
  protocol?: number;          // field 3
  hostname?: string;          // field 4
  gametype?: string;          // field 5
  mapname?: string;           // field 6
  resources?: string[];       // field 8
  server?: string;            // field 9
  players?: Player[];         // field 10
  iconVersion?: number;       // field 11
  vars?: { [key: string]: string }; // field 12 (map<string,string>)
  enhancedHostSupport?: boolean; // field 16
  upvotePower?: number;       // field 17
  connectEndPoints?: string[]; // field 18
  burstPower?: number;        // field 19
}

interface ServerInfo {
  EndPoint?: string;          // field 1
  Data?: ServerData;          // field 2
}

class ProtobufDecoder {
  private buffer: Uint8Array;
  private position: number = 0;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
  }

  readVarint(): number {
    let result = 0;
    let shift = 0;
    
    while (this.position < this.buffer.length) {
      const byte = this.buffer[this.position++];
      result |= (byte & 0x7F) << shift;
      
      if ((byte & 0x80) === 0) {
        break;
      }
      shift += 7;
    }
    
    return result >>> 0; // Convert to unsigned 32-bit
  }

  readBigVarint(): bigint {
    let result = 0n;
    let shift = 0n;
    
    while (this.position < this.buffer.length) {
      const byte = BigInt(this.buffer[this.position++]);
      result |= (byte & 0x7Fn) << shift;
      
      if ((byte & 0x80n) === 0n) {
        break;
      }
      shift += 7n;
    }
    
    return result;
  }

  readString(): string {
    const length = this.readVarint();
    const bytes = this.buffer.slice(this.position, this.position + length);
    this.position += length;
    return new TextDecoder().decode(bytes);
  }

  readBytes(): Uint8Array {
    const length = this.readVarint();
    const bytes = this.buffer.slice(this.position, this.position + length);
    this.position += length;
    return bytes;
  }

  readBool(): boolean {
    return this.readVarint() !== 0;
  }

  decodePlayer(buffer: Uint8Array): Player {
    const decoder = new ProtobufDecoder(buffer);
    const player: Player = {};

    while (decoder.position < decoder.buffer.length) {
      const tag = decoder.readVarint();
      const fieldNumber = tag >> 3;

      switch (fieldNumber) {
        case 1: // name
          player.name = decoder.readString();
          break;
        case 2: // identifiers (repeated)
          if (!player.identifiers) player.identifiers = [];
          player.identifiers.push(decoder.readString());
          break;
        case 3: // endpoint
          player.endpoint = decoder.readString();
          break;
        case 4: // ping
          player.ping = decoder.readVarint();
          break;
        case 5: // id
          player.id = decoder.readVarint();
          break;
        default:
          // Skip unknown fields
          const wireType = tag & 0x7;
          if (wireType === 0) {
            decoder.readVarint();
          } else if (wireType === 2) {
            decoder.readBytes();
          }
          break;
      }
    }

    return player;
  }

  decodeServerData(buffer: Uint8Array): ServerData {
    const decoder = new ProtobufDecoder(buffer);
    const data: ServerData = {};

    while (decoder.position < decoder.buffer.length) {
      const tag = decoder.readVarint();
      const fieldNumber = tag >> 3;
      const wireType = tag & 0x7;

      switch (fieldNumber) {
        case 1: // svMaxclients
          data.svMaxclients = decoder.readVarint();
          break;
        case 2: // clients
          data.clients = decoder.readVarint();
          break;
        case 3: // protocol
          data.protocol = decoder.readVarint();
          break;
        case 4: // hostname
          data.hostname = decoder.readString();
          break;
        case 5: // gametype
          data.gametype = decoder.readString();
          break;
        case 6: // mapname
          data.mapname = decoder.readString();
          break;
        case 8: // resources (repeated string)
          if (!data.resources) data.resources = [];
          data.resources.push(decoder.readString());
          break;
        case 9: // server
          data.server = decoder.readString();
          break;
        case 10: // players (repeated Player)
          const playerBytes = decoder.readBytes();
          if (!data.players) data.players = [];
          data.players.push(decoder.decodePlayer(playerBytes));
          break;
        case 11: // iconVersion
          data.iconVersion = decoder.readVarint();
          break;
        case 12: // vars (map<string,string>)
          const varBytes = decoder.readBytes();
          const varDecoder = new ProtobufDecoder(varBytes);
          let key = '';
          let value = '';
          
          while (varDecoder.position < varDecoder.buffer.length) {
            const varTag = varDecoder.readVarint();
            const varField = varTag >> 3;
            
            if (varField === 1) {
              key = varDecoder.readString();
            } else if (varField === 2) {
              value = varDecoder.readString();
            }
          }
          
          if (!data.vars) data.vars = {};
          data.vars[key] = value;
          break;
        case 16: // enhancedHostSupport
          data.enhancedHostSupport = decoder.readBool();
          break;
        case 17: // upvotePower
          data.upvotePower = decoder.readVarint();
          break;
        case 18: // connectEndPoints (repeated string)
          if (!data.connectEndPoints) data.connectEndPoints = [];
          data.connectEndPoints.push(decoder.readString());
          break;
        case 19: // burstPower
          data.burstPower = decoder.readVarint();
          break;
        default:
          // Skip unknown fields
          if (wireType === 0) {
            decoder.readVarint();
          } else if (wireType === 2) {
            decoder.readBytes();
          }
          break;
      }
    }

    return data;
  }

  decodeServerInfo(buffer: Uint8Array): ServerInfo {
    const decoder = new ProtobufDecoder(buffer);
    const info: ServerInfo = {};

    while (decoder.position < decoder.buffer.length) {
      const tag = decoder.readVarint();
      const fieldNumber = tag >> 3;

      switch (fieldNumber) {
        case 1: // EndPoint
          info.EndPoint = decoder.readString();
          break;
        case 2: // Data
          const dataBytes = decoder.readBytes();
          info.Data = decoder.decodeServerData(dataBytes);
          break;
        default:
          // Skip unknown fields
          decoder.readBytes();
          break;
      }
    }

    return info;
  }
}

async function main() {
  const decoder = new ProtobufDecoder(new Uint8Array(0)); // Will create new instances for each frame

  const url = `https://servers-frontend.fivem.net/api/servers/stream/${Math.floor(Date.now() / 1000) - 300}/`;

  const res = await fetch(url, { redirect: "follow" });

  if (!res.body) {
    console.error("No stream body");
    return;
  }
  const reader = new FrameReader(
    res.body, 
    (frame) => {
      try {
        const frameDecoder = new ProtobufDecoder(frame);
        const serverInfo = frameDecoder.decodeServerInfo(frame);
        
        if (serverInfo.Data) {
          console.log("ServerInfo:", serverInfo);
        }
        
      } catch (e) {
        console.error("Manual decode error:", e);
        // console.log("Raw frame:", frame.slice(0, 50)); // แสดง 50 bytes แรก
      }
    },
    () => {
      console.log("Stream ended. Total processed:");
    }
  );

  reader.read();
}

export class FrameReader {
  protected reader: ReadableStreamDefaultReader<Uint8Array>;
  protected lastArray: Uint8Array | null = null;
  protected frameLength = -1;
  protected framePos = 0;

  constructor(
    protected stream: ReadableStream<Uint8Array>,
    protected onFrame: (frame: Uint8Array) => void,
    protected onEnd: () => void,
  ) {
    this.reader = this.stream.getReader();
  }

  public read() {
    this.doRead();
  }

  private async doRead() {
    const { done, value } = await this.reader.read();

    if (done || !value) {
      return this.onEnd();
    }

    let array: Uint8Array = value;

    while (array.length > 0) {
      const start = 4;

      if (this.lastArray) {
        const newArray = new Uint8Array(array.length + this.lastArray.length);
        newArray.set(this.lastArray);
        newArray.set(array, this.lastArray.length);
        this.lastArray = null;
        array = newArray;
      }

      if (this.frameLength < 0) {
        if (array.length < 4) {
          this.lastArray = array;
          this.doRead();
          return;
        }

        this.frameLength =
          array[0] |
          (array[1] << 8) |
          (array[2] << 16) |
          (array[3] << 24);

        // if (this.frameLength > 65535) {
        //   throw new Error("A too large frame was passed.");
        // }
      }

      const end = 4 + this.frameLength - this.framePos;

      if (array.length < end) {
        this.lastArray = array;
        this.doRead();
        return;
      }

      const frame = softSlice(array, start, end);
      this.framePos += end - start;

      if (this.framePos === this.frameLength) {
        this.frameLength = -1;
        this.framePos = 0;
      }

      this.onFrame(frame);

      if (array.length > end) {
        array = softSlice(array, end);
      } else {
        this.doRead();
        return;
      }
    }
  }
}


function softSlice(arr: Uint8Array, start: number, end?: number): Uint8Array {
  return new Uint8Array(arr.buffer, arr.byteOffset + start, end && end - start);
}

main().catch(console.error);
