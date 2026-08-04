import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
	onBack: () => void;
};

const Header = ({ onBack }: Props) => {
	return (
		<View
			style={{
				position: "relative",
				padding: 20,
				display: "flex",
				flexDirection: "row",
				alignItems: "flex-start",
				justifyContent: "space-between",
				zIndex: 3,
			}}
		>
			<TouchableOpacity
				style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
				onPress={onBack}
			>
				<Icon name="chevron-left" size={24} />
			</TouchableOpacity>
		</View>
	);
};

export default Header;
