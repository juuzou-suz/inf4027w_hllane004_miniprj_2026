'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, Package, Gavel, ArrowRight,
  ChevronDown, MoreVertical, Shield, UserCheck, UserX, Search,
  RefreshCw, ExternalLink, Download, FileText, FileSpreadsheet,
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLORS = ['#A06A4B', '#C9A68A', '#8C5A3C', '#D4B9A3', '#6B3E26'];

// CSV download helper
function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const csv = [
    'sep=,',             
    headers,
    ...rows
  ].map((row) => Array.isArray(row) ? row.map(escape).join(',') : row).join('\n');

  const BOM = '\uFEFF';   
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Dropdown component
function Dropdown({ label, icon: Icon, items, value, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = items.find((i) => i.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
      >
        {Icon && <Icon size={15} style={{ color: 'var(--clay)' }} />}
        <span>{selected?.label || label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => { onChange(item.value); setOpen(false); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
              style={{ color: value === item.value ? 'var(--clay)' : 'var(--text-primary)' }}
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
              {value === item.value && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Download button with dropdown
function DownloadButton({ options }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (opt) => {
    setDownloading(opt.label);
    setOpen(false);
    await new Promise((r) => setTimeout(r, 200));
    opt.onDownload();
    setTimeout(() => setDownloading(null), 1200);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
        style={{ background: 'rgba(160,106,75,0.12)', borderColor: 'rgba(160,106,75,0.30)', color: 'var(--clay)' }}
      >
        <Download size={14} />
        {downloading ? `Downloading…` : 'Download'}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl border shadow-xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Export as CSV
          </p>
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleClick(opt)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-primary)' }}
            >
              <FileSpreadsheet size={14} style={{ color: 'var(--clay)' }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Stat card
function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
        style={{ background: accent || 'var(--clay)' }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="mt-2 font-display text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {sub && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(160,106,75,0.12)' }}>
          <Icon size={20} style={{ color: accent || 'var(--clay)' }} />
        </div>
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ title, sub, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-black" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {sub && <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [analyticsTab, setAnalyticsTab] = useState('financial');

  const [orders, setOrders] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);

  // User management states
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingRole, setUpdatingRole] = useState(null);
  const [roleSuccess, setRoleSuccess] = useState(null);

  useEffect(() => {
    if (!user) { router.push('/login?redirect=/admin'); return; }
    if (user.role !== 'admin') { router.push('/'); return; }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersSnap, artworksSnap, usersSnap, auctionsSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'artworks')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'auctions')),
      ]);
      setOrders(ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setArtworks(artworksSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setAuctions(auctionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Role management
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setRoleSuccess(userId);
      setTimeout(() => setRoleSuccess(null), 2000);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.name?.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // Metrics
  const formatCurrency = (v) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(v || 0);
  const formatDate = (val) => {
    if (!val) return '—';
    const d = val.toDate ? val.toDate() : new Date(val);
    return d.toLocaleDateString('en-ZA');
  };

  const financial = (() => {
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalCOGS = orders.reduce((s, o) => s + (o.items || []).reduce((is, item) => is + (item.cost || item.price * 0.4) * (item.quantity || 1), 0), 0);
    const grossProfit = totalRevenue - totalCOGS;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const monthlyData = {};
    orders.forEach((o) => {
      if (!o.createdAt) return;
      const date = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) monthlyData[key] = { revenue: 0, profit: 0, orders: 0 };
      const cost = (o.items || []).reduce((s, i) => s + (i.cost || i.price * 0.4) * (i.quantity || 1), 0);
      monthlyData[key].revenue += o.total || 0;
      monthlyData[key].profit += (o.total || 0) - cost;
      monthlyData[key].orders += 1;
    });

    const monthlyChart = Object.keys(monthlyData).sort().slice(-6).map((m) => ({
      month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: Math.round(monthlyData[m].revenue),
      profit: Math.round(monthlyData[m].profit),
    }));

    return { totalRevenue, totalCOGS, grossProfit, profitMargin, avgOrderValue, totalOrders: orders.length, monthlyChart };
  })();

  const product = (() => {
    const artworkSales = {};
    orders.forEach((o) => (o.items || []).forEach((item) => {
      const key = item.artworkId || item.id;
      if (!artworkSales[key]) artworkSales[key] = { id: key, title: item.title, artist: item.artist, quantity: 0, revenue: 0 };
      artworkSales[key].quantity += item.quantity || 1;
      artworkSales[key].revenue += item.price * (item.quantity || 1);
    }));

    const topArtworks = Object.values(artworkSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const styleCount = {};
    artworks.forEach((a) => { const s = a.style || 'Unknown'; styleCount[s] = (styleCount[s] || 0) + 1; });
    const styleChart = Object.entries(styleCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

    const soldIds = new Set(orders.flatMap((o) => (o.items || []).map((i) => i.artworkId)));
    const inAuction = artworks.filter((a) => auctions.some((au) => au.artworkId === a.id && au.status === 'live')).length;
    const sold = artworks.filter((a) => soldIds.has(a.id)).length;
    const available = artworks.length - sold - inAuction;

    return {
      totalArtworks: artworks.length, topArtworks, styleChart, availableCount: available, soldCount: sold,
      inventoryChart: [{ name: 'Available', value: available }, { name: 'Sold', value: sold }, { name: 'In Auction', value: inAuction }],
    };
  })();

  const customer = (() => {
    const customers = users.filter((u) => u.role !== 'admin');
    const purchases = {};
    orders.forEach((o) => {
      const uid = o.userId;
      if (!purchases[uid]) {
        const c = customers.find((u) => u.id === uid);
        purchases[uid] = {
          userId: uid,
          name: c?.name || c?.displayName || c?.email || o.userEmail || 'Unknown',
          email: c?.email || o.userEmail || '',
          orders: 0, totalSpent: 0,
          city: c?.address?.city || '—',
        };
      }
      purchases[uid].orders += 1;
      purchases[uid].totalSpent += o.total || 0;
    });

    const topCustomers = Object.values(purchases).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
    const cityCount = {};
    customers.forEach((c) => { const city = c.address?.city || 'Unknown'; cityCount[city] = (cityCount[city] || 0) + 1; });
    const cityChart = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

    const monthlyCustomers = {};
    customers.forEach((c) => {
      if (!c.createdAt) return;
      const date = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCustomers[key] = (monthlyCustomers[key] || 0) + 1;
    });
    const acquisitionChart = Object.keys(monthlyCustomers).sort().slice(-6).map((m) => ({
      month: new Date(m + '-01').toLocaleDateString('en-US', { month: 'short' }),
      customers: monthlyCustomers[m],
    }));

    const repeatCustomers = Object.values(purchases).filter((c) => c.orders > 1).length;
    return { totalCustomers: customers.length, topCustomers, cityChart, acquisitionChart, repeatRate: customers.length > 0 ? (repeatCustomers / customers.length) * 100 : 0, repeatCustomers };
  })();

  const liveAuctionsCount = auctions.filter((a) => a.status === 'live').length;

  // Download handlers
  const today = new Date().toISOString().slice(0, 10);

  const downloadOrders = () => {
    const headers = ['Order ID', 'Date', 'Customer Email', 'Items', 'Total (ZAR)', 'Status'];
    const rows = orders.map((o) => [
      o.id,
      formatDate(o.createdAt),
      o.userEmail || '—',
      (o.items || []).map((i) => `${i.title} x${i.quantity || 1}`).join('; '),
      (o.total || 0).toFixed(2),
      o.status || '—',
    ]);
    downloadCSV(`curate_orders_${today}.csv`, headers, rows);
  };

  const downloadFinancialSummary = () => {
    const headers = ['Month', 'Revenue (ZAR)', 'Profit (ZAR)'];
    const rows = financial.monthlyChart.map((m) => [m.month, m.revenue, m.profit]);
    // Append summary totals
    rows.push([]);
    rows.push(['TOTAL REVENUE', financial.totalRevenue.toFixed(2), '']);
    rows.push(['TOTAL COGS', financial.totalCOGS.toFixed(2), '']);
    rows.push(['GROSS PROFIT', financial.grossProfit.toFixed(2), '']);
    rows.push(['PROFIT MARGIN', `${financial.profitMargin.toFixed(1)}%`, '']);
    rows.push(['AVG ORDER VALUE', financial.avgOrderValue.toFixed(2), '']);
    downloadCSV(`curate_financial_report_${today}.csv`, headers, rows);
  };

  const downloadArtworks = () => {
    const headers = ['Artwork ID', 'Title', 'Artist', 'Style', 'Price (ZAR)', 'Status'];
    const soldIds = new Set(orders.flatMap((o) => (o.items || []).map((i) => i.artworkId)));
    const inAuctionIds = new Set(
      auctions.filter((a) => a.status === 'live').map((a) => a.artworkId)
    );
    const rows = artworks.map((a) => [
      a.id,
      a.title || '—',
      a.artist || '—',
      a.style || '—',
      (a.price || 0).toFixed(2),
      soldIds.has(a.id) ? 'Sold' : inAuctionIds.has(a.id) ? 'In Auction' : 'Available',
    ]);
    downloadCSV(`curate_artworks_${today}.csv`, headers, rows);
  };

  const downloadTopArtworks = () => {
    const headers = ['Rank', 'Title', 'Artist', 'Units Sold', 'Revenue (ZAR)'];
    const rows = product.topArtworks.map((a, i) => [
      i + 1,
      a.title || '—',
      a.artist || '—',
      a.quantity,
      a.revenue.toFixed(2),
    ]);
    downloadCSV(`curate_top_artworks_${today}.csv`, headers, rows);
  };

  const downloadCustomers = () => {
    const headers = ['Name', 'Email', 'City', 'Orders', 'Total Spent (ZAR)'];
    const customers = users.filter((u) => u.role !== 'admin');
    const purchases = {};
    orders.forEach((o) => {
      const uid = o.userId;
      if (!purchases[uid]) {
        const c = customers.find((u) => u.id === uid);
        purchases[uid] = {
          name: c?.name || c?.displayName || c?.email || o.userEmail || 'Unknown',
          email: c?.email || o.userEmail || '',
          city: c?.address?.city || '—',
          orders: 0, totalSpent: 0,
        };
      }
      purchases[uid].orders += 1;
      purchases[uid].totalSpent += o.total || 0;
    });
    const rows = Object.values(purchases)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .map((c) => [c.name, c.email, c.city, c.orders, c.totalSpent.toFixed(2)]);
    downloadCSV(`curate_customers_${today}.csv`, headers, rows);
  };

  const downloadUsers = () => {
    const headers = ['Name', 'Email', 'Role', 'Joined'];
    const rows = users.map((u) => [
      u.name || u.displayName || '—',
      u.email || '—',
      u.role || 'customer',
      formatDate(u.createdAt),
    ]);
    downloadCSV(`curate_users_${today}.csv`, headers, rows);
  };

  const downloadAuctions = () => {
    const headers = ['Auction ID', 'Artwork ID', 'Status', 'Start Price (ZAR)', 'Current Bid (ZAR)', 'End Date'];
    const rows = auctions.map((a) => [
      a.id,
      a.artworkId || '—',
      a.status || '—',
      (a.startPrice || 0).toFixed(2),
      (a.currentBid || a.startPrice || 0).toFixed(2),
      formatDate(a.endDate),
    ]);
    downloadCSV(`curate_auctions_${today}.csv`, headers, rows);
  };

  // Download options per view
  const overviewDownloadOptions = [
    { label: 'Orders Report', onDownload: downloadOrders },
    { label: 'Financial Summary', onDownload: downloadFinancialSummary },
    { label: 'Top Artworks', onDownload: downloadTopArtworks },
    { label: 'Top Customers', onDownload: downloadCustomers },
  ];

  const financialDownloadOptions = [
    { label: 'Monthly Revenue & Profit', onDownload: downloadFinancialSummary },
    { label: 'Full Orders List', onDownload: downloadOrders },
  ];

  const productsDownloadOptions = [
    { label: 'All Artworks', onDownload: downloadArtworks },
    { label: 'Top Selling Artworks', onDownload: downloadTopArtworks },
    { label: 'Auctions Report', onDownload: downloadAuctions },
  ];

  const customersDownloadOptions = [
    { label: 'All Customers', onDownload: downloadCustomers },
  ];

  const usersDownloadOptions = [
    { label: 'All Users', onDownload: downloadUsers },
  ];

  const viewItems = [
    { value: 'overview', label: 'Overview' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'users', label: 'User Management' },
  ];

  const analyticsItems = [
    { value: 'financial', label: 'Financial', icon: DollarSign },
    { value: 'products', label: 'Products', icon: Package },
    { value: 'customers', label: 'Customers', icon: Users },
  ];

  const roleFilterItems = [
    { value: 'all', label: 'All roles' },
    { value: 'admin', label: 'Admins' },
    { value: 'customer', label: 'Customers' },
  ];

  const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="h-10 w-10 animate-spin rounded-full border-2" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--clay)' }} />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="container py-10">

        {/* ── Top bar ── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--clay)' }}>Admin</p>
            <h1 className="font-display text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            <Dropdown
              label="View"
              items={viewItems}
              value={activeView}
              onChange={setActiveView}
            />
            <button
              onClick={fetchData}
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            {/* Download button — contextual per view */}
            {activeView === 'overview' && <DownloadButton options={overviewDownloadOptions} />}
            {activeView === 'users' && <DownloadButton options={usersDownloadOptions} />}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeView === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Revenue" value={formatCurrency(financial.totalRevenue)} icon={TrendingUp} />
              <StatCard label="Total Artworks" value={product.totalArtworks} sub={`${product.availableCount} available`} icon={Package} />
              <StatCard label="Customers" value={customer.totalCustomers} icon={Users} />
              <StatCard label="Live Auctions" value={liveAuctionsCount} icon={Gavel} accent="#BE3A26" />
            </div>

            {/* Top selling + top customers */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <SectionHeader
                  title="Top Selling Artworks"
                  action={
                    <button onClick={() => { setActiveView('analytics'); setAnalyticsTab('products'); }}
                      className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--clay)' }}>
                      Full report →
                    </button>
                  }
                />
                <div className="space-y-2">
                  {product.topArtworks.slice(0, 3).map((a, i) => (
                    <div key={a.id || i} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black" style={{ background: 'var(--clay)', color: '#F5EFE6' }}>{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.quantity} sold</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--clay)' }}>{formatCurrency(a.revenue)}</p>
                    </div>
                  ))}
                  {product.topArtworks.length === 0 && <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No sales yet</p>}
                </div>
              </div>

              <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <SectionHeader
                  title="Top Customers"
                  action={
                    <button onClick={() => { setActiveView('analytics'); setAnalyticsTab('customers'); }}
                      className="text-xs font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--clay)' }}>
                      Full report →
                    </button>
                  }
                />
                <div className="space-y-2">
                  {customer.topCustomers.slice(0, 3).map((c, i) => (
                    <div key={c.userId || i} className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/4" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black" style={{ background: 'var(--clay)', color: '#F5EFE6' }}>{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.orders} orders</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--clay)' }}>{formatCurrency(c.totalSpent)}</p>
                    </div>
                  ))}
                  {customer.topCustomers.length === 0 && <p className="py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No customers yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Dropdown label="Tab" items={analyticsItems} value={analyticsTab} onChange={setAnalyticsTab} />
              {/* Contextual download for analytics sub-tabs */}
              {analyticsTab === 'financial' && <DownloadButton options={financialDownloadOptions} />}
              {analyticsTab === 'products' && <DownloadButton options={productsDownloadOptions} />}
              {analyticsTab === 'customers' && <DownloadButton options={customersDownloadOptions} />}
            </div>

            {/* Financial */}
            {analyticsTab === 'financial' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Total Revenue" value={formatCurrency(financial.totalRevenue)} icon={TrendingUp} />
                  <StatCard label="Gross Profit" value={formatCurrency(financial.grossProfit)} sub={`${financial.profitMargin.toFixed(1)}% margin`} icon={DollarSign} />
                  <StatCard label="Avg Order" value={formatCurrency(financial.avgOrderValue)} icon={Package} />
                  <StatCard label="Total Orders" value={financial.totalOrders} icon={Gavel} />
                </div>

                <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <SectionHeader title="Revenue & Profit" sub="Last 6 months" />
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={financial.monthlyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#A06A4B" strokeWidth={2.5} dot={false} name="Revenue" />
                      <Line type="monotone" dataKey="profit" stroke="#184A3D" strokeWidth={2.5} dot={false} name="Profit" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <SectionHeader title="Financial Breakdown" />
                  <div className="space-y-2">
                    {[
                      { label: 'Total Revenue', value: formatCurrency(financial.totalRevenue), color: 'var(--clay)' },
                      { label: 'Cost of Goods Sold', value: `−${formatCurrency(financial.totalCOGS)}`, color: '#BE3A26' },
                      { label: 'Gross Profit', value: formatCurrency(financial.grossProfit), color: '#184A3D', bold: true },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: row.bold ? 'var(--clay)' : 'var(--border)', background: row.bold ? 'rgba(160,106,75,0.06)' : 'transparent' }}>
                        <span className={row.bold ? 'font-bold' : 'font-medium'} style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                        <span className={`font-display font-black ${row.bold ? 'text-xl' : 'text-base'}`} style={{ color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Products */}
            {analyticsTab === 'products' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Total Artworks" value={product.totalArtworks} icon={Package} />
                  <StatCard label="Available" value={product.availableCount} icon={Package} accent="#184A3D" />
                  <StatCard label="Sold" value={product.soldCount} icon={TrendingUp} />
                </div>

                <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <SectionHeader title="Top 5 Best Selling" />
                  <div className="space-y-2">
                    {product.topArtworks.map((a, i) => (
                      <div key={a.id || i} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black" style={{ background: 'var(--clay)', color: '#F5EFE6' }}>{i + 1}</span>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>by {a.artist}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold" style={{ color: 'var(--clay)' }}>{formatCurrency(a.revenue)}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.quantity} sold</p>
                        </div>
                      </div>
                    ))}
                    {product.topArtworks.length === 0 && <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No sales recorded yet</p>}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <SectionHeader title="Styles" />
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={product.styleChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                          {product.styleChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <SectionHeader title="Inventory" />
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={product.inventoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                          <Cell fill="#184A3D" /><Cell fill="#8C5A3C" /><Cell fill="#C9A68A" />
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Customers */}
            {analyticsTab === 'customers' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatCard label="Total Customers" value={customer.totalCustomers} icon={Users} />
                  <StatCard label="Repeat Customers" value={customer.repeatCustomers} sub={`${customer.repeatRate.toFixed(1)}% repeat rate`} icon={UserCheck} accent="#184A3D" />
                  <StatCard label="Avg Spend" value={formatCurrency(customer.topCustomers.length > 0 ? customer.topCustomers.reduce((s, c) => s + c.totalSpent, 0) / customer.topCustomers.length : 0)} icon={DollarSign} />
                </div>

                <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <SectionHeader title="Top 5 by Spend" />
                  <div className="space-y-2">
                    {customer.topCustomers.map((c, i) => (
                      <div key={c.userId || i} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black" style={{ background: 'var(--clay)', color: '#F5EFE6' }}>{i + 1}</span>
                          <div>
                            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.city} · {c.orders} orders</p>
                          </div>
                        </div>
                        <p className="font-display font-bold" style={{ color: 'var(--clay)' }}>{formatCurrency(c.totalSpent)}</p>
                      </div>
                    ))}
                    {customer.topCustomers.length === 0 && <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No customer data yet</p>}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <SectionHeader title="Top Cities" />
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={customer.cityChart} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={90} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="value" fill="#A06A4B" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <SectionHeader title="New Customers" sub="Last 6 months" />
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={customer.acquisitionChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="customers" stroke="#184A3D" strokeWidth={2.5} dot={false} name="New Customers" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {activeView === 'users' && (
          <div className="space-y-6">
            <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <SectionHeader
                title="User Management"
                sub={`${users.length} total users · ${users.filter((u) => u.role === 'admin').length} admins`}
              />

              {/* Filters */}
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5" style={{ borderColor: 'var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: 'var(--text-primary)' }}
                  />
                </div>
                <Dropdown
                  label="All roles"
                  items={roleFilterItems}
                  value={roleFilter}
                  onChange={setRoleFilter}
                  icon={Shield}
                />
              </div>

              {/* User list */}
              <div className="space-y-2">
                {filteredUsers.length === 0 && (
                  <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No users found</p>
                )}
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isCurrentUser = u.id === user?.uid;
                  const isUpdating = updatingRole === u.id;
                  const wasUpdated = roleSuccess === u.id;

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-white/4"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {/* Avatar + info */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black"
                          style={{ background: isAdmin ? 'rgba(160,106,75,0.20)' : 'rgba(255,255,255,0.06)', color: isAdmin ? 'var(--clay)' : 'var(--text-muted)' }}
                        >
                          {(u.name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {u.name || u.displayName || u.email || 'Unknown'}
                            {isCurrentUser && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--clay)' }}>(you)</span>}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                        </div>
                      </div>

                      {/* Role + actions */}
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {/* Role badge */}
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                          style={isAdmin
                            ? { borderColor: 'rgba(160,106,75,0.40)', background: 'rgba(160,106,75,0.12)', color: 'var(--clay)' }
                            : { borderColor: 'var(--border)', background: 'transparent', color: 'var(--text-muted)' }
                          }
                        >
                          {isAdmin ? '🛡 Admin' : '👤 Customer'}
                        </span>

                        {/* Promote / Demote — can't change own role */}
                        {!isCurrentUser && (
                          <button
                            onClick={() => handleRoleChange(u.id, isAdmin ? 'customer' : 'admin')}
                            disabled={isUpdating}
                            title={isAdmin ? 'Demote to Customer' : 'Promote to Admin'}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:bg-white/8 disabled:opacity-40"
                            style={{ borderColor: 'var(--border)', color: wasUpdated ? '#4ade80' : isAdmin ? '#BE3A26' : 'var(--clay)' }}
                          >
                            {isUpdating
                              ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                              : wasUpdated
                              ? '✓'
                              : isAdmin ? <UserX size={14} /> : <UserCheck size={14} />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-4 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <UserCheck size={12} style={{ color: 'var(--clay)' }} />
                  Promote to admin
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }} >
                  <UserX size={12} style={{ color: '#BE3A26' }} />
                  Demote to customer
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
