import { RouteProp, useFocusEffect } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Club } from '@/entities/club'
import ClubList from '@/features/club/components/ClubList/ClubList'
import PopularClubs from '@/features/club/components/PopularClubs/PopularClubs'
import RandomRecommendations, {
	RandomRecommendationsSkeleton,
} from '@/features/club/components/RandomRecommendations/RandomRecommendations'
import RecentSearches from '@/features/club/components/RecentSearches/RecentSearches'
import SearchBar from '@/features/club/components/SearchBar/SearchBar'
import SearchFilterBar from '@/features/club/components/SearchBar/SearchFilterBar'
import SearchFilterOverlay from '@/features/club/components/SearchBar/SearchFilterOverlay'
import TypoCorrectionNotice from '@/features/club/components/TypoCorrectionNotice/TypoCorrectionNotice'
import {
	type ClubSearchFilters,
	createSearchClubsRequest,
	DEFAULT_CLUB_SEARCH_FILTERS,
	resetClubSearchOverlayFilters,
} from '@/features/search/types/clubSearchForm'
import { ListRandomRecommendationsResponse, SearchClubsResponse } from '@/repositories/club'
import { ListRecentSearchesResponse } from '@/repositories/recentSearch'
import { Colors } from '@/shared/constants/colors'
import { SCREEN_TYPE, StackParamList } from '@/shared/constants/screen'
import { typography } from '@/shared/constants/typography'
import { serviceContext } from '@/shared/contexts/serviceContext'
import WithViewEventLog from '@/shared/hocs/WithViewEventLog'
import { s, vs } from '@/shared/utils/scale'

const RECENT_SEARCHES_QUERY_KEY = ['recentSearches'] as const

type SearchScreenRouteProp = RouteProp<StackParamList, SCREEN_TYPE.SEARCH>
type SearchScreenNavigationProp = NativeStackNavigationProp<StackParamList, SCREEN_TYPE.SEARCH>

type Props = {
	route: SearchScreenRouteProp
	navigation: SearchScreenNavigationProp
}

const SearchScreen = ({ navigation }: Props) => {
	const [inputValue, setInputValue] = useState('')
	const [submittedQuery, setSubmittedQuery] = useState('')
	const [submittedSearchId, setSubmittedSearchId] = useState(0)
	const [isTypoNoticeVisible, setIsTypoNoticeVisible] = useState(true)
	const [filters, setFilters] = useState<ClubSearchFilters>(DEFAULT_CLUB_SEARCH_FILTERS)
	const [isFilterOverlayVisible, setIsFilterOverlayVisible] = useState(false)

	const queryClient = useQueryClient()
	const request = useMemo(
		() => createSearchClubsRequest({ query: submittedQuery, filters }),
		[filters, submittedQuery],
	)
	const { data: searchResult, isFetching } = useSearchClubs({ query: submittedQuery, request })
	const { data: recentSearches } = useRecentSearches()
	const { mutate: clearRecentSearches } = useClearRecentSearches()
	const {
		data: randomRecommendations,
		isError: isRandomRecommendationsError,
		isLoading: isFetchingRandomRecommendations,
		mutate: fetchRandomRecommendations,
		reset: resetRandomRecommendations,
	} = useRandomRecommendations()

	const clubs = searchResult?.clubs

	const hasSubmittedQuery = submittedQuery.length > 0
	const shouldShowRandomRecommendations = hasSubmittedQuery && clubs?.length === 0 && !isFetching
	const isRandomRecommendationsLoading =
		shouldShowRandomRecommendations &&
		(isFetchingRandomRecommendations || (!randomRecommendations && !isRandomRecommendationsError))
	const shouldShowTypoNotice =
		isTypoNoticeVisible && !!searchResult?.isTypoCorrected && !!searchResult.correctedQuery

	const resetSearchState = useCallback(() => {
		setInputValue('')
		setSubmittedQuery('')
		setSubmittedSearchId(0)
		resetRandomRecommendations()
		setIsTypoNoticeVisible(true)
		setFilters(DEFAULT_CLUB_SEARCH_FILTERS)
		setIsFilterOverlayVisible(false)
	}, [resetRandomRecommendations])

	const resetToInitialState = useCallback(() => {
		navigation.reset({
			index: 0,
			routes: [{ name: SCREEN_TYPE.SEARCH }],
		})
		resetSearchState()
	}, [navigation, resetSearchState])

	useEffect(() => {
		const parent = navigation.getParent()
		if (!parent) return undefined
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const unsubscribe = (parent as any).addListener('tabPress', () => {
			if (navigation.isFocused()) {
				resetToInitialState()
			}
		})
		return unsubscribe
	}, [navigation, resetToInitialState])

	useFocusEffect(
		useCallback(() => {
			return () => setIsFilterOverlayVisible(false)
		}, []),
	)

	useEffect(() => {
		resetRandomRecommendations()
	}, [request, resetRandomRecommendations])

	useEffect(() => {
		if (!shouldShowRandomRecommendations) return

		fetchRandomRecommendations()
	}, [fetchRandomRecommendations, request, shouldShowRandomRecommendations, submittedSearchId])

	const handleSubmitQuery = (nextQuery: string) => {
		queryClient.cancelQueries({ queryKey: ['searchClubs'] })
		resetRandomRecommendations()
		setSubmittedQuery(nextQuery)
		setSubmittedSearchId(prev => prev + 1)
		setIsTypoNoticeVisible(true)
		setIsFilterOverlayVisible(false)
	}

	const handleChangeFilters = useCallback((nextFilters: ClubSearchFilters) => {
		Keyboard.dismiss()
		setFilters(nextFilters)
	}, [])

	const handleToggleFilterOverlay = useCallback(() => {
		Keyboard.dismiss()
		setIsFilterOverlayVisible(prev => !prev)
	}, [])

	const handleSelectRecentSearch = (query: string) => {
		setInputValue(query)
		handleSubmitQuery(query)
	}

	const handleClearRecentSearches = () => {
		clearRecentSearches()
	}

	const openDetailPage = (club: Club) => {
		navigation.navigate(SCREEN_TYPE.CLUB_DETAIL, {
			uuid: club.uuid,
			category: club.category,
			entry_point: 'search_result',
		})
	}

	return (
		<WithViewEventLog params={{ screen_name: 'search_screen' }}>
			<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
				<View style={styles.headerContainer}>
					<Pressable onPress={resetToInitialState}>
						<Text style={styles.headerText}>어떤 동아리를 찾아볼까요?</Text>
					</Pressable>
					<SearchBar value={inputValue} onChangeText={setInputValue} onSubmit={handleSubmitQuery} />
				</View>
				{hasSubmittedQuery ? (
					<>
						<View style={styles.searchControls}>
							{shouldShowTypoNotice ? (
								<TypoCorrectionNotice
									correctedQuery={searchResult!.correctedQuery!}
									onClose={() => setIsTypoNoticeVisible(false)}
								/>
							) : null}
							<SearchFilterBar
								filters={filters}
								onChange={handleChangeFilters}
								onPressFilter={handleToggleFilterOverlay}
							/>
						</View>
						<View style={styles.contentContainer}>
							<ClubList
								clubs={clubs}
								openDetailPage={openDetailPage}
								emptyPlaceholder={'앗 검색 결과가 없어요!\n다른 키워드로 검색해주세요'}
								isLoading={isFetching}
							/>
							{shouldShowRandomRecommendations ? (
								isRandomRecommendationsLoading ? (
									<RandomRecommendationsSkeleton />
								) : (
									<RandomRecommendations
										clubs={randomRecommendations?.clubs ?? []}
										onPressClub={openDetailPage}
									/>
								)
							) : null}
							{isFilterOverlayVisible ? (
								<SearchFilterOverlay
									value={filters}
									onChange={handleChangeFilters}
									onReset={() => setFilters(resetClubSearchOverlayFilters(filters))}
									onClose={() => setIsFilterOverlayVisible(false)}
								/>
							) : null}
						</View>
					</>
				) : (
					<View style={styles.placeholderContainer}>
						<RecentSearches
							searches={recentSearches ?? []}
							onPressItem={handleSelectRecentSearch}
							onClearAll={handleClearRecentSearches}
						/>
						<PopularClubs />
					</View>
				)}
			</SafeAreaView>
		</WithViewEventLog>
	)
}

export default SearchScreen

type UseSearchClubsProps = {
	query: string
	request: ReturnType<typeof createSearchClubsRequest>
}

const useSearchClubs = ({ query, request }: UseSearchClubsProps) => {
	const { clubService } = useContext(serviceContext)
	const queryClient = useQueryClient()

	return useQuery<SearchClubsResponse>(
		['searchClubs', request],
		({ signal }) => clubService.searchClubs(request, signal),
		{
			enabled: query.length > 0,
			keepPreviousData: true,
			staleTime: 0,
			onSuccess: () => {
				queryClient.cancelQueries({ queryKey: RECENT_SEARCHES_QUERY_KEY })
				queryClient.invalidateQueries(RECENT_SEARCHES_QUERY_KEY)
			},
		},
	)
}

const useRecentSearches = () => {
	const { recentSearchService } = useContext(serviceContext)

	return useQuery(RECENT_SEARCHES_QUERY_KEY, () => recentSearchService.listRecentSearches(), {
		staleTime: 0,
		select: data => data.recentSearches.map(it => it.query),
	})
}

const useClearRecentSearches = () => {
	const { recentSearchService } = useContext(serviceContext)
	const queryClient = useQueryClient()

	return useMutation(() => recentSearchService.deleteAllRecentSearches(), {
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: RECENT_SEARCHES_QUERY_KEY })

			const previousRecentSearches =
				queryClient.getQueryData<ListRecentSearchesResponse>(RECENT_SEARCHES_QUERY_KEY)

			queryClient.setQueryData<ListRecentSearchesResponse>(RECENT_SEARCHES_QUERY_KEY, {
				recentSearches: [],
				totalSize: 0,
			})

			return { previousRecentSearches }
		},
		onError: (_error, _variables, context) => {
			if (context?.previousRecentSearches) {
				queryClient.setQueryData<ListRecentSearchesResponse>(
					RECENT_SEARCHES_QUERY_KEY,
					context.previousRecentSearches,
				)
			}
		},
		onSuccess: () => {
			queryClient.setQueryData<ListRecentSearchesResponse>(RECENT_SEARCHES_QUERY_KEY, {
				recentSearches: [],
				totalSize: 0,
			})
		},
	})
}

const useRandomRecommendations = () => {
	const { clubService } = useContext(serviceContext)

	return useMutation<ListRandomRecommendationsResponse>(() =>
		clubService.listRandomRecommendations(),
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	headerContainer: {
		paddingHorizontal: s(20),
		paddingVertical: vs(10),
		gap: s(15),
	},
	headerText: {
		...typography.headerXXL,
		color: Colors.BODYTEXT_MAIN,
		paddingTop: vs(10),
		paddingRight: s(12),
		paddingBottom: vs(10),
		paddingLeft: s(5),
	},
	searchControls: {
		width: '100%',
		gap: vs(14),
		paddingHorizontal: s(20),
		paddingTop: vs(14),
		paddingBottom: vs(10),
		backgroundColor: Colors.BACKGROUND_MAIN,
	},
	contentContainer: {
		flex: 1,
		position: 'relative',
	},
	placeholderContainer: {
		paddingHorizontal: s(20),
		paddingTop: vs(14),
		gap: vs(30),
	},
})
