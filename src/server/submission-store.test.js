import { ObjectId } from 'mongodb'

jest.mock('mongodb', () => ({
  ...jest.requireActual('mongodb'),
  MongoClient: jest.fn()
}))

describe('submission store', () => {
  let store
  let collection
  let cursor
  let connect
  let db
  const originalUri = process.env.MONGODB_URI
  const originalDatabase = process.env.MONGODB_DATABASE

  beforeEach(async () => {
    const { MongoClient } = await import('mongodb')
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017'
    delete process.env.MONGODB_DATABASE
    collection = {
      insertOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn()
    }
    cursor = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([])
    }
    collection.find.mockReturnValue(cursor)
    connect = jest.fn().mockResolvedValue(undefined)
    db = jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue(collection)
    })
    MongoClient.mockImplementation(() => ({ connect, db }))
    store = await import('./submission-store.js')
  })

  afterEach(() => {
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI
    } else {
      process.env.MONGODB_URI = originalUri
    }
    if (originalDatabase === undefined) {
      delete process.env.MONGODB_DATABASE
    } else {
      process.env.MONGODB_DATABASE = originalDatabase
    }
    jest.resetModules()
  })

  test('preserves writes and reuses the connection for reads', async () => {
    const document = { answers: [], submittedAt: '2026-11-11T12:00:00Z' }
    await expect(store.saveSubmission(document)).resolves.toEqual({
      acknowledged: true
    })
    await store.listSubmissions(1)
    expect(collection.insertOne).toHaveBeenCalledWith(document)
    expect(connect).toHaveBeenCalledTimes(1)
    expect(db).toHaveBeenCalledWith('pet_passports')
  })

  test('uses the configured database', async () => {
    process.env.MONGODB_DATABASE = 'viewer_test'
    await store.listSubmissions(1)
    expect(db).toHaveBeenCalledWith('viewer_test')
  })

  test('reads 25 summaries with a next-page sentinel and stable ordering', async () => {
    const documents = Array.from({ length: 26 }, (_, index) => ({ index }))
    cursor.toArray.mockResolvedValue(documents)
    await expect(store.listSubmissions(2)).resolves.toEqual({
      submissions: documents.slice(0, 25),
      hasNextPage: true
    })
    expect(collection.find).toHaveBeenCalledWith(
      {},
      { projection: { form: 1, submittedAt: 1 } }
    )
    expect(cursor.sort).toHaveBeenCalledWith({ submittedAt: -1, _id: -1 })
    expect(cursor.skip).toHaveBeenCalledWith(25)
    expect(cursor.limit).toHaveBeenCalledWith(26)
  })

  test.each([0, 25])('has no next page with %i results', async (length) => {
    cursor.toArray.mockResolvedValue(Array.from({ length }, () => ({})))
    expect((await store.listSubmissions(1)).hasNextPage).toBe(false)
  })

  test('looks up a detail by ObjectId and returns missing records as null', async () => {
    const id = '507f1f77bcf86cd799439011'
    collection.findOne.mockResolvedValue(null)
    await expect(store.getSubmission(id)).resolves.toBeNull()
    expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(id) })
  })

  test.each(['bad-id', 'abcdefghijklmnopqrstuvwx', '123'])(
    'rejects malformed ID %s without querying MongoDB',
    async (id) => {
      await expect(store.getSubmission(id)).resolves.toBeNull()
      expect(collection.findOne).not.toHaveBeenCalled()
    }
  )

  test('reports missing connection configuration', async () => {
    delete process.env.MONGODB_URI
    await expect(store.listSubmissions(1)).rejects.toThrow(
      'MONGODB_URI not set'
    )
  })

  test('propagates connection failures and permits a retry', async () => {
    connect.mockRejectedValueOnce(new Error('Connection failed'))
    await expect(store.listSubmissions(1)).rejects.toThrow('Connection failed')
    await expect(store.listSubmissions(1)).resolves.toEqual({
      submissions: [],
      hasNextPage: false
    })
    expect(connect).toHaveBeenCalledTimes(2)
  })

  test('propagates query failures', async () => {
    cursor.toArray.mockRejectedValue(new Error('Query failed'))
    await expect(store.listSubmissions(1)).rejects.toThrow('Query failed')
  })

  test('propagates reporting and filtered-count failures', async () => {
    collection.aggregate.mockReturnValue({
      toArray: jest.fn().mockRejectedValue(new Error('Aggregation failed'))
    })
    collection.countDocuments.mockRejectedValue(new Error('Count failed'))
    await expect(store.getSubmissionReport()).rejects.toThrow(
      'Aggregation failed'
    )
    await expect(store.listFormSubmissions('form-id', 1)).rejects.toThrow(
      'Count failed'
    )
  })
})
