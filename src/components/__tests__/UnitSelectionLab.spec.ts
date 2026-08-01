import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UnitSelectionLab from '@/UnitSelectionLab.vue'
import UnitSelection from '@/components/UnitSelection.vue'

function buttonByText(wrapper: ReturnType<typeof mountLab>, text: string) {
  return wrapper.findAll('button').find((button) => button.text() === text)!
}

function mountLab() {
  return mount(UnitSelectionLab)
}

describe('UnitSelectionLab', () => {
  it('starts with all addresses and the component enabled', () => {
    const wrapper = mountLab()
    const component = wrapper.getComponent(UnitSelection)

    expect(component.props('addresses')).toHaveLength(5)
    expect(component.props('disabled')).toBe(false)
  })

  it('feeds address checkbox and preset changes into the component', async () => {
    const wrapper = mountLab()

    await wrapper.get('#address-prop-cabin-a').setValue(false)
    expect(
      wrapper
        .getComponent(UnitSelection)
        .props('addresses')
        .some((address) => address.id === 'cabin-a'),
    ).toBe(false)

    await buttonByText(wrapper, 'Main only').trigger('click')
    expect(
      wrapper
        .getComponent(UnitSelection)
        .props('addresses')
        .map((address) => address.id),
    ).toEqual(['main-house'])

    await buttonByText(wrapper, 'None').trigger('click')
    expect(wrapper.getComponent(UnitSelection).props('addresses')).toEqual([])

    await buttonByText(wrapper, 'All five').trigger('click')
    expect(wrapper.getComponent(UnitSelection).props('addresses')).toHaveLength(5)
  })

  it('feeds the disabled control into the component', async () => {
    const wrapper = mountLab()

    await wrapper.get('#component-disabled').setValue(true)

    expect(wrapper.getComponent(UnitSelection).props('disabled')).toBe(true)
  })

  it('shows the units and validity emitted by the component', async () => {
    const wrapper = mountLab()

    await wrapper.get('select[id^="unit-type"]').setValue('whole-house')
    await wrapper.get('select[id^="unit-address"]').setValue('main-house')

    expect(wrapper.get('#lab-output-validity').text()).toBe('true')
    expect(wrapper.get('#lab-output-count').text()).toBe('1')
    expect(wrapper.get('[aria-label="Emitted units"]').text()).toContain('whole-house')
    expect(wrapper.get('[aria-label="Emitted units"]').text()).toContain('main-house')
  })

  it('resets both controls and component state', async () => {
    const wrapper = mountLab()
    await wrapper.get('#component-disabled').setValue(true)
    await buttonByText(wrapper, 'None').trigger('click')
    await wrapper.get('#unit-count').setValue(3)

    await buttonByText(wrapper, 'Reset component and controls').trigger('click')

    expect(wrapper.getComponent(UnitSelection).props('disabled')).toBe(false)
    expect(wrapper.getComponent(UnitSelection).props('addresses')).toHaveLength(5)
    expect(wrapper.getComponent(UnitSelection).findAll('fieldset')).toHaveLength(1)
    expect(wrapper.get('#lab-output-count').text()).toBe('1')
  })
})
