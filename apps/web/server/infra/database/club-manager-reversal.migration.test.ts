import 'reflect-metadata'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { DataSource, QueryFailedError } from 'typeorm'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../provider', () => ({
  InjectRepository: () => () => undefined,
  Service: () => undefined,
}))

import { ConflictError } from '../../domain/error'
import type { User } from '../../domain/model/User'
import {
  ClubManagerTransferService,
  hashManagerTransferToken,
} from '../../service/club-manager-transfer.service'
import {
  ClubEntity,
  ClubManagerEntity,
  ClubManagerTransferInvitationEntity,
  UserNotificationEntity,
} from './entities'
import { CollegeMajorEntity } from './entities/college-major.entity'

const testDatabaseUrl = process.env.TEST_DATABASE_URL
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip

const clubUuid = '4dfcd19f-9f20-4128-8b4c-b76deab4b65d'
const firstManagerServiceUserId = 'beee3485-6f87-4db0-b69f-c300f7c47291'
const secondManagerServiceUserId = 'f293f05e-7a0f-4da5-b028-aa8ba84c26a2'
const thirdManagerServiceUserId = '04cc77e4-b65d-4df5-b4d6-3a52bdd49974'

const createUser = (serviceUserId: string, name: string): User => ({
  id: randomUUID(),
  serviceUserId,
  nickname: name,
  name,
  phone: '',
  email: '',
  collegeMajor: null,
  admissionClass: 23,
})

describeWithPostgres('club manager reversal migration (PostgreSQL)', () => {
  const databaseName = `allclear_manager_transfer_${process.pid}_${randomUUID().slice(0, 8)}`
  let adminDataSource: DataSource
  let testDataSource: DataSource
  let transferService: ClubManagerTransferService

  beforeAll(async () => {
    adminDataSource = new DataSource({ type: 'postgres', url: testDatabaseUrl })
    await adminDataSource.initialize()
    await adminDataSource.query(`CREATE DATABASE "${databaseName}"`)

    const databaseUrl = new URL(testDatabaseUrl as string)
    databaseUrl.pathname = `/${databaseName}`
    testDataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl.toString(),
      entities: [
        ClubEntity,
        ClubManagerEntity,
        ClubManagerTransferInvitationEntity,
        CollegeMajorEntity,
        UserNotificationEntity,
      ],
      synchronize: true,
    })
    await testDataSource.initialize()
    await testDataSource.query(`
      ALTER TABLE public.club_manager
      ADD CONSTRAINT club_manager_clubid_serviceuserid UNIQUE (club_id, service_user_id)
    `)
    await testDataSource.query(`
      CREATE UNIQUE INDEX uq_club_manager_active_club
      ON public.club_manager (club_id)
      WHERE deleted_at IS NULL
    `)

    transferService = Object.create(
      ClubManagerTransferService.prototype,
    ) as ClubManagerTransferService
    Object.defineProperty(transferService, 'invitationRepository', {
      value: testDataSource.getRepository(ClubManagerTransferInvitationEntity),
    })
    Object.defineProperty(transferService, 'clubRepository', {
      value: testDataSource.getRepository(ClubEntity),
    })

    await testDataSource.getRepository(ClubEntity).insert({
      uuid: clubUuid,
      name: '와플스튜디오',
    })
    await testDataSource.getRepository(ClubManagerEntity).insert({
      clubId: clubUuid,
      serviceUserId: firstManagerServiceUserId,
      name: '첫 관리자',
      phone: '',
      studentId: '23학번',
    })
  }, 60_000)

  afterAll(async () => {
    if (testDataSource?.isInitialized) {
      await testDataSource.destroy()
    }
    if (adminDataSource?.isInitialized) {
      await adminDataSource.query(
        'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1',
        [databaseName],
      )
      await adminDataSource.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
      await adminDataSource.destroy()
    }
  })

  it('allows A -> B -> A while preserving one active manager and acceptance atomicity', async () => {
    const invitationRepository = testDataSource.getRepository(ClubManagerTransferInvitationEntity)
    const firstToken = 'a'.repeat(43)
    await invitationRepository.insert({
      clubId: clubUuid,
      senderServiceUserId: firstManagerServiceUserId,
      tokenHash: hashManagerTransferToken(firstToken),
      expiresAt: '2099-01-01T00:00:00.000Z',
      revokedAt: null,
      acceptedByServiceUserId: null,
      acceptedAt: null,
    })

    await transferService.acceptInvitation(
      firstToken,
      createUser(secondManagerServiceUserId, '두 번째 관리자'),
    )

    const reversalToken = 'b'.repeat(43)
    await invitationRepository.insert({
      clubId: clubUuid,
      senderServiceUserId: secondManagerServiceUserId,
      tokenHash: hashManagerTransferToken(reversalToken),
      expiresAt: '2099-01-01T00:00:00.000Z',
      revokedAt: null,
      acceptedByServiceUserId: null,
      acceptedAt: null,
    })

    await expect(
      transferService.acceptInvitation(
        reversalToken,
        createUser(firstManagerServiceUserId, '첫 관리자'),
      ),
    ).rejects.toBeInstanceOf(ConflictError)

    const stateAfterFailedReversal = await testDataSource.query<Array<{ service_user_id: string }>>(
      'SELECT service_user_id FROM public.club_manager WHERE club_id = $1 AND deleted_at IS NULL',
      [clubUuid],
    )
    expect(stateAfterFailedReversal).toEqual([{ service_user_id: secondManagerServiceUserId }])
    const pendingInvitation = await invitationRepository.findOneByOrFail({
      tokenHash: hashManagerTransferToken(reversalToken),
    })
    expect(pendingInvitation.acceptedAt).toBeNull()
    expect(pendingInvitation.acceptedByServiceUserId).toBeNull()

    const migrationSql = await readFile(
      new URL('../../../sql/260904_club_manager_reversal.sql', import.meta.url),
      'utf8',
    )
    await testDataSource.query(migrationSql)

    await expect(
      transferService.acceptInvitation(
        reversalToken,
        createUser(firstManagerServiceUserId, '첫 관리자'),
      ),
    ).resolves.toEqual({ club_uuid: clubUuid, club_name: '와플스튜디오' })

    const managerHistory = await testDataSource.query<
      Array<{ service_user_id: string; is_active: boolean }>
    >(
      `SELECT service_user_id, deleted_at IS NULL AS is_active
       FROM public.club_manager
       WHERE club_id = $1
       ORDER BY id`,
      [clubUuid],
    )
    expect(managerHistory).toEqual([
      { service_user_id: firstManagerServiceUserId, is_active: false },
      { service_user_id: secondManagerServiceUserId, is_active: false },
      { service_user_id: firstManagerServiceUserId, is_active: true },
    ])

    const notificationCountAfterReversal = await testDataSource
      .getRepository(UserNotificationEntity)
      .count()
    await expect(
      transferService.acceptInvitation(
        reversalToken,
        createUser(firstManagerServiceUserId, '첫 관리자'),
      ),
    ).resolves.toEqual({ club_uuid: clubUuid, club_name: '와플스튜디오' })
    expect(await testDataSource.getRepository(UserNotificationEntity).count()).toBe(
      notificationCountAfterReversal,
    )

    let activeManagerConflict: unknown
    try {
      await testDataSource.getRepository(ClubManagerEntity).insert({
        clubId: clubUuid,
        serviceUserId: thirdManagerServiceUserId,
        name: '세 번째 관리자',
        phone: '',
        studentId: '23학번',
      })
    } catch (error) {
      activeManagerConflict = error
    }
    expect(activeManagerConflict).toBeInstanceOf(QueryFailedError)
    expect(
      (
        activeManagerConflict as QueryFailedError & {
          driverError: { code: string; constraint: string }
        }
      ).driverError,
    ).toMatchObject({ code: '23505', constraint: 'uq_club_manager_active_club' })
  }, 30_000)
})
