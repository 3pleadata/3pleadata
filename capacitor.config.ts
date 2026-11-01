import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.threepleadata.app',
  appName: '3PLE A',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
  },
};

export default config;
