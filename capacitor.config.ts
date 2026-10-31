import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'vip.gatemate.app',
  appName: 'GateMate',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0b1a3b',
  },
};

export default config;
