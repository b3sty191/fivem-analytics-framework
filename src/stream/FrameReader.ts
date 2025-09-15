export class FrameReader {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private lastArray: Uint8Array | null = null;
  private frameLength = -1;
  private framePos = 0;
  private isReading = false;

  constructor(
    private stream: ReadableStream<Uint8Array>,
    private onFrame: (frame: Uint8Array) => void,
    private onEnd: () => void,
    private onError?: (error: Error) => void
  ) {
    this.reader = this.stream.getReader();
  }

  public start(): void {
    if (this.isReading) return;
    this.isReading = true;
    this.read();
  }

  public stop(): void {
    this.isReading = false;
    this.reader.cancel();
  }

  private async read(): Promise<void> {
    try {
      const { done, value } = await this.reader.read();

      if (done || !value || !this.isReading) {
        this.onEnd();
        return;
      }

      await this.processBuffer(value);
      
      if (this.isReading) {
        this.read();
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private async processBuffer(buffer: Uint8Array): Promise<void> {
    let array: Uint8Array = buffer;

    while (array.length > 0 && this.isReading) {
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
          return;
        }

        this.frameLength =
          array[0] |
          (array[1] << 8) |
          (array[2] << 16) |
          (array[3] << 24);

        if (this.frameLength > 10 * 1024 * 1024) {
          throw new Error(`Frame too large: ${this.frameLength} bytes`);
        }
      }

      const start = 4;
      const end = start + this.frameLength - this.framePos;

      if (array.length < end) {
        this.lastArray = array;
        return;
      }

      const frameData = this.sliceArray(array, start, end);
      this.framePos += end - start;

      if (this.framePos === this.frameLength) {
        this.frameLength = -1;
        this.framePos = 0;
        
        this.onFrame(frameData);
      }

      if (array.length > end) {
        array = this.sliceArray(array, end);
      } else {
        break;
      }
    }
  }

  private sliceArray(arr: Uint8Array, start: number, end?: number): Uint8Array {
    if (end === undefined) {
      return new Uint8Array(arr.buffer, arr.byteOffset + start, arr.length - start);
    }
    return new Uint8Array(arr.buffer, arr.byteOffset + start, end - start);
  }
}