// Browser-native BroadcastChannel for real-time multi-tab state synchronization
const CHANNEL_NAME = 'rka_inventory_sync';
let channelInstance = null;

export function getSyncChannel() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!channelInstance) {
      channelInstance = new BroadcastChannel(CHANNEL_NAME);
    }
    return channelInstance;
  }
  return null;
}

/**
 * Broadcast an inventory, dispensing, or settings mutation across all open browser tabs
 * on the local workstation without requiring WebSockets.
 *
 * @param {string} action - 'STOCK_OUT' | 'STOCK_IN' | 'PO_UPDATE' | 'INVENTORY_ADJUSTMENT' | 'ALERT_ACK' | 'SETTINGS_UPDATE'
 * @param {object} [payload={}] - Optional metadata
 */
export function broadcastInventoryUpdate(action = 'INVENTORY_MUTATION', payload = {}) {
  try {
    const ch = getSyncChannel();
    if (ch) {
      ch.postMessage({
        type: 'RKA_SYNC_EVENT',
        action,
        timestamp: Date.now(),
        payload
      });
    }
  } catch (err) {
    console.warn('[RKA Sync] BroadcastChannel postMessage error:', err);
  }
}
