'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArtworkById, updateArtwork } from '@/lib/firestore';

export default function EditArtworkPage() {
  const params = useParams();
  const router = useRouter();
  const artworkId = params.id;

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    imageUrl: '',
    medium: '',
    style: '',
    width: '',
    height: '',
    depth: '',
    yearCreated: new Date().getFullYear(),
    price: '',
    startingBid: '',
    status: 'available',
    tags: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (artworkId) fetchArtwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkId]);

  const fetchArtwork = async () => {
    try {
      setLoading(true);
      const artwork = await getArtworkById(artworkId);

      if (!artwork) {
        setError('Artwork not found');
        setLoading(false);
        return;
      }

      setFormData({
        title: artwork.title || '',
        artist: artwork.artist || '',
        description: artwork.description || '',
        imageUrl: artwork.imageUrl || '',
        medium: artwork.medium || '',
        style: artwork.style || '',
        width: artwork.dimensions?.width ?? '',
        height: artwork.dimensions?.height ?? '',
        depth: artwork.dimensions?.depth ?? '',
        yearCreated: artwork.yearCreated || new Date().getFullYear(),
        price: artwork.price ?? '',
        startingBid: artwork.startingBid ?? '',
        status: artwork.status || 'available',
        tags: artwork.tags?.join(', ') || '',
      });

      setError('');
    } catch (err) {
      console.error('Error fetching artwork:', err);
      setError('Failed to load artwork data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.title || !formData.artist || !formData.medium || !formData.style || !formData.price) {
        setError('Please fill in all required fields');
        setSaving(false);
        return;
      }

      // Validate image path if provided
      if (formData.imageUrl) {
        const trimmed = formData.imageUrl.trim();

        if (!trimmed.startsWith('/Images/')) {
          setError('Image path must start with /Images/');
          setSaving(false); // ✅ FIX: was setLoading(false)
          return;
        }

        if (!/\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
          setError('Image must be .jpg, .jpeg, .png or .webp');
          setSaving(false); // ✅ FIX: was setLoading(false)
          return;
        }
      }

      const updateData = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        description: (formData.description || '').trim(),
        imageUrl: (formData.imageUrl || '').trim() || '/Images/Placeholder.png',
        medium: formData.medium.trim(),
        style: formData.style.trim(),
        dimensions: {
          width: parseFloat(formData.width) || 0,
          height: parseFloat(formData.height) || 0,
          depth: parseFloat(formData.depth) || 0,
        },
        yearCreated: parseInt(formData.yearCreated) || new Date().getFullYear(),
        price: formData.price ? parseFloat(formData.price) : null,
        startingBid: parseFloat(formData.startingBid),
        status: formData.status,
        tags: (formData.tags || '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      };

      await updateArtwork(artworkId, updateData);
      router.push('/admin/artworks');
    } catch (err) {
      console.error('Error updating artwork:', err);
      setError('Failed to update artwork. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  // artwork not found case
  if (error && !formData.title) {
    return (
      <div className="rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] p-8 text-center">
        <h2 className="font-display text-2xl font-black text-[rgba(255,225,225,0.95)] mb-4">
          {error}
        </h2>
        <button
          onClick={() => router.push('/admin/artworks')}
          className="rounded-full px-6 py-3 text-sm font-semibold transition hover:brightness-110
                     bg-primary text-primary-foreground"
          type="button"
        >
          Back to artworks
        </button>
      </div>
    );
  }

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black mb-2">Edit artwork</h1>
        <p className="text-muted-foreground">Update the listing details below.</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] px-4 py-3 text-sm text-[rgba(255,225,225,0.95)]">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field className="md:col-span-2" label="Title" required>
            <Input name="title" value={formData.title} onChange={handleChange} required />
          </Field>

          <Field label="Artist name" required>
            <Input name="artist" value={formData.artist} onChange={handleChange} required />
          </Field>

          <Field label="Year created">
            <Input
              type="number"
              name="yearCreated"
              value={formData.yearCreated}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              autoComplete="off"
            />
          </Field>

          <Field className="md:col-span-2" label="Image path">
            <Input
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="/Images/Placeholder.jpg"
            />

            {formData.imageUrl && (
              <div className="mt-4">
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: 'rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full max-w-2xl h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/900x600?text=Invalid+Image+Path';
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tip: This must be a local path starting with <span className="font-semibold">/Images/</span>.
                </p>
              </div>
            )}
          </Field>

          <Field label="Medium" required>
            <Select name="medium" value={formData.medium} onChange={handleChange} required>
              <option value="">Select medium</option>
              <option value="Oil on canvas">Oil on canvas</option>
              <option value="Acrylic on canvas">Acrylic on canvas</option>
              <option value="Watercolour">Watercolour</option>
              <option value="Digital art">Digital art</option>
              <option value="Mixed media">Mixed media</option>
              <option value="Photography">Photography</option>
              <option value="Sculpture">Sculpture</option>
              <option value="Charcoal">Charcoal</option>
              <option value="Pastel">Pastel</option>
              <option value="Other">Other</option>
            </Select>
          </Field>

          <Field label="Style" required>
            <Select name="style" value={formData.style} onChange={handleChange} required>
              <option value="">Select style</option>
              <option value="Abstract">Abstract</option>
              <option value="Realism">Realism</option>
              <option value="Impressionism">Impressionism</option>
              <option value="Expressionism">Expressionism</option>
              <option value="Surrealism">Surrealism</option>
              <option value="Contemporary">Contemporary</option>
              <option value="Minimalism">Minimalism</option>
              <option value="Pop Art">Pop Art</option>
              <option value="Landscape">Landscape</option>
              <option value="Portrait">Portrait</option>
              <option value="Other">Other</option>
            </Select>
          </Field>

          <Field label="Width (cm)">
            <Input type="number" name="width" value={formData.width} onChange={handleChange} min="0" step="0.1" autoComplete="off" />
          </Field>

          <Field label="Height (cm)">
            <Input type="number" name="height" value={formData.height} onChange={handleChange} min="0" step="0.1" autoComplete="off" />
          </Field>

          <Field label="Depth (cm)">
            <Input type="number" name="depth" value={formData.depth} onChange={handleChange} min="0" step="0.1" autoComplete="off" />
          </Field>

          <Field label="Price (ZAR) — direct purchase" required>
            <Input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="10"
              step="10"
              autoComplete="off"
              required
            />
          </Field>

          <Field label="Starting bid (ZAR) — auctions">
            <Input
              type="number"
              name="startingBid"
              value={formData.startingBid}
              onChange={handleChange}
              min="10"
              step="10"
              autoComplete="off"
            />
          </Field>

          <Field label="Status">
            <Select name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="in_auction">In auction</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>

          <Field className="md:col-span-2" label="Description">
            <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} />
          </Field>

          <Field className="md:col-span-2" label="Tags (comma-separated)">
            <Input
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="abstract, colourful, modern, nature"
            />
          </Field>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            type="button"
            onClick={() => router.push('/admin/artworks')}
            className="flex-1 rounded-full px-6 py-3 text-sm font-semibold border transition hover:opacity-90"
            style={{
              borderColor: 'rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-primary)',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-full px-6 py-3 text-sm font-semibold transition hover:brightness-110
                       bg-primary text-primary-foreground disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Small UI helpers (same style as /new) ---------- */

function Field({ label, required, className = '', children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        {label} {required ? <span style={{ color: 'rgba(255,225,225,0.95)' }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border px-4 py-3 text-sm outline-none bg-transparent text-foreground
                 placeholder:text-muted-foreground/70"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border px-4 py-3 text-sm outline-none bg-transparent text-foreground"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border px-4 py-3 text-sm outline-none bg-transparent text-foreground
                 placeholder:text-muted-foreground/70"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    />
  );
}