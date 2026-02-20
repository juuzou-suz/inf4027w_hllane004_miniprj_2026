'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArtworkById, updateArtwork } from '@/lib/firestore';

export default function EditArtworkPage() {
  const params = useParams();
  const router = useRouter();
  const artworkId = params.id;

  // Form state
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

  // Fetch artwork data when page loads
  useEffect(() => {
    if (artworkId) {
      fetchArtwork();
    }
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

      // Populate form with existing data
      setFormData({
  title: artwork.title || '',
  artist: artwork.artist || '',
  description: artwork.description || '',
  imageUrl: artwork.imageUrl || '',
  medium: artwork.medium || '',
  style: artwork.style || '',
  width: artwork.dimensions?.width || '',
  height: artwork.dimensions?.height || '',
  depth: artwork.dimensions?.depth || '',
  yearCreated: artwork.yearCreated || new Date().getFullYear(),
  price: artwork.price || '', // Add this
  startingBid: artwork.startingBid || '',
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.artist || !formData.medium || 
          !formData.style || !formData.price) {
        setError('Please fill in all required fields');
        setSaving(false);
        return;
      }

      // Validate image path if provided
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

      // Prepare update data
      const updateData = {
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
  price: formData.price ? parseFloat(formData.price) : null, // Add this
  startingBid: parseFloat(formData.startingBid),
  status: formData.status,
  tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
};

      // Update artwork
      await updateArtwork(artworkId, updateData);
      
      // Redirect to artworks list
      router.push('/admin/artworks');
    } catch (error) {
      console.error('Error updating artwork:', error);
      setError('Failed to update artwork. Please try again.');
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Error state (artwork not found)
  if (error && !formData.title) {
    return (
      <div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-4">
            {error}
          </h2>
          <button
            onClick={() => router.push('/admin/artworks')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            Back to Artworks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit Artwork
        </h1>
        <p className="text-gray-600">
          Update the artwork details below
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Artist */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artist Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Year Created */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year Created
            </label>
            <input
              type="number"
              name="yearCreated"
              value={formData.yearCreated}
              onChange={handleChange}
              min="1900"
              max={new Date().getFullYear()}
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Image URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="text"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="/Images/Placeholder.jpg"
            />
            {/* Image Preview */}
            {formData.imageUrl && (
              <div className="mt-4">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+Image+URL';
                  }}
                />
              </div>
            )}
          </div>

          {/* Medium */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medium <span className="text-red-500">*</span>
            </label>
            <select
              name="medium"
              value={formData.medium}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
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
            </select>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style <span className="text-red-500">*</span>
            </label>
            <select
              name="style"
              value={formData.style}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
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
            </select>
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (cm)
            </label>
            <input
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              min="0"
              step="0.1"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              min="0"
              step="0.1"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depth (cm)
            </label>
            <input
              type="number"
              name="depth"
              value={formData.depth}
              onChange={handleChange}
              min="0"
              step="0.1"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Starting Bid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Bid (ZAR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="startingBid"
              value={formData.startingBid}
              onChange={handleChange}
              required
              min="10"
              step="10"
              autoComplete="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="in_auction">In Auction</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="abstract, colorful, modern, nature"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.push('/admin/artworks')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}