'use client';

import Link from 'next/link';

export default function ArtworkCard({ artwork }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

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
      <div className="group cursor-pointer h-full flex flex-col">
        {/* Image Section */}
        <div className="relative mb-4 overflow-hidden" style={{ aspectRatio: '4/5' }}>
          <img
            src={artwork.imageUrl || 'https://via.placeholder.com/400x500?text=No+Image'}
            alt={artwork.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Status Badge */}
          {artwork.status === 'sold' && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(46, 42, 39, 0.7)' }}>
              <span className="px-6 py-3 font-semibold" style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.875rem',
                borderRadius: '2px'
              }}>
                SOLD
              </span>
            </div>
          )}
          {artwork.status === 'in_auction' && (
            <div className="absolute top-3 left-3 px-3 py-1.5 text-xs font-semibold" style={{
              background: 'var(--surface)',
              color: 'var(--clay)',
              border: '1px solid var(--border)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderRadius: '2px'
            }}>
              IN AUCTION
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-grow flex flex-col space-y-3">
          {/* Title */}
          <h3 className="font-semibold transition-colors group-hover:opacity-70" style={{ 
            color: 'var(--text-primary)',
            fontSize: '1.125rem',
            lineHeight: '1.4'
          }}>
            {artwork.title}
          </h3>

          {/* Artist */}
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {artwork.artist}
          </p>

          {/* Details */}
          <div className="space-y-1 flex-grow">
            <div className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="opacity-70">{artwork.style}</span>
            </div>
            <div className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="opacity-70">{artwork.medium}</span>
            </div>
            {artwork.dimensions && (
              <div className="flex items-center text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="opacity-70">
                  {artwork.dimensions.width} × {artwork.dimensions.height} cm
                </span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="border-t pt-4 mt-auto" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs mb-1" style={{ 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {artwork.currentBid ? 'Current Bid' : 'Starting Bid'}
            </div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--clay)' }}>
              {formatPrice(artwork.currentBid || artwork.startingBid)}
            </div>
          </div>

          {/* Tags */}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {artwork.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2.5 py-1 border"
                  style={{
                    color: 'var(--text-muted)',
                    borderColor: 'var(--border)',
                    borderRadius: '2px'
                  }}
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