import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useRef } from 'react'
import type { LayoutChangeEvent } from 'react-native'
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
	const isInteracting = useSharedValue(false)
	const latestContentWidth = useRef(0)
	const latestListWidth = useRef(0)
	const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

	const pauseAutoScroll = () => {
		if (resumeTimeoutRef.current) {
			clearTimeout(resumeTimeoutRef.current)
			resumeTimeoutRef.current = null
		}

		isInteracting.value = true
	}

	const resumeAutoScroll = (delayMs = 0) => {
		if (resumeTimeoutRef.current) {
			clearTimeout(resumeTimeoutRef.current)
			resumeTimeoutRef.current = null
		}

		if (delayMs > 0) {
			resumeTimeoutRef.current = setTimeout(() => {
				resumeTimeoutRef.current = null
				resumeAutoScroll()
			}, delayMs)
			return
		}

		isInteracting.value = false
	}

	const updateMaxOffset = () => {
		maxOffset.value = Math.max(latestContentWidth.current - latestListWidth.current, 0)
	}

	const handleLayout = (event: LayoutChangeEvent) => {
		latestListWidth.current = event.nativeEvent.layout.width
		updateMaxOffset()
	}

	const handleContentSizeChange = (width: number) => {
		latestContentWidth.current = width
		updateMaxOffset()
	}

	// 화면에 다시 진입하면 처음부터 다시 흐르도록 초기화한다.
	useFocusEffect(
		useCallback(() => {
			offset.value = 0
			isInteracting.value = false
			if (resumeTimeoutRef.current) {
				clearTimeout(resumeTimeoutRef.current)
				resumeTimeoutRef.current = null
			}
			listRef.current?.scrollToOffset({ offset: 0, animated: false })
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []),
	)

	return {
		listRef,
		onScroll,
		onLayout: handleLayout,
		onContentSizeChange: handleContentSizeChange,
		pauseAutoScroll,
		resumeAutoScroll,
	}
}

export default useAutoScroll
