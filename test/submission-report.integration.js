/* eslint-disable no-void -- node:test registers asynchronous tests without awaiting them */
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, afterEach, before, describe, it } from 'node:test'
import { MongoClient } from 'mongodb'

import * as store from '../src/server/submission-store.js'

const mongoUri = process.env.TEST_MONGODB_URI

void describe(
  'submission reporting against MongoDB',
  { skip: !mongoUri },
  () => {
    let client
    let collection
    const originalUri = process.env.MONGODB_URI
    const originalDatabase = process.env.MONGODB_DATABASE
    const database = `dashboard_test_${randomUUID().replaceAll('-', '')}`

    before(async () => {
      const url = new URL(mongoUri)
      if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
        throw new Error('Integration tests require a local MongoDB instance')
      }
      process.env.MONGODB_URI = mongoUri
      process.env.MONGODB_DATABASE = database
      client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 })
      await client.connect()
      collection = client.db(database).collection('submissions')
    })

    afterEach(async () => {
      if (collection) {
        await collection.deleteMany({})
      }
    })

    after(async () => {
      await store.closeSubmissionStore()
      if (collection) {
        const collections = await client
          .db(database)
          .listCollections({ name: 'submissions' })
          .toArray()
        if (collections.length) {
          await collection.drop()
        }
      }
      if (client) {
        await client.close()
      }
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
    })

    void it('counts forms and London periods, excluding malformed and future timestamps', async () => {
      await collection.insertMany([
        {
          form: { id: 'a', title: 'Old name' },
          submittedAt: '2026-03-28T23:59:59.999Z'
        },
        {
          form: { id: 'a', title: 'New name' },
          submittedAt: '2026-03-29T00:00:00.000Z'
        },
        {
          form: { id: 'b', slug: 'historic' },
          submittedAt: '2026-03-22T23:59:59.999Z'
        },
        { form: { id: 'b' }, submittedAt: '2026-03-29T12:00:00.001Z' },
        { form: {}, submittedAt: 'invalid' },
        { form: { id: '' }, submittedAt: '2026-03-01T00:00:00.000Z' },
        { form: { id: 0 }, submittedAt: new Date('2026-03-29T12:00:00.000Z') }
      ])
      const report = await store.getSubmissionReport(
        new Date('2026-03-29T12:00:00.000Z')
      )
      assert.deepEqual(report.totals, {
        _id: null,
        submissions: 7,
        unattributed: 3,
        today: 2,
        week: 3,
        month: 5
      })
      assert.deepEqual(report.forms, [
        { _id: 'a', title: 'New name', count: 2 },
        { _id: 'b', title: 'b', count: 2 }
      ])
      assert.equal(report.recent.length, 7)
      assert.equal(report.recent[0].submittedAt, '2026-03-29T12:00:00.001Z')
      assert.equal((await store.listFormSubmissions('a', 1)).count, 2)
      assert.equal((await store.listFormSubmissions(null, 1)).count, 3)
      assert.equal((await store.listFormSubmissions('$form.id', 1)).count, 0)
    })

    for (const [label, now, start] of [
      [
        'spring transition',
        '2026-03-30T12:00:00.000Z',
        '2026-03-29T23:00:00.000Z'
      ],
      [
        'autumn transition',
        '2026-10-26T12:00:00.000Z',
        '2026-10-26T00:00:00.000Z'
      ]
    ]) {
      void it(`uses the correct Monday and day boundary after the ${label}`, async () => {
        const boundary = new Date(start)
        await collection.insertMany([
          {
            form: { id: 'a' },
            submittedAt: new Date(boundary.getTime() - 1).toISOString()
          },
          { form: { id: 'a' }, submittedAt: boundary.toISOString() }
        ])
        const report = await store.getSubmissionReport(new Date(now))
        assert.equal(report.totals.today, 1)
        assert.equal(report.totals.week, 1)
        assert.equal(report.totals.month, 2)
      })
    }

    void it('uses UK boundaries on the autumn clock change and for the month', async () => {
      await collection.insertMany([
        { submittedAt: '2026-10-24T22:59:59.999Z' },
        { submittedAt: '2026-10-24T23:00:00.000Z' },
        { submittedAt: '2026-09-30T22:59:59.999Z' },
        { submittedAt: '2026-09-30T23:00:00.000Z' },
        { submittedAt: '2026-10-25T12:00:00.000Z' },
        { submittedAt: '2026-10-25T12:00:00.001Z' }
      ])
      const report = await store.getSubmissionReport(
        new Date('2026-10-25T12:00:00.000Z')
      )
      assert.equal(report.totals.today, 2)
      assert.equal(report.totals.week, 3)
      assert.equal(report.totals.month, 4)
    })

    void it('returns an empty report and paginates without loading answers', async () => {
      assert.deepEqual(await store.getSubmissionReport(new Date()), {
        totals: {
          submissions: 0,
          unattributed: 0,
          today: 0,
          week: 0,
          month: 0
        },
        forms: [],
        recent: []
      })
      await collection.insertMany(
        Array.from({ length: 26 }, (_, index) => ({
          form: { id: 'a' },
          submittedAt: '2026-01-01T00:00:00.000Z',
          answers: [{ value: index }]
        }))
      )
      const report = await store.getSubmissionReport(
        new Date('2026-01-02T00:00:00.000Z')
      )
      assert.equal(report.recent.length, 10)
      assert.equal(report.recent[0].answers, undefined)
      const page = await store.listFormSubmissions('a', 1)
      assert.equal(page.count, 26)
      assert.equal(page.submissions.length, 25)
      assert.equal(page.hasNextPage, true)
      assert.equal(page.submissions[0].answers, undefined)
      assert.equal(
        (await store.listFormSubmissions('a', 2)).submissions.length,
        1
      )
    })
  }
)
