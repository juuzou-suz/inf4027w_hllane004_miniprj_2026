'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createArtwork } from '@/lib/firestore';

export default function NewArtworkPage() {
  const router = useRouter();
  const { user } = useAuth();

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
    tags: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Build text that represents this artwork (used for embedding)
  const buildEmbeddingText = (data) => {
    const tags = (data.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return [
      data.title,
      `by ${data.artist}`,
      data.style ? `${data.style} style` : '',
      data.medium ? `${data.medium} medium` : '',
      data.description || '',
      tags.length ? `tags: ${tags.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('. ');
  };

  // Get embedding vector from your server route (keeps HF key secret)
  const getEmbedding = async (text) => {
    const res = await fetch('/api/hf/embed-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      // Important: HF errors might be text (not JSON), so read as text too
      const errText = await res.text().catch(() => '');
      let parsed = {};
      try {
        parsed = JSON.parse(errText);
      } catch {}
      throw new Error(parsed?.error || errText || 'Failed to generate embedding');
    }

    const data = await res.json();
    return data.embedding;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setLoading(true);

    try {
      if (!formData.title || !formData.artist || !formData.medium || !formData.style || !formData.price) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate local image path format
      if (formData.imageUrl) {
        const trimmed = formData.imageUrl.trim();

        if (!trimmed.startsWith('/Images/')) {
          setError('Image path must start with /Images/');
          setLoading(false);
          return;
        }

        if (!/\.(jpg|jpeg|png|webp)$/i.test(trimmed)) {
          setError('Image must be .jpg, .jpeg, .png or .webp');
          setLoading(false);
          return;
        }
      }

      // Create embedding (don’t block save if it fails)
      const embeddingText = buildEmbeddingText(formData);
      let textEmbedding = null;

      try {
        textEmbedding = await getEmbedding(embeddingText);
      } catch (embedErr) {
        console.warn('Embedding failed; saving artwork without embedding:', embedErr);
        textEmbedding = null;
      }

      const artworkData = {
        title: formData.title.trim(),
        artist: formData.artist.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || '/Images/Placeholder.png',
        medium: formData.medium.trim(),
        style: formData.style.trim(),
        dimensions: {
          width: parseFloat(formData.width) || 0,
          height: parseFloat(formData.height) || 0,
          depth: parseFloat(formData.depth) || 0,
        },
        yearCreated: parseInt(formData.yearCreated) || new Date().getFullYear(),
        price: formData.price ? parseFloat(formData.price) : null,
        startingBid: formData.startingBid ? parseFloat(formData.startingBid) : null,
        currentBid: null,
        tags: (formData.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),

        status: 'available',
        createdBy: user?.uid || null,
        viewCount: 0,

        // ✅ Hugging Face embedding fields
        embeddingText,
        textEmbedding,
        embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
      };

      await createArtwork(artworkData);
      router.push('/admin/artworks');
    } catch (err) {
      console.error('Error creating artwork:', err);
      setError(err?.message || 'Failed to create artwork. Please try again.');
      setLoading(false);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display mb-2 text-3xl font-black">Add artwork</h1>
        <p className="text-muted-foreground">Create a new listing for the catalog.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(190,58,38,0.14)] px-4 py-3 text-sm text-[rgba(255,225,225,0.95)]">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field className="md:col-span-2" label="Title" required>
            <Input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Sunset Dreams" required />
          </Field>

          <Field label="Artist name" required>
            <Input name="artist" value={formData.artist} onChange={handleChange} placeholder="e.g., Maria Santos" required />
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
            <Input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="/Images/ArtworkName.jpg" />
            <p className="mt-1 text-xs text-muted-foreground">Use a local path like /Images/ArtworkName.jpg, .png, or .webp</p>
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
            <Input type="number" name="width" value={formData.width} onChange={handleChange} min="0" step="0.1" autoComplete="off" placeholder="100" />
          </Field>

          <Field label="Height (cm)">
            <Input type="number" name="height" value={formData.height} onChange={handleChange} min="0" step="0.1" autoComplete="off" placeholder="80" />
          </Field>

          <Field label="Depth (cm)">
            <Input type="number" name="depth" value={formData.depth} onChange={handleChange} min="0" step="0.1" autoComplete="off" placeholder="2" />
          </Field>

          <Field label="Price (ZAR) — direct purchase" required>
            <Input type="number" name="price" value={formData.price} onChange={handleChange} min="10" step="10" autoComplete="off" placeholder="e.g., 500" />
            <p className="mt-1 text-xs text-muted-foreground">Regular price for customers to purchase directly.</p>
          </Field>

          <Field label="Starting bid (ZAR) — auctions">
            <Input type="number" name="startingBid" value={formData.startingBid} onChange={handleChange} min="10" step="10" autoComplete="off" placeholder="e.g., 400" />
            <p className="mt-1 text-xs text-muted-foreground">Minimum bid when this artwork is placed in an auction.</p>
          </Field>

          <Field className="md:col-span-2" label="Description">
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the artwork, inspiration, techniques used, etc."
            />
          </Field>

          <Field className="md:col-span-2" label="Tags (comma-separated)">
            <Input name="tags" value={formData.tags} onChange={handleChange} placeholder="abstract, colourful, modern" />
            <p className="mt-1 text-xs text-muted-foreground">Separate tags with commas.</p>
          </Field>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full border px-6 py-3 text-sm font-semibold transition hover:opacity-90"
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
            disabled={loading}
            className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating…' : 'Create artwork'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function Field({ label, required, className = '', children }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
      className={[
        'w-full rounded-xl border px-4 py-3 text-sm outline-none',
        'bg-transparent text-foreground placeholder:text-muted-foreground/70',
      ].join(' ')}
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    />
  );
}

function Select(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-foreground outline-none"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
      style={{ borderColor: 'rgba(255,255,255,0.10)' }}
    />
  );
}