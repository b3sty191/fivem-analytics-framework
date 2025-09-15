import type { ServerInfo, FiveMStreamConfig } from '../types/index.js';
import { ProtobufDecoder } from '../decoder/ProtobufDecoder.js';
import { FrameReader } from '../stream/FrameReader.js';

export class FiveMServerStream {
  private frameReader: FrameReader | null = null;
  private decoder = new ProtobufDecoder(new Uint8Array(0));
  private processedCount = 0;
  private isRunning = false;
  private servers: ServerInfo[] = []; // เพิ่มการเก็บข้อมูลเซิร์ฟเวอร์

  constructor(private config: FiveMStreamConfig) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Stream is already running');
    }

    try {
      this.isRunning = true;
      this.processedCount = 0;

      const streamSince = this.config.streamSince || 300;
      const url = `https://servers-frontend.fivem.net/api/servers/stream/${Math.floor(Date.now() / 1000) - streamSince}/`;

      const response = await fetch(url, { 
        redirect: "follow",
        headers: {
          'User-Agent': 'FiveM-ServerList-Client/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      this.frameReader = new FrameReader(
        response.body,
        this.handleFrame.bind(this),
        this.handleEnd.bind(this),
        this.handleError.bind(this)
      );

      this.frameReader.start();

    } catch (error) {
      this.isRunning = false;
      if (this.config.handlers.onError) {
        this.config.handlers.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.frameReader) {
      this.frameReader.stop();
      this.frameReader = null;
    }
  }

  private handleFrame(frame: Uint8Array): void {
    try {
      if (this.config.maxServers && this.processedCount >= this.config.maxServers) {
        this.stop();
        return;
      }

      const decoder = new ProtobufDecoder(frame);
      const serverInfo = decoder.decodeServerInfo(frame);

      if (serverInfo.Data && serverInfo.EndPoint) {
        this.processedCount++;
        this.servers.push(serverInfo); // เก็บข้อมูลเซิร์ฟเวอร์
        
        if (this.config.handlers?.onServer) {
          this.config.handlers.onServer(serverInfo);
        }
      }

    } catch (error) {
      if (this.config.handlers?.onError) {
        this.config.handlers.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private handleEnd(): void {
    this.isRunning = false;
    if (this.config.handlers?.onEnd) {
      this.config.handlers.onEnd();
    }
  }

  private handleError(error: Error): void {
    this.isRunning = false;
    if (this.config.handlers?.onError) {
      this.config.handlers.onError(error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getProcessedCount(): number {
    return this.processedCount;
  }

  /**
   * รวบรวมเซิร์ฟเวอร์ทั้งหมดและ return เป็น Promise
   */
  async getAllServers(): Promise<ServerInfo[]> {
    this.servers = []; // รีเซ็ตข้อมูล
    
    return new Promise((resolve, reject) => {
      // Override handlers เพื่อจัดการ Promise
      const originalHandlers = this.config.handlers;
      
      this.config.handlers = {
        ...originalHandlers,
        onEnd: () => {
          // เรียก original handler ถ้ามี
          if (originalHandlers?.onEnd) {
            originalHandlers.onEnd();
          }
          // resolve ด้วยข้อมูลที่รวบรวม
          resolve([...this.servers]);
        },
        onError: (error: Error) => {
          // เรียก original handler ถ้ามี
          if (originalHandlers?.onError) {
            originalHandlers.onError(error);
          }
          reject(error);
        }
      };

      // เริ่ม stream
      this.start().catch(reject);
    });
  }

  /**
   * รวบรวมเซิร์ฟเวอร์ที่ผ่าน filter และ return เป็น Promise
   */
  async getFilteredServers(filter: (server: ServerInfo) => boolean): Promise<ServerInfo[]> {
    const allServers = await this.getAllServers();
    return allServers.filter(filter);
  }
}