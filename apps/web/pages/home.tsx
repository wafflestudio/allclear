import React from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { Header } from '../src/common/components/Header'
import CareerCategoryCard from '../src/career/components/CareerCategoryCard'
import { CareerCategory } from '../src/career/domain/types/CareerCategory'
import { useFetchCareerCategories } from '../src/career/api/hooks/useFetchCareerCategories'

const SelectLanguagePage: NextPage = () => {
  const router = useRouter()

  const { data: careerCategories } = useFetchCareerCategories()

  const onClickCategory = (category: CareerCategory) => {
    router.push(`/c/${category.path}`)
  }

  return (
    <div
      className={'flex h-100v w-screen flex-col items-center bg-white text-black scrollbar-hide'}
    >
      <Header />
      <section className="grow dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl py-8 px-4 sm:py-16 lg:px-6">
          <div className="mb-8 max-w-screen-md lg:mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              <mark className="bg-white text-primary-600">서울대학교 </mark>
              모든 동아리 모집공고를 둘러보세요!
            </h2>
          </div>
          <div className={'my-8 w-full px-4'}>
            <form className={'w-full'}>
              <label
                htmlFor="default-search"
                className="sr-only mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    aria-hidden="true"
                    className="h-5 w-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="search"
                  id="default-search"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="Search your career interests.."
                  required
                />
                <button
                  type="submit"
                  className="absolute right-2.5 bottom-2.5 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
          <div className="my-6 grid grid-cols-3 justify-items-center gap-x-4 gap-y-6">
            {careerCategories
              ? careerCategories?.map((category) => (
                  <div key={category.id} className="h-28 w-28">
                    <CareerCategoryCard
                      title={category.name}
                      onClick={() => onClickCategory(category)}
                    />
                  </div>
                ))
              : new Array(9).fill(0).map((_, index) => (
                  <div
                    key={index}
                    role="status"
                    className="flex h-28 w-28 max-w-sm animate-pulse items-center justify-center rounded-lg bg-gray-300 dark:bg-gray-700"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default SelectLanguagePage
