import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/kaiveni_test';
process.env.SESSION_SECRET = 'test-secret';
process.env.PORT = '5001';

// Mock fetch globally
global.fetch = vi.fn() as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
(global as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock File
Object.defineProperty(global, 'File', {
  value: class MockFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    webkitRelativePath: string = '';
    
    constructor(chunks: any[], name: string, options: any = {}) {
      this.name = name;
      this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
    }
    
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    bytes() { return Promise.resolve(new Uint8Array(0)); }
    slice() { return new (this.constructor as any)([], this.name); }
    stream() { return new ReadableStream(); }
    text() { return Promise.resolve(''); }
  },
  writable: true,
});

// Mock FileReader
Object.defineProperty(global, 'FileReader', {
  value: class MockFileReader {
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;
    
    result: any = null;
    error: any = null;
    readyState: number = 0;
    onload: any = null;
    onerror: any = null;
    onloadend: any = null;
    
    readAsDataURL(file: any) {
      this.readyState = 2;
      this.result = 'data:image/jpeg;base64,mock-base64-data';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }
    
    readAsText(file: any) {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }
    
    abort() {}
    readAsArrayBuffer() {}
    readAsBinaryString() {}
  },
  writable: true,
});

// Mock WebSocket
Object.defineProperty(global, 'WebSocket', {
  value: class MockWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    
    readyState = 1;
    send = vi.fn();
    close = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    
    constructor(url: string | URL, protocols?: string | string[]) {}
  },
  writable: true,
});

// Mock crypto for password hashing tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomBytes: vi.fn().mockReturnValue(Buffer.from('mock-random-bytes')),
    scrypt: vi.fn().mockImplementation((password, salt, keylen, callback) => {
      callback(null, Buffer.from('mock-hashed-password'));
    }),
    timingSafeEqual: vi.fn().mockReturnValue(true),
  },
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});
