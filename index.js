import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import "@/config/ENV";
import "react-native-url-polyfill/auto";

const app = App;

AppRegistry.registerComponent(appName, () => app);
