import type { Club } from 'server/domain/model/Club'

export const sortEachRandom = (clubs: Club[]): Club[] =>
  clubs.sort((a, b) => {
    return (
      Math.random() - 0.5 + (a.imageUri && !b.imageUri ? -0.2 : !a.imageUri && b.imageUri ? 0.2 : 0)
    )
  })
