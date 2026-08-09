/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

const path = require("node:path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);
const workspaceRoot = path.resolve(__dirname, "../..");

const {
	resolver: { sourceExts, assetExts },
} = getDefaultConfig(__dirname);

const config = {
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: true,
			},
		}),
	},
	resolver: {
		assetExts: assetExts.filter((ext) => ext !== "svg"),
		nodeModulesPaths: [
			path.resolve(__dirname, "node_modules"),
			path.resolve(workspaceRoot, "node_modules"),
		],
		sourceExts: [...sourceExts, "svg"],
	},
	watchFolders: [workspaceRoot],
};

module.exports = mergeConfig(defaultConfig, config);
