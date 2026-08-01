<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropertyAddress, UnitSelection, UnitType } from '@/types/application'

const { addresses, disabled = false } = defineProps<{
  addresses: PropertyAddress[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:units': [units: UnitSelection[]]
  'validity-change': [valid: boolean]
}>()

const unitCount = ref(1)
let nextUnitId = 2
const units = ref<UnitSelection[]>([{ id: 1, type: '', addressId: '' }])

const unitTypes: Array<{ value: UnitType; label: string }> = [
  { value: 'single-room', label: 'Single room' },
  { value: 'whole-house', label: 'Whole house' },
  { value: 'adu', label: 'ADU' },
]

const conflictingAddressIds = computed(() => {
  const groups = new Map<string, UnitSelection[]>()

  for (const unit of units.value) {
    if (!unit.addressId) continue
    const group = groups.get(unit.addressId) ?? []
    group.push(unit)
    groups.set(unit.addressId, group)
  }

  return new Set(
    [...groups.entries()]
      .filter(([, group]) => group.length > 1 && group.some((unit) => unit.type === 'adu'))
      .map(([addressId]) => addressId),
  )
})

const isValid = computed(
  () =>
    units.value.every((unit) => unit.type && unit.addressId) &&
    conflictingAddressIds.value.size === 0,
)

function addressLabel(address: PropertyAddress) {
  return address.secondaryLine
    ? `${address.primaryLine} — ${address.secondaryLine}`
    : address.primaryLine
}

function setUnitCount(event: Event) {
  const target = event.target as HTMLInputElement
  const requested = Number(target.value)
  const nextCount = Number.isFinite(requested)
    ? Math.min(20, Math.max(1, Math.trunc(requested)))
    : 1
  unitCount.value = nextCount
  // Keep the visible native control in sync when clamping to the current state value.
  target.value = String(nextCount)

  while (units.value.length < nextCount) {
    units.value.push({ id: nextUnitId++, type: '', addressId: '' })
  }

  if (units.value.length > nextCount) units.value.splice(nextCount)
}

watch(
  units,
  (currentUnits) =>
    emit(
      'update:units',
      currentUnits.map((unit) => ({ ...unit })),
    ),
  { deep: true, immediate: true },
)

watch(isValid, (valid) => emit('validity-change', valid), { immediate: true })

function finishDemo() {
  window.alert('demo over')
}
</script>

<template>
  <div>
    <div class="unit-count-row">
      <div>
        <label for="unit-count">Number of units</label>
        <p id="unit-count-hint" class="field-hint">Enter a number from 1 to 20.</p>
      </div>
      <input
        id="unit-count"
        :value="unitCount"
        aria-describedby="unit-count-hint"
        type="number"
        min="1"
        max="20"
        inputmode="numeric"
        @input="setUnitCount"
      />
    </div>

    <div class="unit-grid">
      <fieldset
        v-for="(unit, index) in units"
        :key="unit.id"
        class="unit-card"
        :class="{
          'is-complete': unit.type && unit.addressId && !conflictingAddressIds.has(unit.addressId),
          'has-error': conflictingAddressIds.has(unit.addressId),
        }"
      >
        <legend>Unit {{ index + 1 }}</legend>

        <div class="field-group">
          <label :for="`unit-type-${unit.id}`">Unit type</label>
          <select :id="`unit-type-${unit.id}`" v-model="unit.type">
            <option value="" disabled>Select a type</option>
            <option v-for="type in unitTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label :for="`unit-address-${unit.id}`">Unit address</label>
          <select
            :id="`unit-address-${unit.id}`"
            v-model="unit.addressId"
            :aria-invalid="conflictingAddressIds.has(unit.addressId)"
            :aria-describedby="
              conflictingAddressIds.has(unit.addressId)
                ? `unit-address-error-${unit.id}`
                : undefined
            "
          >
            <option value="" disabled>Select an address</option>
            <option v-for="address in addresses" :key="address.id" :value="address.id">
              {{ addressLabel(address) }}
            </option>
          </select>
        </div>

        <p
          v-if="conflictingAddressIds.has(unit.addressId)"
          :id="`unit-address-error-${unit.id}`"
          class="field-error"
        >
          An ADU cannot share an address with another unit.
        </p>
      </fieldset>
    </div>

    <p v-if="conflictingAddressIds.size" class="form-message error-message" role="alert">
      ADUs must have unique addresses. Review the highlighted units.
    </p>

    <div class="section-actions">
      <button
        class="primary-button"
        type="button"
        :disabled="disabled || !isValid"
        @click="finishDemo"
      >
        Continue to payment
      </button>
    </div>
  </div>
</template>
