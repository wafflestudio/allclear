import { Club } from 'server/domain/model/Club'

export const sortByPopularAndEachRandom = (clubs: Club[]): Club[] =>
  clubs.sort((a, b) => {
    if (a.isPopular && !b.isPopular) {
      return -1
    }
    if (!a.isPopular && b.isPopular) {
      return 1
    }
    return (
      Math.random() - 0.5 + (a.imageUri && !b.imageUri ? -0.2 : !a.imageUri && b.imageUri ? 0.2 : 0)
    )
  })
