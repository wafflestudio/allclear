const GUEST_ID_KEY = 'allclear-guest-id'

/**
 * 앱의 x-guest-id와 동일한 역할: 익명 사용자를 식별하는 영속 UUID.
 * /api/v2/clubs/search 는 비로그인 시 이 헤더가 필수다.
 */
export function getGuestId(): string {
  let id = window.localStorage.getItem(GUEST_ID_KEY)
  if (!id) {
    id = window.crypto.randomUUID()
    window.localStorage.setItem(GUEST_ID_KEY, id)
  }
  return id
}
