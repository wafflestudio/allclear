import { createHash } from 'node:crypto'
import { Parser } from 'htmlparser2'

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

type JsonObject = { [key: string]: Json }

// 동아리 정보를 임베딩에 넣을 글로 바꿉니다.
// hash는 글이 바뀌었는지 판단하는 데 쓰므로, 같은 내용은 언제나 같은 글이 되어야 합니다.
export function buildEmbeddingDocument(document: Json) {
  const text = JSON.stringify(normalize(document) ?? {})
  const hash = createHash('sha256').update(text).digest('hex')

  return { text, hash }
}

// 값을 정리합니다. 비어 있는 값은 undefined로 돌려주고, 부모가 그 자리를 지웁니다.
function normalize(value: Json): Json | undefined {
  if (value === null) {
    return undefined
  }
  if (typeof value === 'string') {
    return normalizeString(value)
  }
  if (Array.isArray(value)) {
    return normalizeArray(value)
  }
  if (typeof value === 'object') {
    return normalizeObject(value)
  }

  // 숫자와 boolean은 그대로 둡니다.
  return value
}

function normalizeString(html: string): string | undefined {
  const text = plainText(html)

  return text === '' ? undefined : text
}

// URL·모임·키워드 배열은 순서와 중복에 관계없이 같은 문서로 취급합니다.
function normalizeArray(items: Json[]): Json[] | undefined {
  const serialized = new Set<string>()

  for (const item of items) {
    const normalized = normalize(item)

    if (normalized !== undefined) {
      serialized.add(JSON.stringify(normalized))
    }
  }
  if (serialized.size === 0) {
    return undefined
  }

  const sorted = [...serialized].sort()
  return sorted.map((item) => JSON.parse(item) as Json)
}

// key 순서가 달라도 같은 문서가 되도록 key를 정렬합니다.
function normalizeObject(object: JsonObject): JsonObject | undefined {
  const entries: [string, Json][] = []

  for (const key of Object.keys(object).sort()) {
    const normalized = normalize(object[key])

    if (normalized !== undefined) {
      entries.push([key, normalized])
    }
  }
  if (entries.length === 0) {
    return undefined
  }

  return Object.fromEntries(entries)
}

// 내용이 화면에 보이지 않는 태그
const HIDDEN_TAGS = new Set(['script', 'style'])

// 앞뒤에서 줄이 바뀌는 태그. 태그를 지워도 단어가 붙지 않도록 그 자리를 띄웁니다.
const BLOCK_TAGS = new Set([
  'p',
  'div',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'tr',
  'td',
  'section',
  'blockquote',
])

// HTML에서 보이는 글자만 남기고, 공백을 한 칸으로 줄입니다.
function plainText(html: string): string {
  let text = ''
  let hiddenDepth = 0

  const parser = new Parser({
    onopentag(name) {
      if (HIDDEN_TAGS.has(name)) {
        hiddenDepth++
      }
      if (BLOCK_TAGS.has(name) || name === 'br') {
        text += ' '
      }
    },

    ontext(value) {
      if (hiddenDepth === 0) {
        text += value
      }
    },

    onclosetag(name) {
      if (HIDDEN_TAGS.has(name)) {
        hiddenDepth--
      }
      if (BLOCK_TAGS.has(name)) {
        text += ' '
      }
    },
  })
  parser.end(html)

  return text.normalize('NFC').replace(/\s+/g, ' ').trim()
}
