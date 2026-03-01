import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Statuses that are set intentionally and must never be overwritten by time-based logic
const TERMINAL_STATUSES = ['cancelled', 'completed'];

/**
 * Check and return correct auction status based on current time.
 * Terminal statuses (cancelled, completed) are always preserved as-is.
 */
export function getAuctionStatus(auction) {
  if (!auction) return 'ended';

  // Never overwrite a terminal status with a time-based one
  if (TERMINAL_STATUSES.includes(auction.status)) {
    return auction.status;
  }

  if (!auction.startTime || !auction.endTime) {
    return auction.status || 'ended';
  }

  const now = new Date();
  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);

  if (now < startTime) return 'upcoming';
  if (now >= startTime && now < endTime) return 'live';
  return 'ended';
}

/**
 * Update auction status in Firestore if it has changed.
 * Will not touch auctions in a terminal status.
 */
export async function updateAuctionStatusIfNeeded(auctionId, auction) {
  // Never touch a cancelled or completed auction
  if (TERMINAL_STATUSES.includes(auction.status)) {
    return auction.status;
  }

  const correctStatus = getAuctionStatus(auction);

  if (correctStatus !== auction.status) {
    try {
      await updateDoc(doc(db, 'auctions', auctionId), { status: correctStatus });
      console.log(`Updated auction ${auctionId} status to: ${correctStatus}`);
      return correctStatus;
    } catch (error) {
      console.error('Error updating auction status:', error);
      return auction.status;
    }
  }

  return auction.status;
}

/**
 * Check if auction is actually live (regardless of stored status)
 */
export function isAuctionLive(auction) {
  return getAuctionStatus(auction) === 'live';
}