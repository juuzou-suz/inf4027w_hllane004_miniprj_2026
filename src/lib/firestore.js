// Firestore helper functions for database operations
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// USERS
// ============================================

/**
 * Get user data by user ID
 * @param {string} userId - Firebase Auth user ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
export async function getUserById(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateUser(userId, data) {
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// ============================================
// ARTWORKS
// ============================================

/**
 * Get all artworks
 * @returns {Promise<Array>} Array of artwork objects
 */
export async function getAllArtworks() {
  try {
    const artworksCol = collection(db, 'artworks');
    const artworksSnapshot = await getDocs(artworksCol);
    return artworksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting artworks:', error);
    throw error;
  }
}

/**
 * Get artwork by ID
 * @param {string} artworkId - Artwork document ID
 * @returns {Promise<Object|null>} Artwork data or null if not found
 */
export async function getArtworkById(artworkId) {
  try {
    const artworkDoc = await getDoc(doc(db, 'artworks', artworkId));
    if (artworkDoc.exists()) {
      return { id: artworkDoc.id, ...artworkDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting artwork:', error);
    throw error;
  }
}

/**
 * Create new artwork (admin only)
 * @param {Object} artworkData - Artwork data
 * @returns {Promise<string>} New artwork ID
 */
export async function createArtwork(artworkData) {
  try {
    const docRef = await addDoc(collection(db, 'artworks'), {
      ...artworkData,
      createdAt: serverTimestamp(),
      status: 'available'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating artwork:', error);
    throw error;
  }
}

/**
 * Update artwork (admin only)
 * @param {string} artworkId - Artwork ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateArtwork(artworkId, data) {
  try {
    await updateDoc(doc(db, 'artworks', artworkId), data);
  } catch (error) {
    console.error('Error updating artwork:', error);
    throw error;
  }
}

/**
 * Delete artwork (admin only)
 * @param {string} artworkId - Artwork ID
 * @returns {Promise<void>}
 */
export async function deleteArtwork(artworkId) {
  try {
    await deleteDoc(doc(db, 'artworks', artworkId));
  } catch (error) {
    console.error('Error deleting artwork:', error);
    throw error;
  }
}

/**
 * Get artworks by status
 * @param {string} status - Status filter ('available', 'in_auction', 'sold', 'archived')
 * @returns {Promise<Array>} Filtered artworks
 */
export async function getArtworksByStatus(status) {
  try {
    const q = query(
      collection(db, 'artworks'),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting artworks by status:', error);
    throw error;
  }
}

/**
 * Search artworks by style
 * @param {string} style - Art style to search for
 * @returns {Promise<Array>} Matching artworks
 */
export async function getArtworksByStyle(style) {
  try {
    const q = query(
      collection(db, 'artworks'),
      where('style', '==', style)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting artworks by style:', error);
    throw error;
  }
}

// ============================================
// AUCTIONS (Week 2 - Preview)
// ============================================

/**
 * Get all auctions
 * @returns {Promise<Array>} Array of auction objects
 */
export async function getAllAuctions() {
  try {
    const auctionsCol = collection(db, 'auctions');
    const auctionsSnapshot = await getDocs(auctionsCol);
    return auctionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting auctions:', error);
    throw error;
  }
}

/**
 * Get auctions by status
 * @param {string} status - Status filter ('upcoming', 'live', 'ended', 'completed')
 * @returns {Promise<Array>} Filtered auctions
 */
export async function getAuctionsByStatus(status) {
  try {
    const q = query(
      collection(db, 'auctions'),
      where('status', '==', status),
      orderBy('startTime', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting auctions by status:', error);
    throw error;
  }
}

// ============================================
// BIDS (Week 2 - Preview)
// ============================================

/**
 * Get bids for a specific auction
 * @param {string} auctionId - Auction ID
 * @returns {Promise<Array>} Array of bids
 */
export async function getBidsByAuction(auctionId) {
  try {
    const q = query(
      collection(db, 'bids'),
      where('auctionId', '==', auctionId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting bids:', error);
    throw error;
  }
}

/**
 * Get user's bids
 * @param {string} userId - User ID
 * @returns {Promise<Array>} User's bids
 */
export async function getUserBids(userId) {
  try {
    const q = query(
      collection(db, 'bids'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user bids:', error);
    throw error;
  }
}

/**
 * Place a bid
 * @param {Object} bidData - Bid information
 * @returns {Promise<string>} New bid ID
 */
export async function placeBid(bidData) {
  try {
    const docRef = await addDoc(collection(db, 'bids'), {
      ...bidData,
      timestamp: serverTimestamp(),
      isWinning: true,  // Will be updated when new bids come in
      isOutbid: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
}