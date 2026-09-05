import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mazeescape.game",
  appName: "Maze Escape",
  webDir: "capacitor-www",
  backgroundColor: "#08080b",
  android: {
    allowMixedContent: false,
  },
};

export default config;
