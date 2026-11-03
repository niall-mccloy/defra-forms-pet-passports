import Boom from '@hapi/boom'
import { readFileSync } from 'node:fs'

import { parse as parseYaml } from 'yaml'

import simpleFormDefinition from './forms/simple-form.json' with { type: 'json' }
import unicornDefinition from './forms/register-a-unicorn.json' with { type: 'json' }
import contactRequestDefinition from './forms/contact-request.json' with { type: 'json' }
import wasteExemptionRegistrationDefinition from './forms/waste-exemption-registration.json' with { type: 'json' }
import livestockMovementNotificationJsonDefinition from './forms/livestock-movement-notification.json' with { type: 'json' }

const livestockMovementNotification2Definition = parseYaml(
  readFileSync(
    new URL('./forms/livestock-movement-notification.yaml', import.meta.url),
    'utf8'
  )
)
const communityEventPermitDefinition = parseYaml(
  readFileSync(
    new URL('./forms/community-event-permit.yaml', import.meta.url),
    'utf8'
  )
)
const reportFlyTippingDefinition = parseYaml(
  readFileSync(
    new URL('./forms/report-fly-tipping.yaml', import.meta.url),
    'utf8'
  )
)
const juniorFishingLicenseDefinition = parseYaml(
  readFileSync(
    new URL('./forms/junior-fishing-license.yaml', import.meta.url),
    'utf8'
  )
)
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

// Simple form
const simpleFormMetadata = {
  id: '48158770-647d-4fde-a3c5-1fc1e28f780d',
  slug: 'simple-form',
  title: 'Simple form',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Register a unicorn form
const unicornMetadata = {
  id: 'b2e7c8a1-3f4d-4e5b-9c6d-7a8b9c0d1e2f',
  slug: 'register-a-unicorn',
  title: 'Register a unicorn',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Contact request form
const contactRequestMetadata = {
  id: 'c3d4e5f6-7a8b-9c0d-1e2f-3g4h5i6j7k8l',
  slug: 'contact-request',
  title: 'Contact Request form',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Waste exemption registration form
const wasteExemptionRegistrationMetadata = {
  id: 'D8F58815-CAE7-434C-911D-22FD75A672A1',
  slug: 'waste-exemption-registration',
  title: 'Waste Exemption Registration form',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Livestock movement notification JSON form
const livestockMovementNotificationMetadata = {
  id: '7C9ED15F-55D6-4921-B6A5-DD672B4605AE',
  slug: 'livestock-movement-notification',
  title: 'Livestock Movement Notification form (JSON)',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Livestock movement notification YAML form
const livestockMovementNotification2Metadata = {
  id: 'A39B9E2B-1972-440B-9CBD-3E08962A0AB8',
  slug: 'livestock-movement-notification2',
  title: 'Livestock Movement Notification 2 form (YAML)',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Community event permit form
const communityEventPermitMetadata = {
  id: '4FDF2741-A9AF-4C5A-8BCF-854AB6D47788',
  slug: 'community-event-permit',
  title: 'Community Event Permit form',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Report fly-tipping form
const reportFlyTippingMetadata = {
  id: '0B2054C7-6A50-4817-A570-F1A2CB5CEB70',
  slug: 'report-fly-tipping',
  title: 'Report fly-tipping',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance: "Thanks for your submission, we'll be in touch",
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
}

// Junior fishing licence form
const juniorFishingLicenseMetadata = {
  id: '7D5F8047-7D0A-47DB-8E8E-723D0E6ED2A7',
  slug: 'junior-fishing-license',
  title: 'Apply for a Junior Fishing Licence',
  organisation: 'Defra',
  teamName: 'Example team',
  teamEmail: 'example-team@defra.gov.uk',
  submissionGuidance:
    'Your junior fishing licence application has been submitted successfully.',
  notificationEmail: 'example-email-submission-recipient@defra.com',
  ...author,
  live: author
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
    '# Payment summary\n\nPet passports. The total amount is shown in the order summary.\n\nWe have sent your order to APHA. We will contact you with order updates, including an estimated delivery date.',
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
      case simpleFormMetadata.slug:
        return Promise.resolve(simpleFormMetadata)
      case unicornMetadata.slug:
        return Promise.resolve(unicornMetadata)
      case contactRequestMetadata.slug:
        return Promise.resolve(contactRequestMetadata)
      case wasteExemptionRegistrationMetadata.slug:
        return Promise.resolve(wasteExemptionRegistrationMetadata)
      case livestockMovementNotificationMetadata.slug:
        return Promise.resolve(livestockMovementNotificationMetadata)
      case livestockMovementNotification2Metadata.slug:
        return Promise.resolve(livestockMovementNotification2Metadata)
      case communityEventPermitMetadata.slug:
        return Promise.resolve(communityEventPermitMetadata)
      case reportFlyTippingMetadata.slug:
        return Promise.resolve(reportFlyTippingMetadata)
      case juniorFishingLicenseMetadata.slug:
        return Promise.resolve(juniorFishingLicenseMetadata)
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
      case simpleFormMetadata.id:
        return Promise.resolve(simpleFormMetadata)
      case unicornMetadata.id:
        return Promise.resolve(unicornMetadata)
      case contactRequestMetadata.id:
        return Promise.resolve(contactRequestMetadata)
      case wasteExemptionRegistrationMetadata.id:
        return Promise.resolve(wasteExemptionRegistrationMetadata)
      case livestockMovementNotificationMetadata.id:
        return Promise.resolve(livestockMovementNotificationMetadata)
      case livestockMovementNotification2Metadata.id:
        return Promise.resolve(livestockMovementNotification2Metadata)
      case communityEventPermitMetadata.id:
        return Promise.resolve(communityEventPermitMetadata)
      case reportFlyTippingMetadata.id:
        return Promise.resolve(reportFlyTippingMetadata)
      case juniorFishingLicenseMetadata.id:
        return Promise.resolve(juniorFishingLicenseMetadata)
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
      case simpleFormMetadata.id:
        return Promise.resolve(simpleFormDefinition)
      case unicornMetadata.id:
        return Promise.resolve(unicornDefinition)
      case contactRequestMetadata.id:
        return Promise.resolve(contactRequestDefinition)
      case wasteExemptionRegistrationMetadata.id:
        return Promise.resolve(wasteExemptionRegistrationDefinition)
      case livestockMovementNotificationMetadata.id:
        return Promise.resolve(livestockMovementNotificationJsonDefinition)
      case livestockMovementNotification2Metadata.id:
        return Promise.resolve(livestockMovementNotification2Definition)
      case communityEventPermitMetadata.id:
        return Promise.resolve(communityEventPermitDefinition)
      case reportFlyTippingMetadata.id:
        return Promise.resolve(reportFlyTippingDefinition)
      case juniorFishingLicenseMetadata.id:
        return Promise.resolve(juniorFishingLicenseDefinition)
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
    return Promise.reject(Boom.notFound())
  }
}

const formSubmissionService = {
  persistFiles: () => Promise.resolve({}),
  submit: () =>
    Promise.resolve({
      message: 'OK',
      result: { files: { main: '', repeaters: {} } }
    })
}

const outputService = {
  submit: () => Promise.resolve()
}

export default { formsService, formSubmissionService, outputService }
