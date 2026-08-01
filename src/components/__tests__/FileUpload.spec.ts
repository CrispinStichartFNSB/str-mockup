import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUpload from '../FileUpload.vue'

const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png']
const maxSizeBytes = 10 * 1024 * 1024

function mountUploader(modelValue: File | null = null) {
  return mount(FileUpload, {
    props: { modelValue, acceptedTypes, maxSizeBytes },
  })
}

async function chooseFile(wrapper: ReturnType<typeof mountUploader>, file: File) {
  const input = wrapper.get('input[type="file"]')
  Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
  await input.trigger('change')
}

describe('FileUpload', () => {
  it('emits a valid file chosen with the native input', async () => {
    const wrapper = mountUploader()
    const file = new File(['authorization'], 'authorization.pdf', { type: 'application/pdf' })

    await chooseFile(wrapper, file)

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([file])
    expect(wrapper.emitted('validation-error')).toBeUndefined()
  })

  it('accepts a valid dropped file', async () => {
    const wrapper = mountUploader()
    const file = new File(['image'], 'authorization.png', { type: 'image/png' })

    await wrapper.get('[aria-label="Authorization document drop area"]').trigger('drop', {
      dataTransfer: { files: [file] },
    })

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([file])
  })

  it('rejects unsupported file types', async () => {
    const wrapper = mountUploader()
    const file = new File(['document'], 'authorization.txt', { type: 'text/plain' })

    await chooseFile(wrapper, file)

    expect(wrapper.text()).toContain('Choose a PDF, JPG, or PNG file.')
    expect(wrapper.emitted('validation-error')?.[0]).toEqual(['Choose a PDF, JPG, or PNG file.'])
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('rejects files above the configured size limit', async () => {
    const wrapper = mountUploader()
    const file = new File([new Uint8Array(maxSizeBytes + 1)], 'authorization.pdf', {
      type: 'application/pdf',
    })

    await chooseFile(wrapper, file)

    expect(wrapper.text()).toContain('Choose a file smaller than 10 MB.')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('emits null when the selected file is removed', async () => {
    const file = new File(['authorization'], 'authorization.pdf', { type: 'application/pdf' })
    const wrapper = mountUploader(file)

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })
})
