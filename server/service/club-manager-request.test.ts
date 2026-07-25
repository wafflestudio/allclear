import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../provider', () => ({
  Inject: () => () => undefined,
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { NotFoundError } from '../domain/error'
import { ClubService } from './club.service'

describe('ClubService.getClubManagerRequest', () => {
  const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
  const serviceUserId = 'beee3485-6f87-4db0-b69f-c300f7c47291'
  let service: ClubService
  let findOne: ReturnType<typeof vi.fn>

  beforeEach(() => {
    service = new ClubService()
    findOne = vi.fn()
    Object.assign(service, {
      clubManagerRegisterRequestRepository: { findOne },
    })
  })

  it('returns the latest pending request without querying rejected requests', async () => {
    findOne.mockResolvedValueOnce({
      name: '홍길동',
      phone: '010-1234-5678',
      studentId: '2021-12345',
    })

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).resolves.toEqual({
      name: '홍길동',
      phone: '010-1234-5678',
      student_id: '2021-12345',
    })
    expect(findOne).toHaveBeenCalledTimes(1)
    expect(findOne).toHaveBeenCalledWith({
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: 'PENDING',
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    })
  })

  it('falls back to the latest rejected request using both ownership conditions', async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      name: '김와플',
      phone: '010-9876-5432',
      studentId: '2022-54321',
    })

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).resolves.toEqual({
      name: '김와플',
      phone: '010-9876-5432',
      student_id: '2022-54321',
    })
    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: {
        clubId: clubUuid,
        serviceUserId,
        status: 'REJECTED',
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    })
  })

  it('does not expose approved or other users requests when no editable request exists', async () => {
    findOne.mockResolvedValue(null)

    await expect(service.getClubManagerRequest(clubUuid, serviceUserId)).rejects.toBeInstanceOf(
      NotFoundError,
    )
    expect(findOne).toHaveBeenCalledTimes(2)
  })
})
