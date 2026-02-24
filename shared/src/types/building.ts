// Building and Apartment Types

export interface Building {
  id: string;
  name: string;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  apartmentCount: number;
  residentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Apartment {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor: number;
  size: number; // square meters
  occupancyStatus: 'vacant' | 'owner_occupied' | 'tenant_occupied';
  owner?: Resident;
  tenants: Resident[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resident {
  id: string;
  userId: string;
  apartmentId: string;
  buildingId: string;
  role: 'owner' | 'tenant';
  name: string;
  email: string;
  phone: string;
  moveInDate: Date;
  moveOutDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
