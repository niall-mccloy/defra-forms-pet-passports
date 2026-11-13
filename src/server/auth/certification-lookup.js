import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { config } from '~/src/config/config.js'

/**
 * @param {string} subject
 * @param {string} relationshipId
 * @returns {Promise<boolean>} Whether the user is certified for the given relationship
 */
export async function isCertifiedVet(subject, relationshipId) {
  if (!['development', 'test'].includes(config.get('env'))) {
    throw new Error(
      'JSON certification lookup is only available in development and test environments'
    )
  }

  const filePath = path.join(
    config.get('root'),
    '.local-data',
    'certified-vets.json'
  )
  const records = JSON.parse(await readFile(filePath, 'utf8'))

  if (!Array.isArray(records)) {
    throw new Error('Certification data must be an array')
  }

  const seen = new Set()

  for (const record of records) {
    if (
      !record ||
      typeof record !== 'object' ||
      typeof record.defraIdSubject !== 'string' ||
      typeof record.relationshipId !== 'string' ||
      !record.relationshipId ||
      typeof record.certified !== 'boolean'
    ) {
      throw new Error('Invalid certification record')
    }

    const key = JSON.stringify([record.defraIdSubject, record.relationshipId])

    if (seen.has(key)) {
      throw new Error('Duplicate certification record')
    }

    seen.add(key)
  }

  return records.some(
    (record) =>
      record.defraIdSubject === subject &&
      record.relationshipId === relationshipId &&
      record.certified === true
  )
}
