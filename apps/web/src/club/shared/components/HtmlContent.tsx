import { useEffect, useState } from 'react'

// quill 에디터 출력물에서 쓰이는 태그만 허용
const KEEP_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'A',
  'OL',
  'UL',
  'LI',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'SPAN',
  'DIV',
  'IMG',
])

// 내용까지 통째로 제거할 태그
const DROP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'LINK',
  'META',
  'FORM',
  'INPUT',
  'BUTTON',
  'TEXTAREA',
  'SELECT',
  'SVG',
  'MATH',
  'TEMPLATE',
  'AUDIO',
  'VIDEO',
  'SOURCE',
])

function isSafeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function sanitizeElement(el: Element) {
  for (const child of Array.from(el.children)) {
    const tag = child.tagName.toUpperCase()

    if (DROP_TAGS.has(tag)) {
      child.remove()
      continue
    }

    sanitizeElement(child)

    if (!KEEP_TAGS.has(tag)) {
      // 허용되지 않은 태그는 벗겨내고 (이미 정리된) 자식만 남긴다
      child.replaceWith(...Array.from(child.childNodes))
      continue
    }

    for (const attr of Array.from(child.attributes)) {
      const keep =
        (tag === 'A' && attr.name === 'href' && isSafeUrl(attr.value)) ||
        (tag === 'IMG' && attr.name === 'src' && isSafeUrl(attr.value)) ||
        (tag === 'IMG' && attr.name === 'alt')
      if (!keep) child.removeAttribute(attr.name)
    }

    if (tag === 'A') {
      child.setAttribute('target', '_blank')
      child.setAttribute('rel', 'noopener noreferrer')
    }
    if (tag === 'IMG') {
      child.setAttribute('class', 'max-w-full h-auto rounded-lg')
      if (!child.getAttribute('src')) {
        child.remove()
      }
    }
  }
}

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  sanitizeElement(doc.body)
  return doc.body.innerHTML
}

/**
 * 클라이언트에서 새니타이즈된 HTML을 반환한다.
 * SSR/하이드레이션 첫 렌더에서는 null (DOMParser는 브라우저 전용).
 */
export function useSanitizedHtml(html: string): string | null {
  const [safeHtml, setSafeHtml] = useState<string | null>(null)

  useEffect(() => {
    // 앱의 HtmlView와 동일한 전처리: 이중 줄바꿈 방지
    setSafeHtml(sanitizeHtml(html.replace(/<br \/>\n/g, '\n')))
  }, [html])

  return safeHtml
}

// 앱의 HtmlView 기본 타이포그래피: 12/400/18, #757474, p 마진 제거
export const HTML_CONTENT_CLASS =
  'whitespace-pre-wrap break-words text-[12px] font-normal leading-[18px] text-[#757474] [&_p]:m-0 [&_p]:p-0'

type Props = {
  html: string
  className?: string
}

/**
 * 동아리 소개/모집공고 HTML 렌더러.
 * XSS 방지를 위해 클라이언트에서 DOM 기반 새니타이즈 후 주입한다.
 */
export function HtmlContent({ html, className }: Props) {
  const safeHtml = useSanitizedHtml(html)

  if (safeHtml === null) return null

  return (
    <div
      className={`${HTML_CONTENT_CLASS} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  )
}
