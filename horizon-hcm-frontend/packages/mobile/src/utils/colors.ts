// Status color mappings
export const getInvoiceStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return '#4caf50';
    case 'pending':
      return '#ff9800';
    case 'overdue':
      return '#f44336';
    case 'cancelled':
      return '#9e9e9e';
    default:
      return '#757575';
  }
};

export const getMaintenanceStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return '#4caf50';
    case 'in_progress':
      return '#2196f3';
    case 'pending':
      return '#ff9800';
    case 'cancelled':
      return '#9e9e9e';
    default:
      return '#757575';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return '#f44336';
    case 'high':
      return '#ff9800';
    case 'normal':
    case 'medium':
      return '#2196f3';
    case 'low':
      return '#9e9e9e';
    default:
      return '#757575';
  }
};

export const getApartmentStatusColor = (status: string): string => {
  switch (status) {
    case 'owner_occupied':
      return '#2196f3';
    case 'tenant_occupied':
      return '#4caf50';
    case 'vacant':
      return '#ff9800';
    default:
      return '#757575';
  }
};

export const getResidentRoleColor = (role: string): string => {
  switch (role) {
    case 'owner':
      return '#2196f3';
    case 'tenant':
      return '#4caf50';
    case 'committee_member':
      return '#ff9800';
    default:
      return '#757575';
  }
};

export const getPaymentMethodColor = (method: string): string => {
  switch (method) {
    case 'credit_card':
      return '#2196f3';
    case 'bank_transfer':
      return '#4caf50';
    case 'cash':
      return '#ff9800';
    default:
      return '#757575';
  }
};
