import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UnitSelection from '../UnitSelection.vue'
import { demoProperty } from '@/data/mockProperty'

function mountUnits(disabled = false) {
  return mount(UnitSelection, {
    props: { addresses: demoProperty.unitAddresses, disabled },
  })
}

async function setUnit(
  wrapper: ReturnType<typeof mountUnits>,
  index: number,
  type: 'single-room' | 'whole-house' | 'adu',
  addressId: string,
) {
  const cards = wrapper.findAll('fieldset')
  await cards[index]!.get('select[id^="unit-type"]').setValue(type)
  await cards[index]!.get('select[id^="unit-address"]').setValue(addressId)
}

function paymentButton(wrapper: ReturnType<typeof mountUnits>) {
  return wrapper.findAll('button').find((button) => button.text() === 'Continue to payment')!
}

describe('UnitSelection', () => {
  it('offers all five unit-eligible addresses with their secondary lines', () => {
    const wrapper = mountUnits()
    const options = wrapper
      .get('select[id^="unit-address"]')
      .findAll('option:not([disabled])')
      .map((option) => option.text())

    expect(options).toEqual([
      '123 Main St',
      '123 Main St — Cabin A',
      '123 Main St — Cabin B',
      '123 Main St — Unit 14',
      '123 Main St — Unit 15',
    ])
  })

  it('requires type and address before continuing to payment', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const wrapper = mountUnits()

    expect(paymentButton(wrapper).attributes('disabled')).toBeDefined()
    await setUnit(wrapper, 0, 'whole-house', 'main-house')
    expect(paymentButton(wrapper).attributes('disabled')).toBeUndefined()

    await paymentButton(wrapper).trigger('click')
    expect(alert).toHaveBeenCalledWith('demo over')
  })

  it('adds and removes trailing unit records as the count changes', async () => {
    const wrapper = mountUnits()
    const count = wrapper.get('#unit-count')

    await count.setValue(3)
    expect(wrapper.findAll('fieldset')).toHaveLength(3)
    await setUnit(wrapper, 2, 'single-room', 'cabin-a')

    await count.setValue(1)
    expect(wrapper.findAll('fieldset')).toHaveLength(1)
    const updates = wrapper.emitted('update:units') ?? []
    expect(updates[updates.length - 1]?.[0]).toHaveLength(1)
  })

  it('constrains the unit count to the supported range', async () => {
    const wrapper = mountUnits()
    const count = wrapper.get('#unit-count')

    await count.setValue(0)
    expect((count.element as HTMLInputElement).value).toBe('1')
    expect(wrapper.findAll('fieldset')).toHaveLength(1)

    await count.setValue(25)
    expect((count.element as HTMLInputElement).value).toBe('20')
    expect(wrapper.findAll('fieldset')).toHaveLength(20)
  })

  it.each([
    ['adu', 'whole-house'],
    ['single-room', 'adu'],
    ['adu', 'adu'],
  ] as const)(
    'blocks shared addresses when unit types are %s and %s',
    async (firstType, secondType) => {
      const wrapper = mountUnits()
      await wrapper.get('#unit-count').setValue(2)

      await setUnit(wrapper, 0, firstType, 'main-house')
      await setUnit(wrapper, 1, secondType, 'main-house')

      expect(wrapper.text()).toContain('ADUs must have unique addresses.')
      expect(paymentButton(wrapper).attributes('disabled')).toBeDefined()
      expect(
        wrapper
          .findAll('select[id^="unit-address"]')
          .every((select) => select.attributes('aria-invalid') === 'true'),
      ).toBe(true)
      const validityEvents = wrapper.emitted('validity-change') ?? []
      expect(validityEvents[validityEvents.length - 1]).toEqual([false])
    },
  )

  it.each([
    ['single-room', 'single-room'],
    ['single-room', 'whole-house'],
    ['whole-house', 'whole-house'],
  ] as const)(
    'allows shared addresses when unit types are %s and %s',
    async (firstType, secondType) => {
      const wrapper = mountUnits()
      await wrapper.get('#unit-count').setValue(2)

      await setUnit(wrapper, 0, firstType, 'main-house')
      await setUnit(wrapper, 1, secondType, 'main-house')

      expect(wrapper.text()).not.toContain('ADUs must have unique addresses.')
      expect(paymentButton(wrapper).attributes('disabled')).toBeUndefined()
      const validityEvents = wrapper.emitted('validity-change') ?? []
      expect(validityEvents[validityEvents.length - 1]).toEqual([true])
    },
  )

  it('blocks payment when a prior form step becomes invalid', async () => {
    const wrapper = mountUnits(true)
    await setUnit(wrapper, 0, 'whole-house', 'main-house')

    expect(paymentButton(wrapper).attributes('disabled')).toBeDefined()
  })
})
