import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './utils/meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on searchable attributes',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(uid)
    })

    test(`${permission} key: Get default attributes for filtering`, async () => {
      const client = await getClient(permission)
      const response: string[] = await client
        .index(index.uid)
        .getFilterableAttributes()
      expect(response.sort()).toEqual([])
    })

    test(`${permission} key: Update attributes for filtering`, async () => {
      const client = await getClient(permission)
      const newFilterableAttributes = ['genre']
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateFilterableAttributes(newFilterableAttributes)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getFilterableAttributes()
      expect(response).toEqual(newFilterableAttributes)
    })

    test(`${permission} key: Update attributes for filtering at null`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateFilterableAttributes(null)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getFilterableAttributes()
      expect(response.sort()).toEqual([])
    })

    test(`${permission} key: Reset attributes for filtering`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetFilterableAttributes()
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getFilterableAttributes()
      expect(response.sort()).toEqual([])
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on attributes for filtering',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: try to get attributes for filtering and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getFilterableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateFilterableAttributes([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetFilterableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on attributes for filtering',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: try to get attributes for filtering and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getFilterableAttributes()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateFilterableAttributes([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetFilterableAttributes()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getFilterableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateFilterableAttributes([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetFilterableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
