import React, { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'

type Props = {
	children: ReactNode
	footer?: ReactNode
	backgroundColor?: string
	contentTopPadding?: number
	contentBottomPadding?: number
}

const FlowScreenLayout = ({
	children,
	footer,
	backgroundColor = '#FFFFFF',
	contentTopPadding = 70,
	contentBottomPadding = 120,
}: Props) => {
	return (
		<View style={[styles.root, { backgroundColor }]}>
			<KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<ScrollView
					style={styles.scrollView}
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingTop: contentTopPadding, paddingBottom: contentBottomPadding },
					]}
					showsVerticalScrollIndicator={false}>
					{children}
				</ScrollView>
			</KeyboardAvoidingView>
			{footer}
			<View style={styles.homeIndicatorContainer} pointerEvents="none">
				<View style={styles.homeIndicator} />
			</View>
		</View>
	)
}

export default FlowScreenLayout

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	keyboardAvoidingView: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
	},
	homeIndicatorContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 10,
		alignItems: 'center',
	},
	homeIndicator: {
		width: 144,
		height: 5,
		borderRadius: 100,
		backgroundColor: '#000000',
	},
})