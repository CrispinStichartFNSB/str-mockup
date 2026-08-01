<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import FileUpload from '@/components/FileUpload.vue'
import UnitSelection from '@/components/UnitSelection.vue'
import { DEMO_MESSAGE, demoProperty, primaryAddressSuggestions } from '@/data/mockProperty'
import type {
  ApplicantContact,
  PropertyFixture,
  UnitSelection as UnitSelectionModel,
} from '@/types/application'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[1-9]\d{6,14}$/

const contact = ref<ApplicantContact>({ name: '', phone: '', email: '' })
const touched = ref({ name: false, phone: false, email: false })
const searchMode = ref<'address' | 'pan'>('address')
const addressQuery = ref('')
const panQuery = ref('')
const searchMessage = ref('')
const selectedProperty = ref<PropertyFixture | null>(null)
const ownerStatus = ref<'' | 'yes' | 'no'>('')
const authorizationFile = ref<File | null>(null)
const units = ref<UnitSelectionModel[]>([])
const unitsValid = ref(false)
const revealedStep = ref(1)
const unitSelectionKey = ref(0)

const propertyHeading = ref<HTMLElement | null>(null)
const ownershipHeading = ref<HTMLElement | null>(null)
const unitsHeading = ref<HTMLElement | null>(null)

const nameError = computed(() => (contact.value.name.trim() ? '' : 'Enter the applicant’s name.'))
const emailError = computed(() =>
  emailPattern.test(contact.value.email.trim()) ? '' : 'Enter a valid email address.',
)
const phoneError = computed(() => {
  if (!contact.value.phone.trim()) return ''
  const normalized = contact.value.phone.replace(/[\s().-]/g, '')
  return phonePattern.test(normalized) ? '' : 'Enter a valid phone number.'
})
const contactValid = computed(() => !nameError.value && !emailError.value && !phoneError.value)
const ownershipValid = computed(
  () => ownerStatus.value === 'yes' || (ownerStatus.value === 'no' && authorizationFile.value),
)
const priorStepsValid = computed(
  () => contactValid.value && Boolean(selectedProperty.value) && Boolean(ownershipValid.value),
)

function focusHeading(heading: typeof propertyHeading) {
  nextTick(() => heading.value?.focus())
}

function continueFromContact() {
  touched.value = { name: true, phone: true, email: true }
  if (!contactValid.value) return
  revealedStep.value = Math.max(revealedStep.value, 2)
  focusHeading(propertyHeading)
}

function resetAfterPropertyChange() {
  ownerStatus.value = ''
  authorizationFile.value = null
  units.value = []
  unitsValid.value = false
  unitSelectionKey.value += 1
}

function setSelectedProperty(property: PropertyFixture | null) {
  if (selectedProperty.value?.id !== property?.id) resetAfterPropertyChange()
  selectedProperty.value = property
}

function showDemoProperty() {
  searchMessage.value = ''
  setSelectedProperty(demoProperty)
}

function showNoDemoData() {
  setSelectedProperty(null)
  searchMessage.value = DEMO_MESSAGE
}

function searchByAddress() {
  if (
    addressQuery.value.trim().toLowerCase() ===
    demoProperty.primaryAddress.primaryLine.toLowerCase()
  ) {
    showDemoProperty()
  } else {
    showNoDemoData()
  }
}

function onAddressInput() {
  const exactSuggestion = primaryAddressSuggestions.find(
    (address) => address.toLowerCase() === addressQuery.value.trim().toLowerCase(),
  )
  if (exactSuggestion) searchByAddress()
}

function searchByPan() {
  if (panQuery.value.trim().toUpperCase() === demoProperty.pan) showDemoProperty()
  else showNoDemoData()
}

function continueFromProperty() {
  if (!contactValid.value || !selectedProperty.value) return
  revealedStep.value = Math.max(revealedStep.value, 3)
  focusHeading(ownershipHeading)
}

function continueFromOwnership() {
  if (!priorStepsValid.value) return
  revealedStep.value = Math.max(revealedStep.value, 4)
  focusHeading(unitsHeading)
}
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="service-mark" href="#main-content" aria-label="Permit Services home">
        <span aria-hidden="true" class="service-mark-icon">P</span>
        <span>Permit Services</span>
      </a>
      <span class="demo-badge">Interactive demo</span>
    </header>

    <main id="main-content" class="page-container">
      <header class="page-heading">
        <p class="eyebrow">Short-term rental permit</p>
        <h1>Application</h1>
      </header>

      <ol class="progress-list" aria-label="Application progress">
        <li
          v-for="(label, index) in ['Applicant', 'Property', 'Authorization', 'Units']"
          :key="label"
        >
          <span :aria-current="revealedStep === index + 1 ? 'step' : undefined">{{
            index + 1
          }}</span>
          {{ label }}
        </li>
      </ol>

      <form novalidate @submit.prevent>
        <section class="form-section" aria-labelledby="contact-heading">
          <div class="section-heading">
            <span class="step-number" aria-hidden="true">1</span>
            <div>
              <p class="step-label">Step 1 of 4</p>
              <h2 id="contact-heading">Applicant contact information</h2>
            </div>
          </div>

          <div class="field-grid">
            <div class="field-group field-span-2">
              <label for="applicant-name">Applicant name</label>
              <input
                id="applicant-name"
                v-model="contact.name"
                autocomplete="name"
                :aria-invalid="touched.name && Boolean(nameError)"
                :aria-describedby="touched.name && nameError ? 'name-error' : undefined"
                @blur="touched.name = true"
              />
              <p v-if="touched.name && nameError" id="name-error" class="field-error">
                {{ nameError }}
              </p>
            </div>

            <div class="field-group">
              <label for="applicant-email">Email address</label>
              <input
                id="applicant-email"
                v-model="contact.email"
                type="email"
                autocomplete="email"
                :aria-invalid="touched.email && Boolean(emailError)"
                :aria-describedby="touched.email && emailError ? 'email-error' : undefined"
                @blur="touched.email = true"
              />
              <p v-if="touched.email && emailError" id="email-error" class="field-error">
                {{ emailError }}
              </p>
            </div>

            <div class="field-group">
              <label for="applicant-phone"
                >Phone number <span class="optional">Optional</span></label
              >
              <input
                id="applicant-phone"
                v-model="contact.phone"
                type="tel"
                autocomplete="tel"
                :aria-invalid="touched.phone && Boolean(phoneError)"
                :aria-describedby="touched.phone && phoneError ? 'phone-error' : undefined"
                @blur="touched.phone = true"
              />
              <p v-if="touched.phone && phoneError" id="phone-error" class="field-error">
                {{ phoneError }}
              </p>
            </div>
          </div>

          <div class="section-actions">
            <button
              class="primary-button"
              type="button"
              :disabled="!contactValid"
              @click="continueFromContact"
            >
              Continue to property
            </button>
          </div>
        </section>

        <section v-if="revealedStep >= 2" class="form-section" aria-labelledby="property-heading">
          <div class="section-heading">
            <span class="step-number" aria-hidden="true">2</span>
            <div>
              <p class="step-label">Step 2 of 4</p>
              <h2 id="property-heading" ref="propertyHeading" tabindex="-1">Property selection</h2>
            </div>
          </div>

          <fieldset class="search-method">
            <legend>Search by</legend>
            <div class="segmented-control">
              <label>
                <input v-model="searchMode" type="radio" value="address" />
                <span>Address</span>
              </label>
              <label>
                <input v-model="searchMode" type="radio" value="pan" />
                <span>PAN</span>
              </label>
            </div>
          </fieldset>

          <div v-if="searchMode === 'address'" class="search-row">
            <div class="field-group">
              <label for="address-search">Property address</label>
              <input
                id="address-search"
                v-model="addressQuery"
                list="primary-addresses"
                autocomplete="off"
                @input="onAddressInput"
                @keyup.enter="searchByAddress"
              />
              <datalist id="primary-addresses">
                <option
                  v-for="address in primaryAddressSuggestions"
                  :key="address"
                  :value="address"
                />
              </datalist>
            </div>
            <button class="secondary-button" type="button" @click="searchByAddress">Search</button>
          </div>

          <div v-else class="search-row">
            <div class="field-group">
              <label for="pan-search">Property account number (PAN)</label>
              <input
                id="pan-search"
                v-model="panQuery"
                autocomplete="off"
                @keyup.enter="searchByPan"
              />
              <p class="field-hint">Demo PAN: {{ demoProperty.pan }}</p>
            </div>
            <button class="secondary-button" type="button" @click="searchByPan">Search</button>
          </div>

          <p v-if="searchMessage" class="form-message info-message" role="status">
            {{ searchMessage }}
          </p>

          <article
            v-if="selectedProperty"
            class="property-card"
            aria-labelledby="selected-property-heading"
          >
            <img :src="selectedProperty.photoUrl" alt="Exterior of the selected property" />
            <div class="property-details">
              <p class="card-label">Selected property</p>
              <h3 id="selected-property-heading">
                {{ selectedProperty.primaryAddress.primaryLine }}
              </h3>
              <dl>
                <div>
                  <dt>PAN</dt>
                  <dd>{{ selectedProperty.pan }}</dd>
                </div>
                <div>
                  <dt>Owner</dt>
                  <dd>{{ selectedProperty.ownerName }}</dd>
                </div>
              </dl>
            </div>
          </article>

          <div class="section-actions">
            <button
              class="primary-button"
              type="button"
              :disabled="!contactValid || !selectedProperty"
              @click="continueFromProperty"
            >
              Continue to authorization
            </button>
          </div>
        </section>

        <section v-if="revealedStep >= 3" class="form-section" aria-labelledby="ownership-heading">
          <div class="section-heading">
            <span class="step-number" aria-hidden="true">3</span>
            <div>
              <p class="step-label">Step 3 of 4</p>
              <h2 id="ownership-heading" ref="ownershipHeading" tabindex="-1">
                Owner authorization
              </h2>
            </div>
          </div>

          <fieldset class="choice-fieldset">
            <legend>Are you the property owner?</legend>
            <div class="choice-grid">
              <label class="choice-card"
                ><input v-model="ownerStatus" type="radio" value="yes" /> <span>Yes</span></label
              >
              <label class="choice-card"
                ><input v-model="ownerStatus" type="radio" value="no" /> <span>No</span></label
              >
            </div>
          </fieldset>

          <div v-if="ownerStatus === 'no'" class="authorization-upload">
            <h3>Owner authorization document</h3>
            <p>Upload the signed and notarized authorization from the property owner.</p>
            <FileUpload
              v-model="authorizationFile"
              :accepted-types="ACCEPTED_FILE_TYPES"
              :max-size-bytes="MAX_FILE_SIZE"
            />
          </div>

          <div class="section-actions">
            <button
              class="primary-button"
              type="button"
              :disabled="!priorStepsValid"
              @click="continueFromOwnership"
            >
              Continue to units
            </button>
          </div>
        </section>

        <section v-if="revealedStep >= 4" class="form-section" aria-labelledby="units-heading">
          <div class="section-heading">
            <span class="step-number" aria-hidden="true">4</span>
            <div>
              <p class="step-label">Step 4 of 4</p>
              <h2 id="units-heading" ref="unitsHeading" tabindex="-1">Rental units</h2>
            </div>
          </div>
          <p class="section-intro">Add each separate unit included in this permit application.</p>
          <UnitSelection
            v-if="selectedProperty"
            :key="unitSelectionKey"
            :addresses="selectedProperty.unitAddresses"
            :disabled="!priorStepsValid"
            @update:units="units = $event"
            @validity-change="unitsValid = $event"
          />
        </section>
      </form>
    </main>

    <footer>Short-term rental permit application demo</footer>
  </div>
</template>
