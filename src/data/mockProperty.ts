import mockHouseUrl from '@/assets/mock-house.png'
import type { PropertyAddress, PropertyFixture } from '@/types/application'

export const DEMO_MESSAGE = 'No demo data; use 123 Main St'

export const primaryAddressSuggestions = [
  '101 Main St',
  '118 Main St',
  '123 Main St',
  '127 Main St',
  '200 Main St',
]

const unitAddresses: PropertyAddress[] = [
  { id: 'main-house', primaryLine: '123 Main St' },
  { id: 'cabin-a', primaryLine: '123 Main St', secondaryLine: 'Cabin A' },
  { id: 'cabin-b', primaryLine: '123 Main St', secondaryLine: 'Cabin B' },
  { id: 'unit-14', primaryLine: '123 Main St', secondaryLine: 'Unit 14' },
  { id: 'unit-15', primaryLine: '123 Main St', secondaryLine: 'Unit 15' },
]

export const demoProperty: PropertyFixture = {
  id: 'property-123-main',
  pan: '1234567',
  ownerName: 'Barack Obama',
  primaryAddress: unitAddresses[0]!,
  unitAddresses,
  photoUrl: mockHouseUrl,
}
