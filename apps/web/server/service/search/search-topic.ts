import { PUBLIC_CLUB_STATUS } from 'server/domain/constants/club-status'
import { getPrismaClient } from 'server/infra/database/prisma'
import { formsOf, splitWords } from './search-words'

// 동아리 글 열 중 셋 넘게 나오는 낱말은 동아리를 가려내지 못합니다. 예: "동아리", "서울대".
const COMMON_SHARE = 0.3

// 조사는 세 글자가 남을 때까지만 뗍니다. 더 떼면 "동아시아"가 "동아"가 되어 "동아리"의 글에 걸립니다.
const SHORTEST_STEM = 3

// 검색문에서 모든 동아리에 흔한 낱말을 빼고 주제만 남깁니다. 예: "사진 찍는 동아리" → "사진 찍는".
// 무엇이 흔한지는 동아리 글에서 직접 셉니다. 남는 낱말이 없으면 검색문 그대로가 주제입니다.
export async function extractSearchTopic(query: string): Promise<string> {
  const words = splitWords(query)
  const formsOfWord = (word: string) => formsOf(word, SHORTEST_STEM)

  const forms = words.flatMap(formsOfWord)
  const commonForms = await findCommonForms(forms)

  const isCommon = (word: string) => formsOfWord(word).some((form) => commonForms.has(form))
  const topicWords = words.filter((word) => !isCommon(word))

  const kept = topicWords.length > 0 ? topicWords : words
  return kept.join(' ')
}

// 주어진 꼴 가운데, 동아리 글에 흔하게 나오는 것을 찾습니다.
// 한 글자는 세지 않습니다. 다른 낱말 속에 들어 있어 흔해 보일 뿐입니다. 예: "공" → 공연, 공부.
async function findCommonForms(forms: string[]): Promise<Set<string>> {
  const rows = await getPrismaClient().$queryRaw<Array<{ form: string }>>`
    WITH club_text AS (
      SELECT lower(concat_ws(' ', name, short_description, description, introduction)) AS text
      FROM public.club
      WHERE status = ${PUBLIC_CLUB_STATUS} AND deleted_at IS NULL
    )
    SELECT form
    FROM unnest(${forms}::text[]) AS form
    WHERE char_length(form) > 1
      AND (SELECT count(*) FROM club_text WHERE position(form IN text) > 0)
        > ${COMMON_SHARE}::float * (SELECT count(*) FROM club_text)
  `
  return new Set(rows.map((row) => row.form))
}
