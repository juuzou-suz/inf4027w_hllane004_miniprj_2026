'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const prevAuctions = useRef({});

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => setNotifications([]), []);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(collection(db, 'auctions'), (snap) => {
      const newNotifications = [];

      snap.docs.forEach((doc) => {
        const auction = { id: doc.id, ...doc.data() };
        const prev = prevAuctions.current[auction.id];

        // Only care about live auctions
        if (auction.status !== 'live') {
          prevAuctions.current[auction.id] = auction;
          return;
        }

        // User was the highest bidder before, but isn't now
        const wasWinning = prev?.currentBidderId === user.uid;
        const isNowOutbid = auction.currentBidderId !== user.uid;
        const hadBid = prev && prev.bidCount > 0;

        if (wasWinning && isNowOutbid && hadBid) {
          newNotifications.push({
            id: `outbid-${auction.id}-${Date.now()}`,
            type: 'outbid',
            auctionId: auction.id,
            artworkId: auction.artworkId,
            newBid: auction.currentBid,
            message: `You've been outbid!`,
            sub: `New bid: ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(auction.currentBid)}`,
            timestamp: Date.now(),
          });
        }

        prevAuctions.current[auction.id] = auction;
      });

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev].slice(0, 10));
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <NotificationContext.Provider value={{ notifications, dismiss, dismissAll }}>
      {children}
      <NotificationToasts notifications={notifications} dismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

// Toast UI
function NotificationToasts({ notifications, dismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2" style={{ maxWidth: '340px' }}>
      {notifications.slice(0, 3).map((n) => (
        <Toast key={n.id} notification={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

function Toast({ notification, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto dismiss after 8s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 8000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        background: 'var(--surface)',
        border: '1px solid rgba(190,58,38,0.40)',
        borderRadius: '14px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      {/* Icon */}
      <div style={{
        flexShrink: 0,
        width: 36, height: 36,
        borderRadius: '10px',
        background: 'rgba(190,58,38,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px',
      }}>
        🔔
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {notification.message}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {notification.sub}
        </p>
        <a
          href={`/auctions/${notification.auctionId}`}
          style={{
            display: 'inline-block',
            marginTop: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--clay)',
            textDecoration: 'none',
          }}
        >
          Bid again →
        </a>
      </div>

      {/* Close */}
      <button
        onClick={onDismiss}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: '16px',
          lineHeight: 1,
          padding: '2px',
        }}
      >
        ×
      </button>
    </div>
  );
}