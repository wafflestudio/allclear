const GUEST_ID_KEY = 'allclear-guest-id'

/**
 * 앱의 x-guest-id와 동일한 역할: 익명 사용자를 식별하는 영속 UUID.
 * 비로그인 사용자의 최근 검색어 저장·조회에 사용한다. 검색 자체에는 필수가 아니다.
 */
export function getGuestId(): string {
  let id = window.localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = window.crypto.randomUUID()
    window.localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}
