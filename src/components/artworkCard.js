'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ArtworkCard({ artwork }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_auction: 'bg-blue-100 text-blue-800',
      sold: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status label
  const getStatusLabel = (status) => {
    const labels = {
      available: 'Available',
      in_auction: 'In Auction',
      sold: 'Sold',
      archived: 'Archived',
    };
    return labels[status] || status;
  };

  return (
    <Link href={`/artworks/${artwork.id}`}>
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        {/* Image Section */}
        <div className="relative h-64 bg-gray-200">
          <img
            src={artwork.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={artwork.title}
            className="w-full h-full object-cover"
          />
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(artwork.status)}`}>
              {getStatusLabel(artwork.status)}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex-grow flex flex-col">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
            {artwork.title}
          </h3>

          {/* Artist */}
          <p className="text-gray-600 mb-3">
            by {artwork.artist}
          </p>

          {/* Details */}
          <div className="space-y-1 mb-4 flex-grow">
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium mr-2">Style:</span>
              <span>{artwork.style}</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium mr-2">Medium:</span>
              <span>{artwork.medium}</span>
            </div>
            {artwork.dimensions && (
              <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium mr-2">Size:</span>
                <span>
                  {artwork.dimensions.width} × {artwork.dimensions.height} cm
                </span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="border-t border-gray-200 pt-4 mt-auto">
            {artwork.currentBid ? (
              <div>
                <div className="text-sm text-gray-500 mb-1">Current Bid</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(artwork.currentBid)}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-500 mb-1">Starting Bid</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatPrice(artwork.startingBid)}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {artwork.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}