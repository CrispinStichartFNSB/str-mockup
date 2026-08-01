import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AddressUnitSelection from '../AddressUnitSelection.vue'
import { demoProperty } from '@/data/mockProperty'
import type { PropertyAddress, UnitSelection } from '@/types/application'

function mountSelection(
  addresses: PropertyAddress[] = demoProperty.unitAddresses,
  disabled = false,
) {
  return mount(AddressUnitSelection, { props: { addresses, disabled } })
}

function paymentButton(wrapper: ReturnType<typeof mountSelection>) {
  return wrapper.findAll('button').find((button) => button.text() === 'Continue to payment')!
}

function lastUnits(wrapper: ReturnType<typeof mountSelection>) {
  const events = wrapper.emitted('update:units') ?? []
  return events[events.length - 1]?.[0] as UnitSelection[]
}

function lastValidity(wrapper: ReturnType<typeof mountSelection>) {
  const events = wrapper.emitted('validity-change') ?? []
  return events[events.length - 1]?.[0] as boolean
}

async function chooseMode(
  wrapper: ReturnType<typeof mountSelection>,
  addressId: string,
  mode: 'none' | 'adu' | 'mixed',
) {
  await wrapper.get(`#address-mode-${mode}-${addressId}`).setValue()
}

describe('AddressUnitSelection', () => {
  it('shows every address as not renting and requires at least one unit', () => {
    const wrapper = mountSelection()

    expect(wrapper.findAll('fieldset')).toHaveLength(5)
    expect(
      wrapper
        .findAll('input[type="radio"][value="none"]')
        .every((input) => (input.element as HTMLInputElement).checked),
    ).toBe(true)
    expect(lastUnits(wrapper)).toEqual([])
    expect(lastValidity(wrapper)).toBe(false)
    expect(paymentButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('emits one exclusive ADU and completes the selection', async () => {
    const wrapper = mountSelection()

    await chooseMode(wrapper, 'main-house', 'adu')

    expect(lastUnits(wrapper)).toEqual([
      expect.objectContaining({ type: 'adu', addressId: 'main-house' }),
    ])
    expect(lastValidity(wrapper)).toBe(true)
    expect(paymentButton(wrapper).attributes('disabled')).toBeUndefined()
    expect((wrapper.get('#address-mode-adu-main-house').element as HTMLInputElement).checked).toBe(
      true,
    )
    expect((wrapper.get('#address-mode-none-main-house').element as HTMLInputElement).checked).toBe(
      false,
    )
    expect(wrapper.find('#address-house-main-house').exists()).toBe(false)
    expect(wrapper.find('#address-rooms-main-house').exists()).toBe(false)
  })

  it('supports rooms without a house and a house with multiple rooms', async () => {
    const wrapper = mountSelection()
    await chooseMode(wrapper, 'main-house', 'mixed')

    expect(
      (wrapper.get('#address-mode-mixed-main-house').element as HTMLInputElement).checked,
    ).toBe(true)
    expect(lastValidity(wrapper)).toBe(false)
    await wrapper.get('#address-rooms-main-house').setValue(2)
    expect(lastUnits(wrapper).map((unit) => unit.type)).toEqual(['single-room', 'single-room'])
    expect(lastValidity(wrapper)).toBe(true)

    await wrapper.get('#address-house-main-house').setValue(true)
    expect(lastUnits(wrapper).map((unit) => unit.type)).toEqual([
      'whole-house',
      'single-room',
      'single-room',
    ])
    expect(wrapper.findAll('#address-house-main-house')).toHaveLength(1)
  })

  it('confirms before replacing house and room units with an ADU', async () => {
    const wrapper = mountSelection()
    await chooseMode(wrapper, 'main-house', 'mixed')
    await wrapper.get('#address-house-main-house').setValue(true)
    await wrapper.get('#address-rooms-main-house').setValue(2)

    await chooseMode(wrapper, 'main-house', 'adu')

    expect(wrapper.get('[role="alert"]').text()).toContain('Selecting ADU will remove')
    expect(
      (wrapper.get('#address-mode-mixed-main-house').element as HTMLInputElement).checked,
    ).toBe(true)
    expect(lastUnits(wrapper)).toHaveLength(3)
    expect(lastValidity(wrapper)).toBe(false)

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Replace with ADU')!
      .trigger('click')

    expect(lastUnits(wrapper)).toEqual([
      expect.objectContaining({ type: 'adu', addressId: 'main-house' }),
    ])
    expect(lastValidity(wrapper)).toBe(true)
  })

  it('keeps existing units when ADU replacement is cancelled', async () => {
    const wrapper = mountSelection()
    await chooseMode(wrapper, 'main-house', 'mixed')
    await wrapper.get('#address-house-main-house').setValue(true)
    await wrapper.get('#address-rooms-main-house').setValue(1)
    const unitsBeforeReplacement = lastUnits(wrapper)

    await chooseMode(wrapper, 'main-house', 'adu')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Keep current units')!
      .trigger('click')

    expect(lastUnits(wrapper)).toEqual(unitsBeforeReplacement)
    expect(
      (wrapper.get('#address-mode-mixed-main-house').element as HTMLInputElement).checked,
    ).toBe(true)
    expect(lastValidity(wrapper)).toBe(true)
  })

  it('clamps room input to the shared 20-unit limit', async () => {
    const wrapper = mountSelection()
    await chooseMode(wrapper, 'main-house', 'mixed')

    await wrapper.get('#address-rooms-main-house').setValue(25)

    expect((wrapper.get('#address-rooms-main-house').element as HTMLInputElement).value).toBe('20')
    expect(lastUnits(wrapper)).toHaveLength(20)
    expect(wrapper.text()).toContain('The 20-unit application limit has been reached.')
  })

  it('shares capacity across addresses and restores it when a unit is removed', async () => {
    const wrapper = mountSelection()
    await chooseMode(wrapper, 'main-house', 'mixed')
    await wrapper.get('#address-rooms-main-house').setValue(19)
    await wrapper.get('#address-house-main-house').setValue(true)

    expect(wrapper.get('#address-mode-adu-cabin-a').attributes('disabled')).toBeDefined()
    expect(
      wrapper.get('[aria-label="Add a room to 123 Main St"]').attributes('disabled'),
    ).toBeDefined()

    await wrapper.get('#address-house-main-house').setValue(false)
    expect(wrapper.get('#address-mode-adu-cabin-a').attributes('disabled')).toBeUndefined()

    await chooseMode(wrapper, 'cabin-a', 'adu')
    expect(lastUnits(wrapper)).toHaveLength(20)
  })

  it('reconciles removed, added, and reordered address props', async () => {
    const [mainAddress, cabinA, cabinB] = demoProperty.unitAddresses
    const wrapper = mountSelection([mainAddress!, cabinA!])
    await chooseMode(wrapper, 'main-house', 'adu')
    await chooseMode(wrapper, 'cabin-a', 'adu')

    await wrapper.setProps({ addresses: [cabinA!, mainAddress!] })
    expect(lastUnits(wrapper).map((unit) => unit.addressId)).toEqual(['cabin-a', 'main-house'])

    await wrapper.setProps({ addresses: [cabinA!, cabinB!] })
    expect(lastUnits(wrapper).map((unit) => unit.addressId)).toEqual(['cabin-a'])
    expect(
      wrapper.findAll('fieldset').map((fieldset) => fieldset.get('legend strong').text()),
    ).toEqual(['123 Main St — Cabin A', '123 Main St — Cabin B'])
    expect((wrapper.get('#address-mode-none-cabin-b').element as HTMLInputElement).checked).toBe(
      true,
    )
  })

  it('honors the disabled prop and finishes with the demo alert when enabled', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => undefined)
    const wrapper = mountSelection(demoProperty.unitAddresses, true)
    await chooseMode(wrapper, 'main-house', 'adu')

    expect(paymentButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.setProps({ disabled: false })
    await paymentButton(wrapper).trigger('click')

    expect(alert).toHaveBeenCalledWith('demo over')
  })
})
