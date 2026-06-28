const statusTones = {
  Open: 'danger',
  Acknowledged: 'warning',
  Resolved: 'success',
  Pending: 'warning',
  Accepted: 'info',
  InProgress: 'info',
  Completed: 'success',
  Cancelled: 'muted',
  Citizen: 'info',
  Volunteer: 'success',
  Admin: 'danger',
};

const priorityTones = {
  1: 'muted',
  2: 'muted',
  3: 'warning',
  4: 'danger',
  5: 'danger',
};

export function statusTone(value) {
  return statusTones[value] || 'neutral';
}

export function priorityTone(value) {
  return priorityTones[Number(value)] || 'warning';
}
