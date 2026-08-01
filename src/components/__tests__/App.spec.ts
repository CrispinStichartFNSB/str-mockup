import { describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import App from '@/App.vue'
import { DEMO_MESSAGE, demoProperty } from '@/data/mockProperty'

function button(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find((candidate) => candidate.text() === text)!
}

async function completeContact(wrapper: VueWrapper) {
  await wrapper.get('#applicant-name').setValue('Taylor Morgan')
  await wrapper.get('#applicant-email').setValue('taylor@example.com')
  await button(wrapper, 'Continue to property').trigger('click')
}

async function selectDemoProperty(wrapper: VueWrapper) {
  await wrapper.get('#address-search').setValue('123 Main St')
}

async function reachAuthorization(wrapper: VueWrapper) {
  await completeContact(wrapper)
  await selectDemoProperty(wrapper)
  await button(wrapper, 'Continue to authorization').trigger('click')
}

describe('STR permit application', () => {
  it('reveals property search only after valid required contact information', async () => {
    const wrapper = mount(App)

    expect(wrapper.find('#property-heading').exists()).toBe(false)
    expect(button(wrapper, 'Continue to property').attributes('disabled')).toBeDefined()

    await wrapper.get('#applicant-name').setValue('Taylor Morgan')
    await wrapper.get('#applicant-email').setValue('not-an-email')
    expect(button(wrapper, 'Continue to property').attributes('disabled')).toBeDefined()

    await wrapper.get('#applicant-email').setValue('taylor@example.com')
    expect(button(wrapper, 'Continue to property').attributes('disabled')).toBeUndefined()
    await button(wrapper, 'Continue to property').trigger('click')

    expect(wrapper.find('#property-heading').exists()).toBe(true)
  })

  it('accepts a formatted valid phone number and rejects an invalid one', async () => {
    const wrapper = mount(App)
    await wrapper.get('#applicant-name').setValue('Taylor Morgan')
    await wrapper.get('#applicant-email').setValue('taylor@example.com')

    await wrapper.get('#applicant-phone').setValue('(907) 555-0123')
    expect(button(wrapper, 'Continue to property').attributes('disabled')).toBeUndefined()

    await wrapper.get('#applicant-phone').setValue('12')
    expect(button(wrapper, 'Continue to property').attributes('disabled')).toBeDefined()
  })

  it('offers only primary addresses and immediately loads the demo property', async () => {
    const wrapper = mount(App)
    await completeContact(wrapper)

    const suggestions = wrapper
      .findAll('#primary-addresses option')
      .map((option) => option.attributes('value'))
    expect(suggestions).toContain('123 Main St')
    expect(suggestions.some((address) => /Cabin|Unit/.test(address ?? ''))).toBe(false)

    await selectDemoProperty(wrapper)

    expect(wrapper.get('#selected-property-heading').text()).toBe('123 Main St')
    expect(wrapper.text()).toContain(demoProperty.pan)
    expect(wrapper.text()).toContain(demoProperty.ownerName)
    expect(button(wrapper, 'Continue to authorization').attributes('disabled')).toBeUndefined()
  })

  it('shows exact guidance when another autocomplete address is selected', async () => {
    const wrapper = mount(App)
    await completeContact(wrapper)

    await wrapper.get('#address-search').setValue('127 Main St')

    expect(wrapper.text()).toContain(DEMO_MESSAGE)
    expect(wrapper.find('#selected-property-heading').exists()).toBe(false)
    expect(button(wrapper, 'Continue to authorization').attributes('disabled')).toBeDefined()
  })

  it('finds the property by PAN and rejects an unknown PAN', async () => {
    const wrapper = mount(App)
    await completeContact(wrapper)
    await wrapper.get('input[type="radio"][value="pan"]').setValue()

    await wrapper.get('#pan-search').setValue(demoProperty.pan)
    await button(wrapper, 'Search').trigger('click')
    expect(wrapper.find('#selected-property-heading').exists()).toBe(true)

    await wrapper.get('#pan-search').setValue('PAN-999-999')
    await button(wrapper, 'Search').trigger('click')
    expect(wrapper.text()).toContain(DEMO_MESSAGE)
    expect(wrapper.find('#selected-property-heading').exists()).toBe(false)
  })

  it('lets an owner continue without a document', async () => {
    const wrapper = mount(App)
    await reachAuthorization(wrapper)

    await wrapper.get('input[type="radio"][value="yes"]').setValue()
    expect(button(wrapper, 'Continue to units').attributes('disabled')).toBeUndefined()
    await button(wrapper, 'Continue to units').trigger('click')

    expect(wrapper.find('#units-heading').exists()).toBe(true)
  })

  it('requires a valid authorization document from a non-owner', async () => {
    const wrapper = mount(App)
    await reachAuthorization(wrapper)
    await wrapper.get('input[type="radio"][value="no"]').setValue()

    expect(wrapper.find('#authorization-document').exists()).toBe(true)
    expect(button(wrapper, 'Continue to units').attributes('disabled')).toBeDefined()

    const file = new File(['authorization'], 'authorization.pdf', { type: 'application/pdf' })
    const input = wrapper.get('#authorization-document')
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')

    expect(button(wrapper, 'Continue to units').attributes('disabled')).toBeUndefined()
  })

  it('keeps later sections visible but blocks progress when contact data becomes invalid', async () => {
    const wrapper = mount(App)
    await reachAuthorization(wrapper)

    await wrapper.get('#applicant-email').setValue('invalid')

    expect(wrapper.find('#ownership-heading').exists()).toBe(true)
    expect(button(wrapper, 'Continue to authorization').attributes('disabled')).toBeDefined()
    await wrapper.get('input[type="radio"][value="yes"]').setValue()
    expect(button(wrapper, 'Continue to units').attributes('disabled')).toBeDefined()
  })

  it('resets downstream authorization when the property selection changes', async () => {
    const wrapper = mount(App)
    await reachAuthorization(wrapper)
    await wrapper.get('input[type="radio"][value="yes"]').setValue()
    expect(button(wrapper, 'Continue to units').attributes('disabled')).toBeUndefined()

    await wrapper.get('#address-search').setValue('127 Main St')

    expect(wrapper.find('input[type="radio"][value="yes"]:checked').exists()).toBe(false)
    expect(button(wrapper, 'Continue to units').attributes('disabled')).toBeDefined()
  })

  it('finishes the complete owner flow with the demo alert', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const wrapper = mount(App)
    await reachAuthorization(wrapper)
    await wrapper.get('input[type="radio"][value="yes"]').setValue()
    await button(wrapper, 'Continue to units').trigger('click')

    await wrapper.get('select[id^="unit-type"]').setValue('whole-house')
    await wrapper.get('select[id^="unit-address"]').setValue('main-house')
    await button(wrapper, 'Continue to payment').trigger('click')

    expect(alert).toHaveBeenCalledWith('demo over')
  })
})
