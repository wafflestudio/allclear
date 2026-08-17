import { useQuery } from "@tanstack/react-query";
import { useContext, useMemo, useState } from "react";
import {
	FlatList,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { FormNavigationButtons } from "@/features/register-club/components/FormNavigationButtons";
import type { RegisterClubFormData } from "@/features/register-club/types";
import TextField from "@/shared/components/TextField";
import { Colors } from "@/shared/constants/colors";
import {
	buildDepartmentOptions,
	DEFAULT_DEPARTMENT_OPTIONS,
} from "@/shared/constants/departments";
import { typography } from "@/shared/constants/typography";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { s, vs } from "@/shared/utils/scale";

type Props = {
	formData: RegisterClubFormData;
	onFormDataChange: (data: Partial<RegisterClubFormData>) => void;
	onNext: () => void;
	onPrevious: () => void;
	progress?: number;
};

export const ClubAffiliationScreen = ({
	formData,
	onFormDataChange,
	onNext,
	onPrevious,
	progress,
}: Props) => {
	const { userService } = useContext(serviceContext);
	const [showDropdown, setShowDropdown] = useState(false);
	const [departmentSearch, setDepartmentSearch] = useState("");
	const isComplete = formData.department.trim() && formData.shortIntro.trim();
	const { data: departmentOptions = DEFAULT_DEPARTMENT_OPTIONS } = useQuery({
		queryKey: ["collegeMajors", "clubAffiliation"],
		queryFn: () => userService.listCollegeMajors({ includeNullMajor: true }),
		select: (data) => buildDepartmentOptions(data.majors),
	});
	const filteredDepartmentOptions = useMemo(() => {
		const keyword = departmentSearch.trim();
		if (!keyword) {
			return departmentOptions;
		}
		return departmentOptions.filter((department) =>
			department.includes(keyword),
		);
	}, [departmentOptions, departmentSearch]);

	const handleSelectDepartment = (dept: string) => {
		onFormDataChange({ department: dept });
		setShowDropdown(false);
		setDepartmentSearch("");
	};

	return (
		<SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.title}>
						<Text style={styles.clubName}>{formData.clubName}</Text>
						<Text>의</Text>
						{"\n"}
						<Text>한줄소개를 완성해주세요</Text>
					</Text>
					<Text style={styles.subtitle}>
						동아리 소개 최상단에 노출될 간단한 문구예요
					</Text>
				</View>

				<View style={styles.form}>
					{/* Department Dropdown + 소속 label */}
					<View style={styles.affiliationRow}>
						<Pressable
							style={[styles.dropdown, showDropdown && styles.dropdownActive]}
							onPress={() => setShowDropdown(!showDropdown)}
						>
							<Text style={styles.dropdownText}>
								{formData.department || "단과대/학과"}
							</Text>
							<MaterialIcons
								name={showDropdown ? "expand-less" : "expand-more"}
								size={20}
								color={Colors.BODYTEXT_MAIN}
							/>
						</Pressable>
						<Text style={styles.affiliationLabel}>소속</Text>
					</View>

					{/* Short Introduction Input */}
					<TextField
						placeholder="웹/앱 개발 동아리, 경영전략학회"
						value={formData.shortIntro}
						onChangeText={(text) => onFormDataChange({ shortIntro: text })}
						maxLength={100}
					/>

					<View style={styles.validationGroup}>
						<Text style={styles.validationText}>소속을 선택해주세요</Text>
						<Text style={styles.validationText}>
							동아리 주요 활동을 작성해주세요
						</Text>
					</View>
				</View>
			</ScrollView>

			<Modal
				visible={showDropdown}
				transparent
				animationType="fade"
				onRequestClose={() => setShowDropdown(false)}
			>
				<Pressable
					style={styles.departmentModalOverlay}
					onPress={() => setShowDropdown(false)}
				>
					<Pressable
						style={styles.departmentModalCard}
						onPress={(event) => event.stopPropagation()}
					>
						<Text style={styles.departmentModalTitle}>소속 선택</Text>
						<TextInput
							style={styles.dropdownSearchInput}
							placeholder="소속 검색"
							placeholderTextColor={Colors.BODYTEXT_DISABLED}
							value={departmentSearch}
							onChangeText={setDepartmentSearch}
						/>
						<FlatList
							data={filteredDepartmentOptions}
							style={styles.dropdownList}
							keyboardShouldPersistTaps="handled"
							keyExtractor={(dept) => dept}
							renderItem={({ item: dept }) => (
								<Pressable
									style={[
										styles.dropdownItem,
										formData.department === dept && styles.dropdownItemSelected,
									]}
									onPress={() => handleSelectDepartment(dept)}
								>
									<Text
										style={[
											styles.dropdownItemText,
											formData.department === dept &&
												styles.dropdownItemTextSelected,
										]}
									>
										{dept}
									</Text>
								</Pressable>
							)}
							ListEmptyComponent={
								<Text style={styles.dropdownEmptyText}>검색 결과가 없어요</Text>
							}
						/>
					</Pressable>
				</Pressable>
			</Modal>

			<FormNavigationButtons
				onPrevious={onPrevious}
				onNext={onNext}
				isNextDisabled={!isComplete}
				progress={progress}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.WHITE,
	},
	content: {
		padding: s(20),
		paddingBottom: vs(20),
	},
	header: {
		marginBottom: vs(32),
	},
	title: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
		marginBottom: vs(8),
	},
	clubName: {
		color: Colors.BUTTON_SELECTED,
		fontWeight: "800",
	},
	subtitle: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
	},
	form: {
		gap: vs(12),
	},
	affiliationRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: s(16),
	},
	affiliationLabel: {
		...typography.headerXLSemibold,
		color: Colors.BODYTEXT_MAIN,
	},
	dropdown: {
		width: "55%",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: s(16),
		paddingVertical: vs(14),
		borderWidth: 1,
		borderColor: Colors.BODYTEXT_DISABLED,
		borderRadius: 8,
		backgroundColor: Colors.WHITE,
	},
	dropdownActive: {
		borderColor: Colors.BUTTON_SELECTED,
	},
	dropdownText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_SUB,
		flex: 1,
	},
	dropdownSearchInput: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingVertical: vs(10),
		borderBottomWidth: 1,
		borderBottomColor: Colors.BACKGROUND_SUB,
	},
	dropdownList: {
		maxHeight: vs(360),
	},
	dropdownItem: {
		paddingHorizontal: s(16),
		paddingVertical: vs(12),
		borderBottomWidth: 1,
		borderBottomColor: Colors.BACKGROUND_SUB,
	},
	dropdownItemSelected: {
		backgroundColor: Colors.BACKGROUND_SUB,
	},
	dropdownItemText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_MAIN,
	},
	dropdownItemTextSelected: {
		color: Colors.BUTTON_SELECTED,
		fontWeight: "600",
	},
	dropdownEmptyText: {
		...typography.bodyMRegular,
		color: Colors.BODYTEXT_DISABLED,
		paddingHorizontal: s(16),
		paddingVertical: vs(12),
	},
	departmentModalOverlay: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_DIM,
		justifyContent: "center",
		paddingHorizontal: s(20),
	},
	departmentModalCard: {
		backgroundColor: Colors.WHITE,
		borderRadius: 12,
		overflow: "hidden",
	},
	departmentModalTitle: {
		...typography.headerL,
		color: Colors.BODYTEXT_MAIN,
		paddingHorizontal: s(16),
		paddingTop: vs(16),
		paddingBottom: vs(8),
	},
	validationGroup: {
		gap: vs(8),
	},
	validationText: {
		...typography.bodyMRegular,
		color: Colors.POINTCOLOR,
	},
});
