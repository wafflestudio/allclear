// 검색문을 낱말로 나누고, 조사가 붙은 낱말에서 조사를 뗍니다.

export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/)
}

// 낱말 끝에 붙은 문장부호입니다. 예: "동아리?"
const TRAILING_PUNCTUATION = /[.,!?~]+$/
const HANGUL = /[가-힣]/

// 낱말 그대로와, 뒤에 붙은 한글을 한 글자씩 뗀 꼴들입니다. 덜 뗀 꼴이 먼저 나옵니다.
// 어디까지가 조사인지 모르므로, shortestStem 글자가 남을 때까지 떼어 봅니다.
// 예: formsOf("동아리에서?", 3) → 동아리에서, 동아리에, 동아리
export function formsOf(word: string, shortestStem: number): string[] {
  let form = word.replace(TRAILING_PUNCTUATION, '').toLowerCase()
  const forms = [form]

  while (form.length > shortestStem && HANGUL.test(form.slice(-1))) {
    form = form.slice(0, -1)
    forms.push(form)
  }
  return forms
}
