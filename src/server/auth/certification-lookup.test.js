import path from 'node:path'

import { readFile } from 'node:fs/promises'
import { config } from '~/src/config/config.js'

import { isCertifiedVet } from './certification-lookup.js'

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn()
}))

jest.mock('~/src/config/config.js', () => ({
  config: { get: jest.fn() }
}))

describe('isCertifiedVet', () => {
  const subject = 'test-user'
  const relationshipId = 'relationship-123'
  const root = '/test-root'
  const certificationFile = path.join(
    root,
    '.local-data',
    'certified-vets.json'
  )

  beforeEach(() => {
    config.get.mockImplementation((key) => {
      if (key === 'env') return 'test'
      if (key === 'root') return root
    })
    readFile.mockResolvedValue(
      JSON.stringify([
        {
          defraIdSubject: subject,
          relationshipId,
          certified: true
        }
      ])
    )
  })

  test('returns true for a certified user and relationship', async () => {
    await expect(isCertifiedVet(subject, relationshipId)).resolves.toBe(true)
    expect(readFile).toHaveBeenCalledWith(certificationFile, 'utf8')
  })

  test('returns false for an uncertified user', async () => {
    readFile.mockResolvedValue(
      JSON.stringify([
        {
          defraIdSubject: subject,
          relationshipId,
          certified: false
        }
      ])
    )

    await expect(isCertifiedVet(subject, relationshipId)).resolves.toBe(false)
  })

  test('returns false for an unknown user', async () => {
    await expect(isCertifiedVet('unknown-user', relationshipId)).resolves.toBe(
      false
    )
  })

  test('returns false when the user has a different relationship', async () => {
    await expect(isCertifiedVet(subject, 'other-relationship')).resolves.toBe(
      false
    )
  })

  test('rejects invalid certification data', async () => {
    readFile.mockResolvedValue(JSON.stringify([{ defraIdSubject: subject }]))

    await expect(isCertifiedVet(subject, relationshipId)).rejects.toThrow(
      'Invalid certification record'
    )
  })

  test('refuses to read certification data in production', async () => {
    config.get.mockImplementation((key) => {
      if (key === 'env') return 'production'
      if (key === 'root') return root
    })

    await expect(isCertifiedVet(subject, relationshipId)).rejects.toThrow(
      'JSON certification lookup is only available in development and test environments'
    )
    expect(readFile).not.toHaveBeenCalled()
  })
})
