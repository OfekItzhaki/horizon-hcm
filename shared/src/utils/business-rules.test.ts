import { describe, it, expect } from 'vitest';

// Property 11: Apartment Unit Number Uniqueness
describe('Apartment Unit Number Uniqueness', () => {
  interface Apartment {
    id: string;
    buildingId: string;
    unitNumber: string;
  }

  const validateUniqueUnitNumbers = (apartments: Apartment[]): boolean => {
    const unitNumbers = new Map<string, Set<string>>();

    for (const apt of apartments) {
      if (!unitNumbers.has(apt.buildingId)) {
        unitNumbers.set(apt.buildingId, new Set());
      }

      const buildingUnits = unitNumbers.get(apt.buildingId)!;
      if (buildingUnits.has(apt.unitNumber)) {
        return false; // Duplicate found
      }
      buildingUnits.add(apt.unitNumber);
    }

    return true;
  };

  it('should allow unique unit numbers within a building', () => {
    const apartments: Apartment[] = [
      { id: '1', buildingId: 'b1', unitNumber: '101' },
      { id: '2', buildingId: 'b1', unitNumber: '102' },
      { id: '3', buildingId: 'b1', unitNumber: '103' },
    ];

    expect(validateUniqueUnitNumbers(apartments)).toBe(true);
  });

  it('should reject duplicate unit numbers within same building', () => {
    const apartments: Apartment[] = [
      { id: '1', buildingId: 'b1', unitNumber: '101' },
      { id: '2', buildingId: 'b1', unitNumber: '102' },
      { id: '3', buildingId: 'b1', unitNumber: '101' }, // Duplicate
    ];

    expect(validateUniqueUnitNumbers(apartments)).toBe(false);
  });

  it('should allow same unit numbers in different buildings', () => {
    const apartments: Apartment[] = [
      { id: '1', buildingId: 'b1', unitNumber: '101' },
      { id: '2', buildingId: 'b2', unitNumber: '101' }, // Same number, different building
      { id: '3', buildingId: 'b3', unitNumber: '101' }, // Same number, different building
    ];

    expect(validateUniqueUnitNumbers(apartments)).toBe(true);
  });
});

// Property 12: Single Owner Per Apartment Invariant
describe('Single Owner Per Apartment Invariant', () => {
  interface Resident {
    id: string;
    apartmentId: string;
    role: 'owner' | 'tenant';
  }

  const validateSingleOwnerPerApartment = (residents: Resident[]): boolean => {
    const ownersByApartment = new Map<string, number>();

    for (const resident of residents) {
      if (resident.role === 'owner') {
        const count = ownersByApartment.get(resident.apartmentId) || 0;
        ownersByApartment.set(resident.apartmentId, count + 1);

        if (count + 1 > 1) {
          return false; // More than one owner
        }
      }
    }

    return true;
  };

  it('should allow one owner per apartment', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'owner' },
      { id: '2', apartmentId: 'a2', role: 'owner' },
      { id: '3', apartmentId: 'a3', role: 'owner' },
    ];

    expect(validateSingleOwnerPerApartment(residents)).toBe(true);
  });

  it('should reject multiple owners for same apartment', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'owner' },
      { id: '2', apartmentId: 'a1', role: 'owner' }, // Second owner
    ];

    expect(validateSingleOwnerPerApartment(residents)).toBe(false);
  });

  it('should allow multiple tenants per apartment', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'owner' },
      { id: '2', apartmentId: 'a1', role: 'tenant' },
      { id: '3', apartmentId: 'a1', role: 'tenant' },
      { id: '4', apartmentId: 'a1', role: 'tenant' },
    ];

    expect(validateSingleOwnerPerApartment(residents)).toBe(true);
  });

  it('should allow apartments with only tenants (no owner)', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'tenant' },
      { id: '2', apartmentId: 'a1', role: 'tenant' },
    ];

    expect(validateSingleOwnerPerApartment(residents)).toBe(true);
  });
});

// Property 13: Multiple Tenants Per Apartment
describe('Multiple Tenants Per Apartment', () => {
  interface Resident {
    id: string;
    apartmentId: string;
    role: 'owner' | 'tenant';
  }

  const countTenantsByApartment = (residents: Resident[]): Map<string, number> => {
    const tenantCounts = new Map<string, number>();

    for (const resident of residents) {
      if (resident.role === 'tenant') {
        const count = tenantCounts.get(resident.apartmentId) || 0;
        tenantCounts.set(resident.apartmentId, count + 1);
      }
    }

    return tenantCounts;
  };

  it('should allow multiple tenants in same apartment', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'tenant' },
      { id: '2', apartmentId: 'a1', role: 'tenant' },
      { id: '3', apartmentId: 'a1', role: 'tenant' },
    ];

    const counts = countTenantsByApartment(residents);
    expect(counts.get('a1')).toBe(3);
  });

  it('should count tenants correctly across multiple apartments', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'tenant' },
      { id: '2', apartmentId: 'a1', role: 'tenant' },
      { id: '3', apartmentId: 'a2', role: 'tenant' },
      { id: '4', apartmentId: 'a3', role: 'tenant' },
      { id: '5', apartmentId: 'a3', role: 'tenant' },
      { id: '6', apartmentId: 'a3', role: 'tenant' },
    ];

    const counts = countTenantsByApartment(residents);
    expect(counts.get('a1')).toBe(2);
    expect(counts.get('a2')).toBe(1);
    expect(counts.get('a3')).toBe(3);
  });

  it('should not count owners as tenants', () => {
    const residents: Resident[] = [
      { id: '1', apartmentId: 'a1', role: 'owner' },
      { id: '2', apartmentId: 'a1', role: 'tenant' },
      { id: '3', apartmentId: 'a1', role: 'tenant' },
    ];

    const counts = countTenantsByApartment(residents);
    expect(counts.get('a1')).toBe(2); // Only tenants, not owner
  });
});

// Property 18: Single Vote Per Poll Enforcement
describe('Single Vote Per Poll Enforcement', () => {
  interface Vote {
    pollId: string;
    userId: string;
    optionId: string;
  }

  const validateSingleVotePerPoll = (votes: Vote[]): boolean => {
    const votesByUserAndPoll = new Map<string, Set<string>>();

    for (const vote of votes) {
      if (!votesByUserAndPoll.has(vote.userId)) {
        votesByUserAndPoll.set(vote.userId, new Set());
      }

      const userPolls = votesByUserAndPoll.get(vote.userId)!;
      if (userPolls.has(vote.pollId)) {
        return false; // User already voted on this poll
      }
      userPolls.add(vote.pollId);
    }

    return true;
  };

  it('should allow one vote per user per poll', () => {
    const votes: Vote[] = [
      { pollId: 'p1', userId: 'u1', optionId: 'o1' },
      { pollId: 'p2', userId: 'u1', optionId: 'o2' },
      { pollId: 'p1', userId: 'u2', optionId: 'o1' },
    ];

    expect(validateSingleVotePerPoll(votes)).toBe(true);
  });

  it('should reject multiple votes from same user on same poll', () => {
    const votes: Vote[] = [
      { pollId: 'p1', userId: 'u1', optionId: 'o1' },
      { pollId: 'p1', userId: 'u1', optionId: 'o2' }, // Duplicate vote
    ];

    expect(validateSingleVotePerPoll(votes)).toBe(false);
  });

  it('should allow same user to vote on different polls', () => {
    const votes: Vote[] = [
      { pollId: 'p1', userId: 'u1', optionId: 'o1' },
      { pollId: 'p2', userId: 'u1', optionId: 'o1' },
      { pollId: 'p3', userId: 'u1', optionId: 'o1' },
    ];

    expect(validateSingleVotePerPoll(votes)).toBe(true);
  });
});

// Property 10: Search Result Filtering
describe('Search Result Filtering', () => {
  interface SearchableItem {
    id: string;
    name: string;
    email?: string;
    description?: string;
  }

  const searchItems = (items: SearchableItem[], query: string): SearchableItem[] => {
    const lowerQuery = query.toLowerCase();
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(lowerQuery) ||
        item.email?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      );
    });
  };

  it('should return only matching items', () => {
    const items: SearchableItem[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    ];

    const results = searchItems(items, 'john');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['1', '3']);
  });

  it('should be case-insensitive', () => {
    const items: SearchableItem[] = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'jane smith' },
    ];

    const results1 = searchItems(items, 'JOHN');
    const results2 = searchItems(items, 'john');
    const results3 = searchItems(items, 'John');

    expect(results1).toHaveLength(1);
    expect(results2).toHaveLength(1);
    expect(results3).toHaveLength(1);
  });

  it('should return empty array when no matches', () => {
    const items: SearchableItem[] = [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
    ];

    const results = searchItems(items, 'xyz');
    expect(results).toHaveLength(0);
  });

  it('should search across multiple fields', () => {
    const items: SearchableItem[] = [
      { id: '1', name: 'John', email: 'test@example.com', description: 'Admin user' },
      { id: '2', name: 'Jane', email: 'jane@test.com', description: 'Regular user' },
    ];

    const results = searchItems(items, 'test');
    expect(results).toHaveLength(2);
  });
});
