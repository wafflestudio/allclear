import { useQuery } from 'react-query'
import type { CareerCategory } from '../../domain/types/CareerCategory'
import { CAREER_CATEGORIES } from './CAREER_CATEGORIES'

export const useFetchCareerCategories = () => {
  return useQuery<CareerCategory[], unknown, CareerCategory[]>(
    ['career-categories'],
    async () => CAREER_CATEGORIES,
  )
}
