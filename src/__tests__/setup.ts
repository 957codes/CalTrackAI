// Mock AsyncStorage
const store: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
  },
}));

// Mock react-native
jest.mock("react-native", () => ({
  NativeModules: {
    WidgetDataBridge: {
      setWidgetData: jest.fn(() => Promise.resolve()),
    },
  },
  Platform: { OS: "ios" },
}));

// Mock HealthKit service
jest.mock("../services/healthKitService", () => ({
  writeMealToHealthKit: jest.fn(() => Promise.resolve()),
}));

// Expose store for tests to clear between runs
(globalThis as any).__asyncStorageMock = store;
