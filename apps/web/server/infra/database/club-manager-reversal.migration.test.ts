import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../provider', () => ({ Service: () => undefined }))
const { prismaHolder } = vi.hoisted(() => ({
  prismaHolder: { client: null as PrismaClient | null },
}))
vi.mock('./prisma', () => ({ getPrismaClient: () => prismaHolder.client }))

import { ConflictError } from '../../domain/error'
import type { User } from '../../domain/model/User'
import {
  ClubManagerTransferService,
  hashManagerTransferToken,
} from '../../service/club-manager-transfer.service'
import { PrismaClient } from './generated/prisma/client'

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
  let adminClient: Client
  let testClient: Client
  let transferService: ClubManagerTransferService
  let adminConnected = false
  let testConnected = false
  let databaseCreated = false

  beforeAll(async () => {
    adminClient = new Client({ connectionString: testDatabaseUrl })
    await adminClient.connect()
    adminConnected = true
    await adminClient.query(`CREATE DATABASE "${databaseName}"`)
    databaseCreated = true

    const databaseUrl = new URL(testDatabaseUrl as string)
    databaseUrl.pathname = `/${databaseName}`
    testClient = new Client({ connectionString: databaseUrl.toString() })
    await testClient.connect()
    testConnected = true
    await testClient.query(`
      CREATE TABLE club (
        uuid UUID PRIMARY KEY,
        name VARCHAR NOT NULL,
        deleted_at TIMESTAMP(6)
      );
      CREATE TABLE club_manager (
        id SERIAL PRIMARY KEY,
        club_id UUID NOT NULL,
        service_user_id UUID NOT NULL,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        deleted_at TIMESTAMP(6),
        name VARCHAR NOT NULL DEFAULT '',
        phone VARCHAR NOT NULL DEFAULT '',
        student_id VARCHAR NOT NULL DEFAULT '',
        CONSTRAINT club_manager_clubid_serviceuserid UNIQUE (club_id, service_user_id)
      );
      CREATE UNIQUE INDEX uq_club_manager_active_club
        ON club_manager (club_id) WHERE deleted_at IS NULL;
      CREATE TABLE club_manager_transfer_invitation (
        id BIGSERIAL PRIMARY KEY,
        club_id UUID NOT NULL,
        sender_service_user_id UUID NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ(6) NOT NULL,
        revoked_at TIMESTAMPTZ(6),
        accepted_by_service_user_id UUID,
        accepted_at TIMESTAMPTZ(6),
        created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE user_notification (
        id BIGSERIAL PRIMARY KEY,
        service_user_id UUID NOT NULL,
        type VARCHAR NOT NULL,
        club_id UUID,
        source_type VARCHAR NOT NULL,
        source_id VARCHAR NOT NULL,
        read_at TIMESTAMPTZ(6),
        created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `)

    prismaHolder.client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl.toString() }),
    })
    transferService = new ClubManagerTransferService()

    await testClient.query('INSERT INTO club (uuid, name) VALUES ($1, $2)', [
      clubUuid,
      '와플스튜디오',
    ])
    await testClient.query(
      `INSERT INTO club_manager (club_id, service_user_id, name, phone, student_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [clubUuid, firstManagerServiceUserId, '첫 관리자', '', '23학번'],
    )
  }, 60_000)

  afterAll(async () => {
    await prismaHolder.client?.$disconnect()
    if (testConnected) {
      await testClient.end()
    }
    if (adminConnected) {
      if (databaseCreated) {
        await adminClient.query(
          'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1',
          [databaseName],
        )
        await adminClient.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
      }
      await adminClient.end()
    }
  })

  it('allows A -> B -> A while preserving one active manager and acceptance atomicity', async () => {
    const firstToken = 'a'.repeat(43)
    await testClient.query(
      `INSERT INTO club_manager_transfer_invitation
       (club_id, sender_service_user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [clubUuid, firstManagerServiceUserId, hashManagerTransferToken(firstToken), '2099-01-01'],
    )

    await transferService.acceptInvitation(
      firstToken,
      createUser(secondManagerServiceUserId, '두 번째 관리자'),
    )

    const reversalToken = 'b'.repeat(43)
    await testClient.query(
      `INSERT INTO club_manager_transfer_invitation
       (club_id, sender_service_user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [clubUuid, secondManagerServiceUserId, hashManagerTransferToken(reversalToken), '2099-01-01'],
    )

    await expect(
      transferService.acceptInvitation(
        reversalToken,
        createUser(firstManagerServiceUserId, '첫 관리자'),
      ),
    ).rejects.toBeInstanceOf(ConflictError)

    const stateAfterFailedReversal = await testClient.query<{ service_user_id: string }>(
      'SELECT service_user_id FROM club_manager WHERE club_id = $1 AND deleted_at IS NULL',
      [clubUuid],
    )
    expect(stateAfterFailedReversal.rows).toEqual([{ service_user_id: secondManagerServiceUserId }])
    const pendingInvitation =
      await prismaHolder.client?.club_manager_transfer_invitation.findUnique({
        where: { token_hash: hashManagerTransferToken(reversalToken) },
      })
    expect(pendingInvitation?.accepted_at).toBeNull()
    expect(pendingInvitation?.accepted_by_service_user_id).toBeNull()

    const migrationSql = await readFile(
      new URL('../../../sql/260904_club_manager_reversal.sql', import.meta.url),
      'utf8',
    )
    await testClient.query(migrationSql)

    await expect(
      transferService.acceptInvitation(
        reversalToken,
        createUser(firstManagerServiceUserId, '첫 관리자'),
      ),
    ).resolves.toEqual({ club_uuid: clubUuid, club_name: '와플스튜디오' })

    const managerHistory = await testClient.query<{
      service_user_id: string
      is_active: boolean
    }>(
      `SELECT service_user_id, deleted_at IS NULL AS is_active
       FROM club_manager WHERE club_id = $1 ORDER BY id`,
      [clubUuid],
    )
    expect(managerHistory.rows).toEqual([
      { service_user_id: firstManagerServiceUserId, is_active: false },
      { service_user_id: secondManagerServiceUserId, is_active: false },
      { service_user_id: firstManagerServiceUserId, is_active: true },
    ])

    const notificationCountAfterReversal = await testClient.query<{ count: string }>(
      'SELECT count(*) AS count FROM user_notification',
    )
    await expect(
      transferService.acceptInvitation(
        reversalToken,
        createUser(firstManagerServiceUserId, '첫 관리자'),
      ),
    ).resolves.toEqual({ club_uuid: clubUuid, club_name: '와플스튜디오' })
    const notificationCountAfterRepeat = await testClient.query<{ count: string }>(
      'SELECT count(*) AS count FROM user_notification',
    )
    expect(notificationCountAfterRepeat.rows).toEqual(notificationCountAfterReversal.rows)

    let activeManagerConflict: unknown
    try {
      await testClient.query(
        `INSERT INTO club_manager (club_id, service_user_id, name, phone, student_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [clubUuid, thirdManagerServiceUserId, '세 번째 관리자', '', '23학번'],
      )
    } catch (error) {
      activeManagerConflict = error
    }
    expect(activeManagerConflict).toMatchObject({
      code: '23505',
      constraint: 'uq_club_manager_active_club',
    })
  }, 30_000)
})
