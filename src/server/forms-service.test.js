import Boom from '@hapi/boom'
import services from '~/src/server/forms-service.js'

const { formsService } = services

const VALID_ID = '48158770-647d-4fde-a3c5-1fc1e28f780d'
const VALID_SLUG = 'simple-form'
const PET_PASSPORTS_ID = '9e8f7d6c-5b4a-4321-9876-5f4e3d2c1b0a'
const PET_PASSPORTS_FORECASTING_ID = 'a2345678-9abc-4def-8123-456789abcdef'
const ORDER_PET_PASSPORTS_ID = 'a2b3c4d5-e6f7-4890-a123-456789abcdef'
const REPORT_PET_PASSPORT_DAMAGE_ID = 'd623ce9a-cf52-44bc-8861-11a7a1c262f6'

describe('formsService', () => {
  describe('getFormMetadata', () => {
    test('returns metadata for known slug', async () => {
      const result = await formsService.getFormMetadata(VALID_SLUG)
      expect(result.id).toBe(VALID_ID)
      expect(result.slug).toBe(VALID_SLUG)
    })

    test('returns metadata for the EU pet passports page', async () => {
      const result = await formsService.getFormMetadata('pet-passports')

      expect(result.id).toBe(PET_PASSPORTS_ID)
      expect(result.title).toBe('EU pet passports')
    })

    test('returns metadata for pet passport forecasting', async () => {
      const result = await formsService.getFormMetadata(
        'pet-passports-forecasting'
      )

      expect(result.id).toBe(PET_PASSPORTS_FORECASTING_ID)
      expect(result.title).toBe('Enter a forecast for pet passports')
      expect(result.submissionGuidance).toContain(
        'Pet passport estimate submitted'
      )
    })

    test('returns metadata for pet passport ordering', async () => {
      const result = await formsService.getFormMetadata('order-pet-passports')

      expect(result.id).toBe(ORDER_PET_PASSPORTS_ID)
      expect(result.title).toBe('Order pet passports')
      expect(result.submissionGuidance).toContain('Order complete')
    })

    test('returns metadata for reporting pet passport damage', async () => {
      const result = await formsService.getFormMetadata(
        'report-pet-passport-damage'
      )

      expect(result.id).toBe(REPORT_PET_PASSPORT_DAMAGE_ID)
      expect(result.title).toBe(
        'Report a damaged, destroyed, lost or incorrectly completed pet passport'
      )
      expect(result.submissionGuidance).toContain(
        'Your report has been received and recorded.'
      )
    })

    test('throws Boom.notFound for unknown slug', async () => {
      await expect(formsService.getFormMetadata('unknown')).rejects.toThrow(
        Boom.notFound().message
      )
    })
  })

  describe('getFormMetadataById', () => {
    test('returns metadata for known id', async () => {
      const result = await formsService.getFormMetadataById(VALID_ID)
      expect(result.id).toBe(VALID_ID)
    })

    test('throws Boom.notFound for unknown id', async () => {
      await expect(
        formsService.getFormMetadataById('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(Boom.notFound().message)
    })
  })

  describe('getFormDefinition', () => {
    test('returns definition for known id', async () => {
      const result = await formsService.getFormDefinition(VALID_ID)
      expect(result.engine).toBe('V2')
      expect(result.pages.length).toBeGreaterThan(0)
    })

    test('returns the EU pet passports landing page definition', async () => {
      const result = await formsService.getFormDefinition(PET_PASSPORTS_ID)

      expect(result.pages[0].path).toBe('/start')
      expect(result.pages[0].components[0].content).toContain(
        'Guidance for pet owners'
      )
    })

    test('returns the pet passport sign-in and account registration pages', async () => {
      const result = await formsService.getFormDefinition(PET_PASSPORTS_ID)
      const signInPage = result.pages.find((page) => page.path === '/sign-in')
      const accountPage = result.pages.find(
        (page) => page.path === '/your-defra-account'
      )

      expect(signInPage.components[0]).toMatchObject({
        name: 'signInMethod',
        type: 'RadiosField',
        list: '60718293-a4b5-4c6d-8e9f-0123456789ab'
      })
      expect(signInPage.components[0].options.required).toBe(true)
      expect(result.lists[0].items).toHaveLength(2)
      expect(accountPage.components[0].content).toContain(
        'Apply for a CITES Permit'
      )
      expect(accountPage.components[0].content).toContain('Your Defra account')
    })

    test('returns the pet passport forecasting journey', async () => {
      const result = await formsService.getFormDefinition(
        PET_PASSPORTS_FORECASTING_ID
      )
      const practicePage = result.pages.find(
        (page) => page.path === '/select-practice'
      )
      const estimatePage = result.pages.find(
        (page) => page.path === '/enter-estimate'
      )

      expect(result.pages[0].title).toBe(
        'Tell us how many pets you issued animal health certificates for in the last year'
      )
      expect(practicePage.components[0]).toMatchObject({
        name: 'veterinaryPractice',
        type: 'RadiosField'
      })
      expect(result.lists[0].items).toHaveLength(3)
      expect(estimatePage.components[0]).toMatchObject({
        name: 'petsIssuedCertificates',
        type: 'NumberField',
        options: {
          required: true
        }
      })
      expect(result.pages.at(-1).controller).toBe('SummaryPageController')
    })

    test('returns the pet passport ordering journey', async () => {
      const result = await formsService.getFormDefinition(
        ORDER_PET_PASSPORTS_ID
      )
      const quantityPage = result.pages.find(
        (page) => page.path === '/select-quantity'
      )
      const deliveryPage = result.pages.find(
        (page) => page.path === '/delivery-address'
      )
      const contactPage = result.pages.find(
        (page) => page.path === '/contact-details'
      )

      expect(result.pages[0].title).toBe(
        'Order pet passports for a veterinary practice'
      )
      expect(quantityPage.components[0]).toMatchObject({
        name: 'passportQuantity',
        type: 'RadiosField',
        options: {
          required: true
        }
      })
      expect(result.lists[0].items).toHaveLength(5)
      expect(deliveryPage.components[0]).toMatchObject({
        name: 'deliveryAddress',
        type: 'RadiosField',
        options: {
          required: true
        }
      })
      expect(contactPage.components).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'contactName',
            type: 'TextField',
            schema: {
              max: 70
            },
            options: {
              required: true
            }
          }),
          expect.objectContaining({
            name: 'contactPhone',
            type: 'TelephoneNumberField',
            options: {
              required: true
            }
          }),
          expect.objectContaining({
            name: 'contactEmail',
            type: 'EmailAddressField',
            options: {
              required: true
            }
          })
        ])
      )
      expect(result.pages.at(-1).controller).toBe('SummaryPageController')
      expect(result.pages.at(-1).components[0].content).toContain(
        'Payment processing is not available'
      )
    })

    test('returns the pet passport damage reporting journey', async () => {
      const result = await formsService.getFormDefinition(
        REPORT_PET_PASSPORT_DAMAGE_ID
      )
      const reasonPage = result.pages.find(
        (page) => page.path === '/report-reason'
      )
      const registeredPage = result.pages.find(
        (page) => page.path === '/passport-registered'
      )
      const passportIdPage = result.pages.find(
        (page) => page.path === '/passport-id'
      )
      const microchipPage = result.pages.find(
        (page) => page.path === '/microchip-number'
      )
      const additionalInformationPage = result.pages.find(
        (page) => page.path === '/additional-information'
      )

      expect(result.name).toBe(
        'Report a damaged, destroyed, lost or incorrectly completed pet passport'
      )
      expect(reasonPage.components[0]).toMatchObject({
        name: 'reportReason',
        type: 'RadiosField',
        options: {
          required: true
        }
      })
      expect(result.lists[0].items).toHaveLength(4)
      expect(registeredPage.components[0]).toMatchObject({
        name: 'passportRegistered',
        type: 'RadiosField',
        options: {
          required: true
        }
      })
      expect(passportIdPage.condition).toBe(result.conditions[0].id)
      expect(result.conditions[0].items[0]).toMatchObject({
        componentId: registeredPage.components[0].id,
        value: 'no'
      })
      expect(passportIdPage.components[0]).toMatchObject({
        name: 'passportId',
        type: 'TextField',
        schema: {
          max: 50
        },
        options: {
          required: true
        }
      })
      expect(microchipPage.condition).toBe(result.conditions[1].id)
      expect(result.conditions[1].items[0]).toMatchObject({
        componentId: registeredPage.components[0].id,
        value: 'yes'
      })
      expect(microchipPage.components[0]).toMatchObject({
        name: 'microchipNumber',
        type: 'TextField',
        schema: {
          max: 30
        },
        options: {
          required: true
        }
      })
      expect(additionalInformationPage.components[0]).toMatchObject({
        name: 'additionalInformation',
        type: 'MultilineTextField',
        schema: {
          max: 1000
        },
        options: {
          required: false
        }
      })
      expect(result.pages.at(-1).controller).toBe('SummaryPageController')
    })

    test('ignores state parameter and still returns definition', async () => {
      const result = await formsService.getFormDefinition(VALID_ID, 'live')
      expect(result.engine).toBe('V2')
    })

    test('throws Boom.notFound for unknown id', async () => {
      await expect(
        formsService.getFormDefinition('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow(Boom.notFound().message)
    })
  })

  describe('getFormSecret', () => {
    test('throws Boom.notFound always', async () => {
      await expect(
        formsService.getFormSecret(VALID_ID, 'some-secret')
      ).rejects.toThrow(Boom.notFound().message)
    })
  })
})
