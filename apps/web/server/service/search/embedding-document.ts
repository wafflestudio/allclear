import { createHash } from 'node:crypto'
import { Parser } from 'htmlparser2'

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export function buildEmbeddingDocument(document: Json) {
  const text = JSON.stringify(normalize(document) ?? {})
  const hash = createHash('sha256').update(text).digest('hex')
  return { text, hash }
}

function normalize(value: Json): Json | undefined {
  if (value === null) return undefined
  if (typeof value === 'string') return plainText(value) || undefined
  if (typeof value !== 'object') return value

  if (Array.isArray(value)) {
    const items = value.map(normalize).filter((item) => item !== undefined)
    // URL·모임·키워드 배열은 순서와 중복에 관계없이 같은 문서로 취급합니다.
    const unique = [...new Set(items.map((item) => JSON.stringify(item)))].sort()
    return unique.length ? unique.map((item) => JSON.parse(item) as Json) : undefined
  }

  const entries: [string, Json][] = []
  for (const key of Object.keys(value).sort()) {
    const item = normalize(value[key])
    if (item !== undefined) entries.push([key, item])
  }
  return entries.length ? Object.fromEntries(entries) : undefined
}

function plainText(html: string): string {
  let text = ''
  let hidden = 0
  const parser = new Parser({
    onopentag(name) {
      if (name === 'script' || name === 'style') hidden++
      if (/^(p|div|br|li|h[1-6]|tr|td|section|blockquote)$/.test(name)) text += ' '
    },
    ontext(value) {
      if (!hidden) text += value
    },
    onclosetag(name) {
      if (name === 'script' || name === 'style') hidden--
      if (/^(p|div|li|h[1-6]|tr|td|section|blockquote)$/.test(name)) text += ' '
    },
  })
  parser.end(html)
  return text.normalize('NFC').replace(/\s+/g, ' ').trim()
}
