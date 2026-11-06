import { MongoClient } from 'mongodb'

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
