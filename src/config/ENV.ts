import Config from "react-native-config";

type Profile = "dev" | "prod";

const API_SERVER_BASE_URL = Config.API_SERVER_BASE_URL;

(function validateEnv() {
	const message = [["API_SERVER_BASE_URL", API_SERVER_BASE_URL]]
		.filter((it) => !it[1])
		.map(([name, value]) => `Invalid environment variable ${name}: ${value}`)
		.join("\n");

	if (message) {
		throw new Error(message);
	}
})();
export const ENV = {
	PROFILE: Config.PROFILE as Profile,
	IS_PRODUCTION: !__DEV__,
	API_SERVER_BASE_URL: API_SERVER_BASE_URL,
	WEB_URL: Config.WEB_URL || "",
};
