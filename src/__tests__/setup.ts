// Define React Native globals
(globalThis as any).__DEV__ = true;

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

// Mock react-native with component stubs for RNTL compatibility
jest.mock("react-native", () => {
  const React = require("react");
  const mockComponent = (name: string) =>
    React.forwardRef((props: any, ref: any) =>
      React.createElement(name, { ...props, ref }, props.children)
    );

  return {
    Platform: { OS: "ios", select: (obj: any) => obj.ios },
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (style: any) => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
    },
    NativeModules: {
      WidgetDataBridge: {
        setWidgetData: jest.fn(() => Promise.resolve()),
      },
    },
    View: mockComponent("View"),
    Text: mockComponent("Text"),
    TouchableOpacity: mockComponent("TouchableOpacity"),
    ScrollView: mockComponent("ScrollView"),
    Image: mockComponent("Image"),
    TextInput: mockComponent("TextInput"),
    Modal: mockComponent("Modal"),
    ActivityIndicator: mockComponent("ActivityIndicator"),
    KeyboardAvoidingView: mockComponent("KeyboardAvoidingView"),
    FlatList: mockComponent("FlatList"),
    Alert: { alert: jest.fn() },
    useColorScheme: jest.fn(() => "dark"),
  };
});

// Mock HealthKit service
jest.mock("../services/healthKitService", () => ({
  writeMealToHealthKit: jest.fn(() => Promise.resolve()),
  writeWaterToHealthKit: jest.fn(() => Promise.resolve()),
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve("notif-id")),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
}));

// Mock Sentry
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
  wrap: jest.fn((component: any) => component),
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: "granted" })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://photo.jpg", base64: "base64data" }],
    })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: "file://gallery.jpg", base64: "base64data" }],
    })
  ),
}));

// Mock expo-router
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn((cb: () => void) => cb()),
}));

// Mock expo-constants
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        revenueCatIosKey: "",
        revenueCatAndroidKey: "",
        mixpanelToken: "",
        appStoreId: "",
        anthropicApiKey: "",
      },
    },
  },
}));

// Mock @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
}));

// Expose store for tests to clear between runs
(globalThis as any).__asyncStorageMock = store;
