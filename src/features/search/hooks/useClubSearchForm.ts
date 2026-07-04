import { useReducer } from 'react'
import type { ClubSearchFilters, ClubSearchForm } from '@/features/search/types/clubSearchForm'
import {
	DEFAULT_CLUB_SEARCH_FILTERS,
	DEFAULT_CLUB_SEARCH_FORM,
} from '@/features/search/types/clubSearchForm'

type Action =
	| { type: 'set_query'; value: string }
	| { type: 'set_filters'; value: ClubSearchFilters }
	| { type: 'reset_filters' }

const reducer = (state: ClubSearchForm, action: Action): ClubSearchForm => {
	switch (action.type) {
		case 'set_query':
			return {
				...state,
				query: action.value,
			}
		case 'set_filters':
			return {
				...state,
				filters: action.value,
			}
		case 'reset_filters':
			return {
				...state,
				filters: DEFAULT_CLUB_SEARCH_FILTERS,
			}
		default:
			return state
	}
}

export const useClubSearchForm = () => {
	const [form, dispatch] = useReducer(reducer, DEFAULT_CLUB_SEARCH_FORM)

	return {
		form,
		setQuery: (value: string) => dispatch({ type: 'set_query', value }),
		setFilters: (value: ClubSearchFilters) => dispatch({ type: 'set_filters', value }),
		resetFilters: () => dispatch({ type: 'reset_filters' }),
	}
}
