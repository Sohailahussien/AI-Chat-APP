// Jest setup file for global test configuration

// Mock global objects that might not be available in test environment
// Mock File constructor
global.File = class File {
  name: string;
  type: string;
  size: number;
  lastModified: number;

  constructor(bits: (string | Blob | ArrayBuffer | ArrayBufferView)[], name: string, options?: FilePropertyBag) {
    this.name = name;
    this.type = options?.type || '';
    this.size = bits.reduce((acc, bit) => {
      if (bit instanceof Blob) return acc + bit.size;
      if (typeof bit === 'string') return acc + bit.length;
      if (bit instanceof ArrayBuffer) return acc + bit.byteLength;
      if (ArrayBuffer.isView(bit)) return acc + bit.byteLength;
      return acc;
    }, 0);
    this.lastModified = options?.lastModified || Date.now();
  }
} as any;

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock TextEncoder/TextDecoder if not available
if (!global.TextEncoder) {
  global.TextEncoder = class TextEncoder {
    encode(input?: string): Uint8Array {
      return new Uint8Array(Buffer.from(input || '', 'utf8'));
    }
  } as any;
}

if (!global.TextDecoder) {
  global.TextDecoder = class TextDecoder {
    decode(input?: Uint8Array): string {
      return Buffer.from(input || new Uint8Array()).toString('utf8');
    }
  } as any;
} 