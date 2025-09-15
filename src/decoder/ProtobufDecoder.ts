import type { Player, ServerData, ServerInfo } from '../types/index.js';

export class ProtobufDecoder {
  private buffer: Uint8Array;
  private position: number = 0;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.position = 0;
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
    
    return result >>> 0;
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
      const wireType = tag & 0x7;

      switch (fieldNumber) {
        case 1:
          player.name = decoder.readString();
          break;
        case 2:
          if (!player.identifiers) player.identifiers = [];
          player.identifiers.push(decoder.readString());
          break;
        case 3:
          player.endpoint = decoder.readString();
          break;
        case 4:
          player.ping = decoder.readVarint();
          break;
        case 5:
          player.id = decoder.readVarint();
          break;
        default:
          this.skipField(decoder, wireType);
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
        case 1:
          data.svMaxclients = decoder.readVarint();
          break;
        case 2:
          data.clients = decoder.readVarint();
          break;
        case 3:
          data.protocol = decoder.readVarint();
          break;
        case 4:
          data.hostname = decoder.readString();
          break;
        case 5:
          data.gametype = decoder.readString();
          break;
        case 6:
          data.mapname = decoder.readString();
          break;
        case 8:
          if (!data.resources) data.resources = [];
          data.resources.push(decoder.readString());
          break;
        case 9:
          data.server = decoder.readString();
          break;
        case 10:
          const playerBytes = decoder.readBytes();
          if (!data.players) data.players = [];
          data.players.push(decoder.decodePlayer(playerBytes));
          break;
        case 11:
          data.iconVersion = decoder.readVarint();
          break;
        case 12:
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
        case 16:
          data.enhancedHostSupport = decoder.readBool();
          break;
        case 17:
          data.upvotePower = decoder.readVarint();
          break;
        case 18:
          if (!data.connectEndPoints) data.connectEndPoints = [];
          data.connectEndPoints.push(decoder.readString());
          break;
        case 19:
          data.burstPower = decoder.readVarint();
          break;
        default:
          this.skipField(decoder, wireType);
          break;
      }
    }

    // Set default values for missing fields
    if (data.clients === undefined) {
      data.clients = 0;
    }
    if (data.svMaxclients === undefined) {
      data.svMaxclients = 0;
    }

    return data;
  }

  decodeServerInfo(buffer: Uint8Array): ServerInfo {
    const decoder = new ProtobufDecoder(buffer);
    const info: ServerInfo = {};

    while (decoder.position < decoder.buffer.length) {
      const tag = decoder.readVarint();
      const fieldNumber = tag >> 3;
      const wireType = tag & 0x7;

      switch (fieldNumber) {
        case 1:
          info.EndPoint = decoder.readString();
          break;
        case 2:
          const dataBytes = decoder.readBytes();
          info.Data = decoder.decodeServerData(dataBytes);
          break;
        default:
          this.skipField(decoder, wireType);
          break;
      }
    }

    return info;
  }

  private skipField(decoder: ProtobufDecoder, wireType: number): void {
    switch (wireType) {
      case 0:
        decoder.readVarint();
        break;
      case 2:
        decoder.readBytes();
        break;
      case 1:
        decoder.position += 8;
        break;
      case 5:
        decoder.position += 4;
        break;
      default:
        throw new Error(`Unknown wire type: ${wireType}`);
    }
  }
}