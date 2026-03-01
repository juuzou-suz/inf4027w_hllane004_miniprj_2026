'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllOrders } from '@/lib/firestore';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const data = await getAllOrders();
        if (mounted) setOrders(data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load orders.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price ?? 0);

  const paymentLabels = {
    credit_card: 'Card',
    paypal: 'PayPal',
    eft: 'EFT',
    cash_on_delivery: 'Cash',
  };

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.paymentMethod === filter);
  }, [orders, filter]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const itemsSold = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.itemCount || 0), 0);
  }, [orders]);

  const StatCard = ({ label, value, accent }) => (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
      }}
    >
      <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-black" style={{ color: accent || 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );

  const Chip = ({ value, label }) => {
    const active = filter === value;
    return (
      <button
        onClick={() => setFilter(value)}
        className="rounded-full px-4 py-2 text-sm font-semibold transition-all"
        style={{
          border: `1px solid ${active ? 'rgba(160,106,75,0.45)' : 'rgba(255,255,255,0.10)'}`,
          background: active ? 'rgba(160,106,75,0.10)' : 'rgba(255,255,255,0.04)',
          color: active ? 'var(--clay)' : 'var(--text-primary)',
        }}
        type="button"
      >
        {label}
      </button>
    );
  };

  const statusPill = (status) => {
    const s = (status || '').toLowerCase();
    
    const map = {
      completed: { bg: 'rgba(58, 122, 87, 0.14)', bd: 'rgba(58, 122, 87, 0.22)', fg: 'rgba(220, 255, 235, 0.95)' },
      pending: { bg: 'rgba(167, 107, 17, 0.14)', bd: 'rgba(167, 107, 17, 0.22)', fg: 'rgba(255, 235, 205, 0.95)' },
      failed: { bg: 'rgba(190, 58, 38, 0.14)', bd: 'rgba(190, 58, 38, 0.22)', fg: 'rgba(255, 220, 215, 0.95)' },
    };

    const v = map[s] || { bg: 'rgba(111, 102, 94, 0.16)', bd: 'rgba(111, 102, 94, 0.22)', fg: 'rgba(243, 236, 228, 0.88)' };

    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          background: v.bg,
          border: `1px solid ${v.bd}`,
          color: v.fg,
          letterSpacing: '0.06em',
        }}
      >
        {(status || 'unknown').toUpperCase()}
      </span>
    );
  };

  const formatDate = (createdAt) => {
    if (!createdAt) return 'N/A';
    try {
      const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>
          Orders
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          View and review customer orders.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 rounded-2xl px-4 py-3 text-sm"
          style={{
            background: 'rgba(190, 58, 38, 0.10)',
            border: '1px solid rgba(190, 58, 38, 0.22)',
            color: 'rgba(255, 220, 215, 0.95)',
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total orders" value={orders.length} accent="var(--text-primary)" />
        <StatCard label="Total revenue" value={formatPrice(totalRevenue)} accent="var(--clay)" />
        <StatCard label="Items sold" value={itemsSold} accent="var(--text-primary)" />
      </div>

      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Chip value="all" label="All" />
        <Chip value="credit_card" label="Card" />
        <Chip value="paypal" label="PayPal" />
        <Chip value="eft" label="EFT" />
        <Chip value="cash_on_delivery" label="Cash" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-14">
          <div
            className="h-12 w-12 animate-spin rounded-full border-2"
            style={{ borderColor: 'rgba(255,255,255,0.10)', borderTopColor: 'var(--clay)' }}
          />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      style={{
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span
                          className="inline-flex rounded-lg px-2 py-1 font-mono text-xs"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {(order.id || '').substring(0, 8)}…
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {order.userEmail || '—'}
                      </td>

                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <div className="max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>
                          {order.items?.map((i) => i.title).filter(Boolean).join(', ') || '—'}
                        </div>
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {order.itemCount || 0} {(order.itemCount || 0) === 1 ? 'item' : 'items'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm font-semibold" style={{ color: 'var(--clay)' }}>
                        {formatPrice(order.total)}
                      </td>

                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        {paymentLabels[order.paymentMethod] || order.paymentMethod || '—'}
                      </td>

                      <td className="px-6 py-4">{statusPill(order.status)}</td>

                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      )}
    </div>
  );
}