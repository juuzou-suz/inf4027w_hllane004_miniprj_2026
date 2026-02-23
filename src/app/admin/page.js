'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllArtworks, getAllAuctions } from '@/lib/firestore';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalArtworks: 0,
    availableArtworks: 0,
    totalAuctions: 0,
    liveAuctions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const artworks = await getAllArtworks();
      const availableArtworks = artworks.filter((a) => a.status === 'available');

      let auctions = [];
      try {
        auctions = await getAllAuctions();
      } catch (error) {
        console.log('No auctions yet');
      }
      const liveAuctions = auctions.filter((a) => a.status === 'live');

      setStats({
        totalArtworks: artworks.length,
        availableArtworks: availableArtworks.length,
        totalAuctions: auctions.length,
        liveAuctions: liveAuctions.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, tone }) => {
    // tone: 'neutral' | 'success' | 'info'
    const tones = {
      neutral: {
        valueColor: 'var(--text-primary)',
        chipBg: 'rgba(255,255,255,0.04)',
        chipBd: 'rgba(255,255,255,0.10)',
        chipFg: 'var(--text-muted)',
      },
      success: {
        valueColor: 'rgba(210,255,230,0.95)',
        chipBg: 'rgba(190,255,210,0.12)',
        chipBd: 'rgba(190,255,210,0.25)',
        chipFg: 'rgba(210,255,230,0.95)',
      },
      info: {
        valueColor: 'rgba(210,230,255,0.95)',
        chipBg: 'rgba(140,180,255,0.10)',
        chipBd: 'rgba(140,180,255,0.28)',
        chipFg: 'rgba(210,230,255,0.95)',
      },
    };

    const t = tones[tone] || tones.neutral;

    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              background: t.chipBg,
              borderColor: t.chipBd,
              color: t.chipFg,
            }}
          >
            {label}
          </span>
        </div>

        <div className="font-display text-3xl font-black mb-1" style={{ color: t.valueColor }}>
          {value}
        </div>

        <div className="text-sm text-muted-foreground">
          {label}
        </div>
      </div>
    );
  };

  const ActionCard = ({ href, title, description }) => (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-card p-5 transition hover:shadow-lg"
    >
      <div className="font-semibold text-foreground">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{description}</div>
      <div className="mt-4 inline-flex rounded-full px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition">
        Open
      </div>
    </Link>
  );

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage artworks, auctions, orders, and reports.
        </p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Total artworks" value={stats.totalArtworks} tone="neutral" />
          <StatCard label="Available artworks" value={stats.availableArtworks} tone="success" />
          <StatCard label="Total auctions" value={stats.totalAuctions} tone="neutral" />
          <StatCard label="Live auctions" value={stats.liveAuctions} tone="info" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold">Quick actions</h2>
          <button
            onClick={fetchStats}
            className="rounded-full px-4 py-2 text-xs font-semibold border"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-muted)',
            }}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            href="/admin/artworks/new"
            title="Add artwork"
            description="Create a new artwork listing."
          />
          <ActionCard
            href="/admin/artworks"
            title="Manage artworks"
            description="View, edit, and update listings."
          />
          <ActionCard
            href="/admin/auctions"
            title="Manage auctions"
            description="Create and monitor auctions."
          />
        </div>
      </div>
    </div>
  );
}