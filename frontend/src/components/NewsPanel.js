import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Newspaper, ExternalLink, ChevronDown } from 'lucide-react';

const NewsPanel = ({ news, loading }) => {
  const [displayCount, setDisplayCount] = useState(15);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollRef = useRef(null);
  const loadMoreRef = useRef(null);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(news.map(item => item.category).filter(Boolean))];

  // Filter news by category
  const filteredNews = selectedCategory === 'all' 
    ? news 
    : news.filter(item => item.category === selectedCategory);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Load more when user scrolls near bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (displayCount < filteredNews.length) {
        setDisplayCount(prev => Math.min(prev + 10, filteredNews.length));
      }
    }
  }, [displayCount, filteredNews.length]);

  // Add scroll event listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Reset display count when category changes
  useEffect(() => {
    setDisplayCount(15);
  }, [selectedCategory]);

  const displayedNews = filteredNews.slice(0, displayCount);
  const hasMore = displayCount < filteredNews.length;

  return (
    <div className="panel" data-testid="news-panel" style={{ minHeight: '400px' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Newspaper size={16} />
          Latest News
        </div>
        <span className="panel-badge">{filteredNews.length} items</span>
      </div>
      
      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        overflowX: 'auto',
        flexWrap: 'nowrap'
      }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            data-testid={`category-${cat}`}
            style={{
              padding: '0.25rem 0.75rem',
              fontSize: '0.625rem',
              textTransform: 'uppercase',
              background: selectedCategory === cat ? 'var(--color-primary)' : 'transparent',
              color: selectedCategory === cat ? '#000' : 'var(--color-muted)',
              border: `1px solid ${selectedCategory === cat ? 'var(--color-primary)' : 'var(--color-border)'}`,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div 
        className="panel-content" 
        ref={scrollRef}
        style={{ 
          maxHeight: '500px', 
          overflowY: 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="loading">No news available</div>
        ) : (
          <>
            {displayedNews.map((item, index) => (
              <div key={index} className="news-item" data-testid={`news-item-${index}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="news-source">{item.source}</div>
                  <span style={{ 
                    fontSize: '0.5rem', 
                    padding: '0.125rem 0.375rem',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: 'var(--color-primary)',
                    textTransform: 'uppercase'
                  }}>
                    {item.category}
                  </span>
                </div>
                <div className="news-title">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                    <ExternalLink size={10} style={{ marginLeft: '0.25rem', opacity: 0.5 }} />
                  </a>
                </div>
                <div className="news-time">{formatTime(item.published)}</div>
              </div>
            ))}
            
            {/* Load More Indicator */}
            {hasMore && (
              <div 
                ref={loadMoreRef}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: 'var(--color-muted)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ChevronDown size={14} />
                Scroll for more ({filteredNews.length - displayCount} remaining)
              </div>
            )}
            
            {!hasMore && filteredNews.length > 0 && (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: 'var(--color-muted)',
                fontSize: '0.625rem',
                textTransform: 'uppercase'
              }}>
                End of news feed
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsPanel;
