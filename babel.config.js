module.exports = {
	presets: ["module:@react-native/babel-preset"],
	plugins: [
		["@babel/plugin-proposal-decorators", { legacy: true }],
		[
			"module-resolver",
			{
				extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
				alias: {
					"@": "./src",
				},
			},
		],
		"react-native-reanimated/plugin",
	],
};
