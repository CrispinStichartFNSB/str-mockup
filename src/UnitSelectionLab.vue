<script setup lang="ts">
import { computed, ref } from 'vue'
import UnitSelection from '@/components/UnitSelection.vue'
import { demoProperty } from '@/data/mockProperty'
import type { PropertyAddress, UnitSelection as UnitSelectionModel } from '@/types/application'

const applicationUrl = `${import.meta.env.BASE_URL}`
const allAddressIds = demoProperty.unitAddresses.map((address) => address.id)

const disabled = ref(false)
const selectedAddressIds = ref([...allAddressIds])
const currentUnits = ref<UnitSelectionModel[]>([])
const isValid = ref(false)
const componentKey = ref(0)

const addresses = computed(() =>
  demoProperty.unitAddresses.filter((address) => selectedAddressIds.value.includes(address.id)),
)

function addressLabel(address: PropertyAddress) {
  return address.secondaryLine
    ? `${address.primaryLine} — ${address.secondaryLine}`
    : address.primaryLine
}

function useAllAddresses() {
  selectedAddressIds.value = [...allAddressIds]
}

function useMainAddressOnly() {
  selectedAddressIds.value = [demoProperty.primaryAddress.id]
}

function clearAddresses() {
  selectedAddressIds.value = []
}

function resetLab() {
  disabled.value = false
  selectedAddressIds.value = [...allAddressIds]
  currentUnits.value = []
  isValid.value = false
  componentKey.value += 1
}
</script>

<template>
  <div class="lab-shell">
    <header class="site-header lab-header">
      <a class="service-mark" :href="applicationUrl">
        <span aria-hidden="true" class="service-mark-icon">P</span>
        <span>Permit Services</span>
      </a>
      <a class="header-link" :href="applicationUrl">Back to application</a>
    </header>

    <main class="lab-layout">
      <aside class="lab-sidebar" aria-labelledby="lab-controls-heading">
        <p class="eyebrow">Component test page</p>
        <h1 id="lab-controls-heading">Unit Selection Lab</h1>
        <p class="lab-intro">Change the component props and inspect its emitted state.</p>

        <fieldset class="lab-control-group">
          <legend>State</legend>
          <label class="toggle-control" for="component-disabled">
            <input id="component-disabled" v-model="disabled" type="checkbox" />
            <span>
              <strong>Disabled</strong>
              <small>Sets the <code>disabled</code> prop</small>
            </span>
          </label>
        </fieldset>

        <fieldset class="lab-control-group">
          <legend>Available addresses</legend>
          <div class="lab-presets" aria-label="Address presets">
            <button type="button" @click="useAllAddresses">All five</button>
            <button type="button" @click="useMainAddressOnly">Main only</button>
            <button type="button" @click="clearAddresses">None</button>
          </div>

          <label
            v-for="address in demoProperty.unitAddresses"
            :key="address.id"
            class="address-control"
            :for="`address-prop-${address.id}`"
          >
            <input
              :id="`address-prop-${address.id}`"
              v-model="selectedAddressIds"
              type="checkbox"
              :value="address.id"
            />
            <span>{{ addressLabel(address) }}</span>
          </label>
        </fieldset>

        <section class="lab-output" aria-labelledby="component-output-heading">
          <h2 id="component-output-heading">Component output</h2>
          <dl>
            <div>
              <dt>Valid</dt>
              <dd id="lab-output-validity" aria-live="polite">{{ isValid ? 'true' : 'false' }}</dd>
            </div>
            <div>
              <dt>Units</dt>
              <dd id="lab-output-count" aria-live="polite">{{ currentUnits.length }}</dd>
            </div>
          </dl>
          <pre aria-label="Emitted units">{{ JSON.stringify(currentUnits, null, 2) }}</pre>
        </section>

        <button class="secondary-button lab-reset" type="button" @click="resetLab">
          Reset component and controls
        </button>
      </aside>

      <section class="lab-preview" aria-labelledby="component-preview-heading">
        <header class="lab-preview-heading">
          <div>
            <p class="eyebrow">Live preview</p>
            <h2 id="component-preview-heading">Rental units</h2>
          </div>
          <code>{{ addresses.length }} addresses · disabled: {{ disabled }}</code>
        </header>

        <div class="component-frame">
          <UnitSelection
            :key="componentKey"
            :addresses="addresses"
            :disabled="disabled"
            @update:units="currentUnits = $event"
            @validity-change="isValid = $event"
          />
        </div>
      </section>
    </main>
  </div>
</template>
