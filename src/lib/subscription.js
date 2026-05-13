const SUBSCRIPTION_VALUE = 'active';

export const getSubscriptionStorageKey = (userId) => `tpq_subscription_${userId}`;

export const hasActiveSubscription = (userId) => {
  if (!userId || typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(getSubscriptionStorageKey(userId)) === SUBSCRIPTION_VALUE;
  } catch {
    return false;
  }
};

export const activateSubscription = (userId) => {
  if (!userId || typeof window === 'undefined') {
    throw new Error('User belum tersedia untuk subscription.');
  }

  window.localStorage.setItem(getSubscriptionStorageKey(userId), SUBSCRIPTION_VALUE);
};
