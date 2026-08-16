declare global {
  interface Window {
    // 앱 웹뷰로 열린 경우에만 react-native-webview가 주입한다
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
  }
}

export {}
