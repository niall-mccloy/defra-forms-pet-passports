import Boom from '@hapi/boom'
import { readFileSync } from 'node:fs'

import { parse as parseYaml } from 'yaml'

import { saveSubmission } from './submission-store.js'

const petPassportsDefinition = parseYaml(
  readFileSync(new URL('./forms/pet-passports.yaml', import.meta.url), 'utf8')
)
const petPassportsForecastingDefinition = parseYaml(
  readFileSync(
    new URL('./forms/pet-passports-forecasting.yaml', import.meta.url),
    'utf8'
  )
)
const orderPetPassportsDefinition = parseYaml(
  readFileSync(
    new URL('./forms/order-pet-passports.yaml', import.meta.url),
    'utf8'
  )
)
const reportPetPassportDamageDefinition = parseYaml(
  readFileSync(
    new URL('./forms/report-pet-passport-damage.yaml', import.meta.url),
    'utf8'
  )
)

/**
 * @import { FormStatus } from '@defra/forms-engine-plugin/types'
 */

// Form metadata
const now = new Date()
const user = { id: 'example-user', displayName: 'Example user' }

const author = {
  createdAt: now,
  createdBy: user,
  updatedAt: now,
  updatedBy: user
}

// EU pet passports landing page
const petPassportsMetadata = {
  id: '9e8f7d6c-5b4a-4321-9876-5f4e3d2c1b0a',
  slug: 'pet-passports',
  title: 'EU pet passports',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Pet passport forecasting form
const petPassportsForecastingMetadata = {
  id: 'a2345678-9abc-4def-8123-456789abcdef',
  slug: 'pet-passports-forecasting',
  title: 'Enter a forecast for pet passports',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance:
    'We will use this information to help plan future passport supply.\n\nYou do not need to take any further action.\n\n[Return to EU pet passports](/pet-passports/start)\n\n[What did you think of this service? (takes 30 seconds)](/form/feedback?formId=a2345678-9abc-4def-8123-456789abcdef)',
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Pet passport ordering form
const orderPetPassportsMetadata = {
  id: 'a2b3c4d5-e6f7-4890-a123-456789abcdef',
  slug: 'order-pet-passports',
  title: 'Order pet passports',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance:
    'We have sent your order to APHA. We will contact you with order updates, including an estimated delivery date.',
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Report damaged, destroyed, lost or incorrectly completed pet passports
const reportPetPassportDamageMetadata = {
  id: 'd623ce9a-cf52-44bc-8861-11a7a1c262f6',
  slug: 'report-pet-passport-damage',
  title:
    'Report a damaged, destroyed, lost or incorrectly completed pet passport',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance:
    'We will send this information to APHA.\n\nIf the passport was assigned to a pet, this is now invalid so you will need to update your records and issue a new passport to the pet.\n\n[Issue a pet passport to a pet](/pet-passports/start)',
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

const formsService = {
  getFormMetadata: function (slug) {
    switch (slug) {
      case petPassportsMetadata.slug:
        return Promise.resolve(petPassportsMetadata)
      case petPassportsForecastingMetadata.slug:
        return Promise.resolve(petPassportsForecastingMetadata)
      case orderPetPassportsMetadata.slug:
        return Promise.resolve(orderPetPassportsMetadata)
      case reportPetPassportDamageMetadata.slug:
        return Promise.resolve(reportPetPassportDamageMetadata)
      default:
        return Promise.reject(Boom.notFound())
    }
  },
  getFormMetadataById: function (id) {
    switch (id) {
      case petPassportsMetadata.id:
        return Promise.resolve(petPassportsMetadata)
      case petPassportsForecastingMetadata.id:
        return Promise.resolve(petPassportsForecastingMetadata)
      case orderPetPassportsMetadata.id:
        return Promise.resolve(orderPetPassportsMetadata)
      case reportPetPassportDamageMetadata.id:
        return Promise.resolve(reportPetPassportDamageMetadata)
      default:
        return Promise.reject(Boom.notFound())
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormDefinition: function (id, /** @type {FormStatus} */ _state) {
    switch (id) {
      case petPassportsMetadata.id:
        return Promise.resolve(petPassportsDefinition)
      case petPassportsForecastingMetadata.id:
        return Promise.resolve(petPassportsForecastingDefinition)
      case orderPetPassportsMetadata.id:
        return Promise.resolve(orderPetPassportsDefinition)
      case reportPetPassportDamageMetadata.id:
        return Promise.resolve(reportPetPassportDamageDefinition)
      default:
        return Promise.reject(Boom.notFound())
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getFormSecret: function (_formId, _secretName) {
    if (_formId !== orderPetPassportsMetadata.id) {
      return Promise.reject(Boom.notFound('Form secret not found'))
    }

    // Local PoC workaround:
    // The example UI exposes the form as "live", causing PaymentField to request
    // payment-live-api-key. We deliberately return the GOV.UK Pay TEST key.
    // Do not use this mapping in production.

    if (_secretName !== 'payment-live-api-key') {
      return Promise.reject(Boom.notFound('Form secret not found'))
    }

    const apiKey = process.env.GOVUK_PAY_TEST_API_KEY

    if (!apiKey) {
      return Promise.reject(Boom.internal('GOVUK_PAY_TEST_API_KEY not set'))
    }

    return Promise.resolve(apiKey)
  }
}

const formSubmissionService = {
  persistFiles: () => Promise.resolve({}),
  submit: () => ({
    message: 'OK',
    result: { files: { main: '', repeaters: {} } }
  })
}

function toAnswer(item) {
  return {
    name: item.name,
    title: item.title,
    value: item.value,
    ...(item.subItems
      ? { subItems: item.subItems.map((row) => row.map(toAnswer)) }
      : {})
  }
}

const outputService = {
  submit: async (
    _context,
    _request,
    _model,
    _emailAddress,
    items,
    _submitResponse,
    formMetadata
  ) => {
    await saveSubmission({
      schemaVersion: 1,
      submittedAt: new Date().toISOString(),
      form: {
        id: formMetadata?.id,
        slug: formMetadata?.slug,
        title: formMetadata?.title
      },
      answers: items.map(toAnswer)
    })
  }
}

export default { formsService, formSubmissionService, outputService }
