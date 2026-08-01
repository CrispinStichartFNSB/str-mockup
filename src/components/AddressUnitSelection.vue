<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropertyAddress, UnitSelection } from '@/types/application'

type AddressMode = 'none' | 'adu' | 'house-and-rooms'

interface AddressConfiguration {
  addressId: string
  mode: AddressMode
  aduUnitId: number | null
  houseUnitId: number | null
  roomUnitIds: number[]
}

const MAX_UNITS = 20

const { addresses, disabled = false } = defineProps<{
  addresses: PropertyAddress[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:units': [units: UnitSelection[]]
  'validity-change': [valid: boolean]
}>()

const configurations = ref<Record<string, AddressConfiguration>>({})
const pendingAduAddressId = ref<string | null>(null)
let nextUnitId = 1

function createConfiguration(addressId: string): AddressConfiguration {
  return {
    addressId,
    mode: 'none',
    aduUnitId: null,
    houseUnitId: null,
    roomUnitIds: [],
  }
}

const orderedConfigurations = computed(() =>
  addresses.map((address) => configurations.value[address.id] ?? createConfiguration(address.id)),
)

const units = computed<UnitSelection[]>(() => {
  const selectedUnits: UnitSelection[] = []

  for (const configuration of orderedConfigurations.value) {
    if (configuration.mode === 'adu' && configuration.aduUnitId !== null) {
      selectedUnits.push({
        id: configuration.aduUnitId,
        type: 'adu',
        addressId: configuration.addressId,
      })
    }

    if (configuration.mode !== 'house-and-rooms') continue

    if (configuration.houseUnitId !== null) {
      selectedUnits.push({
        id: configuration.houseUnitId,
        type: 'whole-house',
        addressId: configuration.addressId,
      })
    }

    for (const roomId of configuration.roomUnitIds) {
      selectedUnits.push({ id: roomId, type: 'single-room', addressId: configuration.addressId })
    }
  }

  return selectedUnits
})

const unitTotal = computed(() => units.value.length)
const isValid = computed(
  () =>
    unitTotal.value > 0 &&
    pendingAduAddressId.value === null &&
    orderedConfigurations.value.every(
      (configuration) =>
        configuration.mode !== 'house-and-rooms' ||
        configuration.houseUnitId !== null ||
        configuration.roomUnitIds.length > 0,
    ),
)

function addressLabel(address: PropertyAddress) {
  return address.secondaryLine
    ? `${address.primaryLine} — ${address.secondaryLine}`
    : address.primaryLine
}

function configurationUnitCount(configuration: AddressConfiguration) {
  if (configuration.mode === 'adu') return 1
  if (configuration.mode !== 'house-and-rooms') return 0
  return (configuration.houseUnitId === null ? 0 : 1) + configuration.roomUnitIds.length
}

function clearConfiguration(configuration: AddressConfiguration) {
  configuration.aduUnitId = null
  configuration.houseUnitId = null
  configuration.roomUnitIds = []
}

function applyMode(configuration: AddressConfiguration, mode: AddressMode) {
  clearConfiguration(configuration)
  configuration.mode = mode
  if (mode === 'adu') configuration.aduUnitId = nextUnitId++
}

function requestMode(configuration: AddressConfiguration, mode: AddressMode) {
  if (configuration.mode === mode) return

  if (
    mode === 'adu' &&
    configuration.mode === 'house-and-rooms' &&
    configurationUnitCount(configuration) > 0
  ) {
    pendingAduAddressId.value = configuration.addressId
    return
  }

  if (pendingAduAddressId.value === configuration.addressId) pendingAduAddressId.value = null
  applyMode(configuration, mode)
}

function confirmAdu(configuration: AddressConfiguration) {
  applyMode(configuration, 'adu')
  pendingAduAddressId.value = null
}

function cancelAdu() {
  pendingAduAddressId.value = null
}

function canSelectAdu(configuration: AddressConfiguration) {
  return (
    configuration.mode === 'adu' ||
    configurationUnitCount(configuration) > 0 ||
    unitTotal.value < MAX_UNITS
  )
}

function toggleHouse(configuration: AddressConfiguration, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  if (checked && unitTotal.value >= MAX_UNITS) return
  configuration.houseUnitId = checked ? nextUnitId++ : null
}

function maximumRooms(configuration: AddressConfiguration) {
  return configuration.roomUnitIds.length + (MAX_UNITS - unitTotal.value)
}

function setRoomCount(configuration: AddressConfiguration, event: Event) {
  const target = event.target as HTMLInputElement
  const requested = Number(target.value)
  const nextCount = Number.isFinite(requested)
    ? Math.min(maximumRooms(configuration), Math.max(0, Math.trunc(requested)))
    : 0

  while (configuration.roomUnitIds.length < nextCount) {
    configuration.roomUnitIds.push(nextUnitId++)
  }
  if (configuration.roomUnitIds.length > nextCount) configuration.roomUnitIds.splice(nextCount)

  target.value = String(nextCount)
}

function changeRoomCount(configuration: AddressConfiguration, change: number) {
  const nextCount = Math.min(
    maximumRooms(configuration),
    Math.max(0, configuration.roomUnitIds.length + change),
  )

  while (configuration.roomUnitIds.length < nextCount) {
    configuration.roomUnitIds.push(nextUnitId++)
  }
  if (configuration.roomUnitIds.length > nextCount) configuration.roomUnitIds.splice(nextCount)
}

function finishDemo() {
  window.alert('demo over')
}

watch(
  () => addresses.map((address) => address.id),
  (addressIds) => {
    const nextConfigurations: Record<string, AddressConfiguration> = {}
    for (const addressId of addressIds) {
      nextConfigurations[addressId] =
        configurations.value[addressId] ?? createConfiguration(addressId)
    }
    configurations.value = nextConfigurations

    if (pendingAduAddressId.value && !addressIds.includes(pendingAduAddressId.value)) {
      pendingAduAddressId.value = null
    }
  },
  { immediate: true },
)

watch(
  units,
  (currentUnits) =>
    emit(
      'update:units',
      currentUnits.map((unit) => ({ ...unit })),
    ),
  { immediate: true },
)

watch(isValid, (valid) => emit('validity-change', valid), { immediate: true })
</script>

<template>
  <div>
    <div class="address-unit-summary" aria-live="polite">
      <div>
        <strong>{{ unitTotal }} of {{ MAX_UNITS }}</strong>
        <span>units selected</span>
      </div>
      <progress :value="unitTotal" :max="MAX_UNITS">{{ unitTotal }} of {{ MAX_UNITS }}</progress>
    </div>

    <p v-if="addresses.length === 0" class="form-message info-message" role="status">
      No addresses are available for unit selection.
    </p>

    <div class="address-unit-list">
      <fieldset
        v-for="(address, index) in addresses"
        :key="address.id"
        class="address-unit-card"
        :aria-describedby="
          configurations[address.id]?.mode === 'house-and-rooms' &&
          configurationUnitCount(configurations[address.id]!) === 0
            ? `address-incomplete-${address.id}`
            : undefined
        "
      >
        <legend>
          <span>Address {{ index + 1 }}</span>
          <strong>{{ addressLabel(address) }}</strong>
        </legend>

        <div
          v-if="configurations[address.id]"
          :key="`${address.id}-${pendingAduAddressId === address.id}`"
          class="address-mode-options"
        >
          <label :for="`address-mode-none-${address.id}`">
            <input
              :id="`address-mode-none-${address.id}`"
              :name="`address-mode-${address.id}`"
              type="radio"
              value="none"
              :checked="configurations[address.id]!.mode === 'none'"
              @change="requestMode(configurations[address.id]!, 'none')"
            />
            <span>Not renting</span>
          </label>
          <label :for="`address-mode-adu-${address.id}`">
            <input
              :id="`address-mode-adu-${address.id}`"
              :name="`address-mode-${address.id}`"
              type="radio"
              value="adu"
              :checked="configurations[address.id]!.mode === 'adu'"
              :disabled="!canSelectAdu(configurations[address.id]!)"
              @change="requestMode(configurations[address.id]!, 'adu')"
            />
            <span>ADU</span>
          </label>
          <label :for="`address-mode-mixed-${address.id}`">
            <input
              :id="`address-mode-mixed-${address.id}`"
              :name="`address-mode-${address.id}`"
              type="radio"
              value="house-and-rooms"
              :checked="configurations[address.id]!.mode === 'house-and-rooms'"
              @change="requestMode(configurations[address.id]!, 'house-and-rooms')"
            />
            <span>House and/or rooms</span>
          </label>
        </div>

        <div
          v-if="configurations[address.id]?.mode === 'house-and-rooms'"
          class="address-unit-controls"
        >
          <label class="house-control" :for="`address-house-${address.id}`">
            <input
              :id="`address-house-${address.id}`"
              type="checkbox"
              :checked="configurations[address.id]!.houseUnitId !== null"
              :disabled="configurations[address.id]!.houseUnitId === null && unitTotal >= MAX_UNITS"
              @change="toggleHouse(configurations[address.id]!, $event)"
            />
            <span>
              <strong>Whole house</strong>
              <small>Maximum of one at this address</small>
            </span>
          </label>

          <div class="room-count-control">
            <div>
              <label :for="`address-rooms-${address.id}`">Single rooms</label>
              <p class="field-hint">Add any number up to the application limit.</p>
            </div>
            <div class="number-stepper">
              <button
                type="button"
                :aria-label="`Remove a room from ${addressLabel(address)}`"
                :disabled="configurations[address.id]!.roomUnitIds.length === 0"
                @click="changeRoomCount(configurations[address.id]!, -1)"
              >
                −
              </button>
              <input
                :id="`address-rooms-${address.id}`"
                :value="configurations[address.id]!.roomUnitIds.length"
                type="number"
                min="0"
                :max="maximumRooms(configurations[address.id]!)"
                inputmode="numeric"
                @input="setRoomCount(configurations[address.id]!, $event)"
              />
              <button
                type="button"
                :aria-label="`Add a room to ${addressLabel(address)}`"
                :disabled="unitTotal >= MAX_UNITS"
                @click="changeRoomCount(configurations[address.id]!, 1)"
              >
                +
              </button>
            </div>
          </div>

          <p
            v-if="configurationUnitCount(configurations[address.id]!) === 0"
            :id="`address-incomplete-${address.id}`"
            class="field-hint"
          >
            Select the whole house, at least one room, or choose a different option.
          </p>
        </div>

        <div v-if="pendingAduAddressId === address.id" class="inline-confirmation" role="alert">
          <p>Selecting ADU will remove the existing house and room units from this address.</p>
          <div>
            <button
              class="primary-button"
              type="button"
              @click="confirmAdu(configurations[address.id]!)"
            >
              Replace with ADU
            </button>
            <button class="text-button" type="button" @click="cancelAdu">Keep current units</button>
          </div>
        </div>
      </fieldset>
    </div>

    <p v-if="unitTotal >= MAX_UNITS" class="form-message info-message" role="status">
      The 20-unit application limit has been reached.
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
