import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useMemo } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import Animated, {
	scrollTo,
	useAnimatedRef,
	useAnimatedScrollHandler,
	useFrameCallback,
	useSharedValue,
} from 'react-native-reanimated'

const AUTO_SCROLL_STEP = 0.5

/**
 * 연속 자동 스크롤(마퀴)을 reanimated로 구현한다.
 * 스크롤 구동(useFrameCallback+scrollTo)과 터치 감지(gesture onBegin)를 같은 UI 스레드에서
 * 처리해, 자동 스크롤 중 카드를 탭해도 press가 terminate되지 않고 onPress가 발화된다.
 * 프레임 콜백은 autostart(항상 동작) — 포커스 게이팅 방식은 자동 애니메이션이 시작되지 않는
 * 회귀가 있어 제거했다.
 */
const useAutoScroll = <T>(itemCount: number) => {
	const listRef = useAnimatedRef<Animated.FlatList<T>>()
	const offset = useSharedValue(0)
	const maxOffset = useSharedValue(0)
	const contentWidth = useSharedValue(0)
	const listWidth = useSharedValue(0)
	const isInteracting = useSharedValue(false)

	useFrameCallback(() => {
		'worklet'
		if (itemCount <= 1) return
		if (isInteracting.value) return
		if (maxOffset.value <= 0) return
		if (offset.value >= maxOffset.value) return

		offset.value = Math.min(offset.value + AUTO_SCROLL_STEP, maxOffset.value)
		scrollTo(listRef, offset.value, 0, false)
	}, true)

	const onScroll = useAnimatedScrollHandler({
		onScroll: event => {
			offset.value = event.contentOffset.x
		},
		onMomentumBegin: () => {
			isInteracting.value = true
		},
		onMomentumEnd: () => {
			isInteracting.value = false
		},
	})

	// 터치다운 즉시(UI 스레드) 자동 스크롤을 멈춰 탭이 살아남게 한다.
	// manualActivation으로 절대 활성화되지 않아 스크롤/탭을 가로채지 않고 관찰만 한다.
	const touchGesture = useMemo(
		() =>
			Gesture.Pan()
				.manualActivation(true)
				.onBegin(() => {
					isInteracting.value = true
				})
				.onFinalize(() => {
					isInteracting.value = false
				}),
		[isInteracting],
	)

	const updateMaxOffset = () => {
		maxOffset.value = Math.max(contentWidth.value - listWidth.value, 0)
	}

	const handleLayout = (event: LayoutChangeEvent) => {
		listWidth.value = event.nativeEvent.layout.width
		updateMaxOffset()
	}

	const handleContentSizeChange = (width: number) => {
		contentWidth.value = width
		updateMaxOffset()
	}

	// 화면에 다시 진입하면 처음부터 다시 흐르도록 초기화한다.
	useFocusEffect(
		useCallback(() => {
			offset.value = 0
			isInteracting.value = false
			listRef.current?.scrollToOffset({ offset: 0, animated: false })
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []),
	)

	return {
		listRef,
		touchGesture,
		onScroll,
		onLayout: handleLayout,
		onContentSizeChange: handleContentSizeChange,
	}
}

export default useAutoScroll
