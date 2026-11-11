import { MongoClient, ObjectId } from 'mongodb'

export const SUBMISSIONS_PAGE_SIZE = 25
export const RECENT_SUBMISSIONS_LIMIT = 10

const hasFormId = {
  $and: [{ $eq: [{ $type: '$form.id' }, 'string'] }, { $ne: ['$form.id', ''] }]
}

let client
let connection

async function getSubmissionsCollection() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI not set')
  }

  client ??= new MongoClient(uri)
  connection ??= client.connect().catch((error) => {
    connection = undefined
    throw error
  })

  await connection

  const database = process.env.MONGODB_DATABASE ?? 'pet_passports'
  return client.db(database).collection('submissions')
}

export async function saveSubmission(document) {
  const collection = await getSubmissionsCollection()
  return collection.insertOne(document)
}

export async function closeSubmissionStore() {
  if (client) {
    await client.close()
    client = undefined
    connection = undefined
  }
}

export async function listSubmissions(page) {
  return listSubmissionPage({}, page)
}

async function listSubmissionPage(filter, page) {
  const collection = await getSubmissionsCollection()
  const documents = await collection
    .find(filter, { projection: { form: 1, submittedAt: 1 } })
    .sort({ submittedAt: -1, _id: -1 })
    .skip((page - 1) * SUBMISSIONS_PAGE_SIZE)
    .limit(SUBMISSIONS_PAGE_SIZE + 1)
    .toArray()

  return {
    submissions: documents.slice(0, SUBMISSIONS_PAGE_SIZE),
    hasNextPage: documents.length > SUBMISSIONS_PAGE_SIZE
  }
}

export async function listFormSubmissions(formId, page) {
  const filter =
    formId === null
      ? { $expr: { $not: [hasFormId] } }
      : {
          'form.id': formId,
          $expr: hasFormId
        }
  const collection = await getSubmissionsCollection()
  const count = await collection.countDocuments(filter)
  const result = await listSubmissionPage(filter, page)
  return { ...result, count }
}

export async function getSubmissionReport(now = new Date()) {
  const collection = await getSubmissionsCollection()
  const startOf = (unit) => ({
    $dateTrunc: {
      date: now,
      unit,
      timezone: 'Europe/London',
      ...(unit === 'week' ? { startOfWeek: 'monday' } : {})
    }
  })
  const withinPeriod = (unit) => ({
    $cond: [
      {
        $and: [
          { $ne: ['$reportDate', null] },
          { $gte: ['$reportDate', startOf(unit)] },
          { $lte: ['$reportDate', now] }
        ]
      },
      1,
      0
    ]
  })
  const [report] = await collection
    .aggregate([
      {
        $project: {
          form: 1,
          submittedAt: 1,
          hasFormId,
          reportDate: {
            $cond: [
              { $in: [{ $type: '$submittedAt' }, ['string', 'date']] },
              {
                $convert: {
                  input: '$submittedAt',
                  to: 'date',
                  onError: null,
                  onNull: null
                }
              },
              null
            ]
          }
        }
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                submissions: { $sum: 1 },
                unattributed: { $sum: { $cond: ['$hasFormId', 0, 1] } },
                today: { $sum: withinPeriod('day') },
                week: { $sum: withinPeriod('week') },
                month: { $sum: withinPeriod('month') }
              }
            }
          ],
          forms: [
            { $match: { hasFormId: true } },
            {
              $set: {
                label: {
                  $cond: [
                    {
                      $and: [
                        { $eq: [{ $type: '$form.title' }, 'string'] },
                        { $ne: ['$form.title', ''] }
                      ]
                    },
                    '$form.title',
                    {
                      $cond: [
                        {
                          $and: [
                            { $eq: [{ $type: '$form.slug' }, 'string'] },
                            { $ne: ['$form.slug', ''] }
                          ]
                        },
                        '$form.slug',
                        '$form.id'
                      ]
                    }
                  ]
                }
              }
            },
            { $sort: { reportDate: -1, _id: -1 } },
            {
              $group: {
                _id: '$form.id',
                title: { $first: '$label' },
                count: { $sum: 1 }
              }
            },
            { $sort: { title: 1, _id: 1 } }
          ],
          recent: [
            { $sort: { reportDate: -1, _id: -1 } },
            { $limit: RECENT_SUBMISSIONS_LIMIT },
            { $project: { form: 1, submittedAt: 1 } }
          ]
        }
      }
    ])
    .toArray()
  return {
    totals: report.totals[0] ?? {
      submissions: 0,
      unattributed: 0,
      today: 0,
      week: 0,
      month: 0
    },
    forms: report.forms,
    recent: report.recent
  }
}

export async function getSubmission(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return null
  }

  const collection = await getSubmissionsCollection()
  return collection.findOne({ _id: new ObjectId(id) })
}
