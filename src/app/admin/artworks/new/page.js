'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createArtwork } from '@/lib/firestore';

export default function NewArtworkPage() {
  const router = useRouter();
  const { user } = useAuth();

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
    tags: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.artist || !formData.medium || 
          !formData.style || !formData.startingBid) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Prepare artwork data
      const artworkData = {
  title: formData.title.trim(),
  artist: formData.artist.trim(),
  description: formData.description.trim(),
  imageUrl: formData.imageUrl.trim() || 'https://via.placeholder.com/800x600?text=No+Image',
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
  currentBid: null,
  tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
  status: 'available',
  createdBy: user.uid,
  viewCount: 0,
};
      // Create artwork
      const artworkId = await createArtwork(artworkData);
      
      // Redirect to artworks list
      router.push('/admin/artworks');
    } catch (error) {
      console.error('Error creating artwork:', error);
      setError('Failed to create artwork. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Add New Artwork
        </h1>
        <p className="text-gray-600">
          Fill in the details below to add a new artwork to the catalog
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
              placeholder="e.g., Sunset Dreams"
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
              placeholder="e.g., Maria Santos"
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
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg or use https://picsum.photos/800/600"
            />
            <p className="text-sm text-gray-500 mt-1">
              Tip: Use <a href="https://picsum.photos/" target="_blank" className="text-purple-600 hover:underline">https://picsum.photos/800/600</a> for placeholder images
            </p>
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
              <option value="Watercolor">Watercolor</option>
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
              placeholder="100"
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
              placeholder="80"
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
              placeholder="2"
            />
          </div>
          {/* Regular Price */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Price (ZAR) - For Direct Purchase
  </label>
  <input
    type="number"
    name="price"
    value={formData.price}
    onChange={handleChange}
    min="10"
    step="10"
    autoComplete="off"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    placeholder="e.g., 500"
  />
  <p className="text-sm text-gray-500 mt-1">
    Regular price for customers to purchase directly (not via auction)
  </p>
</div>

{/* Starting Bid */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Starting Bid (ZAR) - For Auctions
  </label>
  <input
    type="number"
    name="startingBid"
    value={formData.startingBid}
    onChange={handleChange}
    min="10"
    step="10"
    autoComplete="off"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    placeholder="e.g., 400"
  />
  <p className="text-sm text-gray-500 mt-1">
    Minimum bid when this artwork is placed in an auction
  </p>
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
              placeholder="Describe the artwork, inspiration, techniques used, etc."
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
            <p className="text-sm text-gray-500 mt-1">
              Separate tags with commas (e.g., abstract, colorful, modern)
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Artwork'}
          </button>
        </div>
      </form>
    </div>
  );
}