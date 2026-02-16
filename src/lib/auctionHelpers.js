import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check and return correct auction status based on current time
 */
export function getAuctionStatus(auction) {
  if (!auction || !auction.startTime || !auction.endTime) {
    return auction?.status || 'ended';
  }

  const now = new Date();
  const startTime = new Date(auction.startTime);
  const endTime = new Date(auction.endTime);

  if (now < startTime) {
    return 'upcoming';
  } else if (now >= startTime && now < endTime) {
    return 'live';
  } else {
    return 'ended';
  }
}

/**
 * Update auction status in Firestore if it has changed
 */
export async function updateAuctionStatusIfNeeded(auctionId, auction) {
  const correctStatus = getAuctionStatus(auction);
  
  if (correctStatus !== auction.status) {
    try {
      await updateDoc(doc(db, 'auctions', auctionId), {
        status: correctStatus
      });
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