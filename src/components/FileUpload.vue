<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: File | null
  acceptedTypes: string[]
  maxSizeBytes: number
}>()

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
  'validation-error': [message: string]
}>()

const input = ref<HTMLInputElement | null>(null)
const error = ref('')
const isDragging = ref(false)

const acceptAttribute = computed(() => props.acceptedTypes.join(','))
const maxSizeMegabytes = computed(() => Math.round(props.maxSizeBytes / 1024 / 1024))

function validateAndSelect(file?: File) {
  error.value = ''

  if (!file) return

  if (!props.acceptedTypes.includes(file.type)) {
    error.value = 'Choose a PDF, JPG, or PNG file.'
  } else if (file.size > props.maxSizeBytes) {
    error.value = `Choose a file smaller than ${maxSizeMegabytes.value} MB.`
  }

  if (error.value) {
    emit('validation-error', error.value)
    if (input.value) input.value.value = ''
    return
  }

  emit('update:modelValue', file)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  validateAndSelect(target.files?.[0])
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  validateAndSelect(event.dataTransfer?.files[0])
}

function removeFile() {
  error.value = ''
  if (input.value) input.value.value = ''
  emit('update:modelValue', null)
}
</script>

<template>
  <div class="file-upload">
    <div
      class="drop-zone"
      :class="{ 'is-dragging': isDragging }"
      role="group"
      aria-label="Authorization document drop area"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        id="authorization-document"
        ref="input"
        class="visually-hidden"
        type="file"
        :accept="acceptAttribute"
        @change="onInput"
      />
      <svg aria-hidden="true" class="upload-icon" viewBox="0 0 24 24">
        <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </svg>
      <p><label for="authorization-document">Choose a file</label> or drag it here</p>
      <p class="field-hint">PDF, JPG, or PNG up to {{ maxSizeMegabytes }} MB</p>
    </div>

    <p v-if="error" class="field-error" role="alert">{{ error }}</p>

    <div v-if="modelValue" class="selected-file" role="status">
      <span>
        <strong>{{ modelValue.name }}</strong>
        <small>{{ (modelValue.size / 1024).toFixed(0) }} KB</small>
      </span>
      <button class="text-button" type="button" @click="removeFile">Remove</button>
    </div>
  </div>
</template>
