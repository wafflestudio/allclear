import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthRepository } from "@/repositories/auth";

export enum AuthProvider {
	KAKAO = "kakao",
	APPLE = "apple",
}

export type AuthService = {
	callback(provider: AuthProvider, token: string): Promise<string>;
	logout: () => Promise<void>;
	leave: () => Promise<void>;
};

type Deps = {
	repositories: [AuthRepository];
};

export const getAuthService = ({ repositories }: Deps): AuthService => ({
	callback: async (provider, token) => {
		switch (provider) {
			case AuthProvider.KAKAO: {
				const response = await repositories[0].callbackKakaoAuth({
					accessToken: token,
				});
				return response.token;
			}
			case AuthProvider.APPLE: {
				const response = await repositories[0].callbackAppleAuth({
					id_token: token,
				});
				return response.token;
			}
			default:
				throw new Error("Invalid provider");
		}
	},
	logout: async () => {
		await AsyncStorage.removeItem("token");
	},
	leave: async () => {
		await repositories[0].leave();
	},
});
