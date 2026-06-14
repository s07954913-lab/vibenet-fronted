import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibenetai.app',
  appName: 'Vibenet_Ai',
  webDir: 'www',
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com']
    },
  SplashScreen: {
  backgroundColor: "#014d4e",
  showSpinner: false,
  androidScaleType: "CENTER_CROP",
  splashFullScreen: true,
  splashImmersive: true,
  launchAutoHide: true
}
  },
  server: {
    androidScheme: 'https',
    allowNavigation: [
      '*.youtube.com',
      '*.youtube-nocookie.com',
      'youtube.com',
      '*.googleapis.com',
      '*.google.com'
    ]
  }
};

export default config;