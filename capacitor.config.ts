import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.globalfinserv.app',
  appName: 'Global Financial Services',
  webDir: 'dist/global-finserv-angular/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Share: {
      subject: 'Invoice from Global Financial Services',
      dialogTitle: 'Share Invoice'
    },
    App: {
      launchAutoHide: true
    }
  },
  ios: {
    scheme: 'Global Financial Services'
  }
};

export default config;
