import { MongoClient, ObjectId } from 'mongodb'

export const SUBMISSIONS_PAGE_SIZE = 25

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

export async function listSubmissions(page) {
  const collection = await getSubmissionsCollection()
  const documents = await collection
    .find({}, { projection: { form: 1, submittedAt: 1 } })
    .sort({ submittedAt: -1, _id: -1 })
    .skip((page - 1) * SUBMISSIONS_PAGE_SIZE)
    .limit(SUBMISSIONS_PAGE_SIZE + 1)
    .toArray()

  return {
    submissions: documents.slice(0, SUBMISSIONS_PAGE_SIZE),
    hasNextPage: documents.length > SUBMISSIONS_PAGE_SIZE
  }
}

export async function getSubmission(id) {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return null
  }

  const collection = await getSubmissionsCollection()
  return collection.findOne({ _id: new ObjectId(id) })
}
