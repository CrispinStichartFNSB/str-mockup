export interface ApplicantContact {
  name: string
  phone: string
  email: string
}

export interface PropertyAddress {
  id: string
  primaryLine: string
  secondaryLine?: string
}

export interface PropertyFixture {
  id: string
  pan: string
  ownerName: string
  primaryAddress: PropertyAddress
  unitAddresses: PropertyAddress[]
  photoUrl: string
}

export type UnitType = 'single-room' | 'whole-house' | 'adu'

export interface UnitSelection {
  id: number
  type: UnitType | ''
  addressId: string
}
