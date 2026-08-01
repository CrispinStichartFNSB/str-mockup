import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AddressUnitSelectionLab from '@/AddressUnitSelectionLab.vue'
import AddressUnitSelection from '@/components/AddressUnitSelection.vue'

function mountLab() {
  return mount(AddressUnitSelectionLab)
}

function buttonByText(wrapper: ReturnType<typeof mountLab>, text: string) {
  return wrapper.findAll('button').find((button) => button.text() === text)!
}

describe('AddressUnitSelectionLab', () => {
  it('starts with all addresses and an enabled component', () => {
    const wrapper = mountLab()
    const component = wrapper.getComponent(AddressUnitSelection)

    expect(component.props('addresses')).toHaveLength(5)
    expect(component.props('disabled')).toBe(false)
  })

  it('feeds address controls and presets into the component', async () => {
    const wrapper = mountLab()

    await wrapper.get('#address-first-prop-cabin-a').setValue(false)
    expect(
      wrapper
        .getComponent(AddressUnitSelection)
        .props('addresses')
        .some((address) => address.id === 'cabin-a'),
    ).toBe(false)

    await buttonByText(wrapper, 'Main only').trigger('click')
    expect(
      wrapper
        .getComponent(AddressUnitSelection)
        .props('addresses')
        .map((address) => address.id),
    ).toEqual(['main-house'])

    await buttonByText(wrapper, 'None').trigger('click')
    expect(wrapper.getComponent(AddressUnitSelection).props('addresses')).toEqual([])

    await buttonByText(wrapper, 'All five').trigger('click')
    expect(wrapper.getComponent(AddressUnitSelection).props('addresses')).toHaveLength(5)
  })

  it('feeds disabled state and displays emitted output', async () => {
    const wrapper = mountLab()
    await wrapper.get('#address-component-disabled').setValue(true)
    expect(wrapper.getComponent(AddressUnitSelection).props('disabled')).toBe(true)

    await wrapper.get('#address-mode-adu-main-house').setValue()

    expect(wrapper.get('#address-lab-output-validity').text()).toBe('true')
    expect(wrapper.get('#address-lab-output-count').text()).toBe('1')
    expect(wrapper.get('[aria-label="Emitted address-first units"]').text()).toContain('main-house')
  })

  it('resets component state and sidebar controls', async () => {
    const wrapper = mountLab()
    await wrapper.get('#address-component-disabled').setValue(true)
    await buttonByText(wrapper, 'None').trigger('click')
    await buttonByText(wrapper, 'All five').trigger('click')
    await wrapper.get('#address-mode-adu-main-house').setValue()

    await buttonByText(wrapper, 'Reset component and controls').trigger('click')

    const component = wrapper.getComponent(AddressUnitSelection)
    expect(component.props('disabled')).toBe(false)
    expect(component.props('addresses')).toHaveLength(5)
    expect(wrapper.get('#address-lab-output-validity').text()).toBe('false')
    expect(wrapper.get('#address-lab-output-count').text()).toBe('0')
  })
})
