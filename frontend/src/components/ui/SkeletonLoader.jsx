// ============================================
// Drishti Kavach — Skeleton Loader Components
// Cyber-noir themed loading skeletons
// ============================================

import React from 'react';

/**
 * Basic skeleton with cyber-noir styling
 */
export const Skeleton = ({ width = '100%', height = '1rem', className = '' }) => (
  <div 
    className={`skeleton ${className}`}
    style={{
      width,
      height,
      background: 'linear-gradient(90deg, rgba(2, 4, 8, 0.5) 25%, rgba(4, 12, 26, 0.8) 50%, rgba(2, 4, 8, 0.5) 75%)',
      backgroundSize: '200% 100%',
      borderRadius: '0.25rem',
      animation: 'skeleton-shimmer 1.5s infinite',
      position: 'relative',
      overflow: 'hidden',
    }}
  />
);

/**
 * Card skeleton for dashboard cards
 */
export const CardSkeleton = ({ count = 1 }) => (
  <>
    {Array(count).fill(0).map((_, index) => (
      <div 
        key={index}
        style={{
          background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.5) 0%, rgba(4, 12, 26, 0.5) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Skeleton width="120px" height="1.5rem" />
          <Skeleton width="60px" height="1.5rem" />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Skeleton width="80%" height="1rem" />
          <div style={{ marginTop: '0.5rem' }}>
            <Skeleton width="60%" height="1rem" />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Skeleton width="100px" height="2rem" />
          <Skeleton width="80px" height="2rem" />
        </div>
      </div>
    ))}
  </>
);

/**
 * Table skeleton for data tables
 */
export const TableSkeleton = ({ rows = 5, columns = 6 }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.5) 0%, rgba(4, 12, 26, 0.5) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    overflow: 'hidden',
  }}>
    {/* Table header */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '1rem',
      marginBottom: '1rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
    }}>
      {Array(columns).fill(0).map((_, index) => (
        <Skeleton key={`header-${index}`} height="0.875rem" />
      ))}
    </div>
    
    {/* Table rows */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {Array(rows).fill(0).map((_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '1rem',
            padding: '0.75rem 0',
            borderBottom: rowIndex < rows - 1 ? '1px solid rgba(0, 212, 255, 0.05)' : 'none',
          }}
        >
          {Array(columns).fill(0).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Form skeleton for input forms
 */
export const FormSkeleton = ({ fields = 3 }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.5) 0%, rgba(4, 12, 26, 0.5) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    maxWidth: '500px',
    margin: '0 auto',
  }}>
    <div style={{ marginBottom: '1.5rem' }}>
      <Skeleton width="180px" height="1.75rem" />
      <div style={{ marginTop: '0.5rem' }}>
        <Skeleton width="220px" height="1rem" />
      </div>
    </div>
    
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Array(fields).fill(0).map((_, index) => (
        <div key={index}>
          <Skeleton width="100px" height="0.875rem" style={{ marginBottom: '0.5rem' }} />
          <Skeleton width="100%" height="2.5rem" />
        </div>
      ))}
      
      <div style={{ marginTop: '1rem' }}>
        <Skeleton width="100%" height="2.5rem" />
      </div>
    </div>
  </div>
);

/**
 * Dashboard grid skeleton
 */
export const DashboardGridSkeleton = ({ cards = 6 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    padding: '1.5rem',
  }}>
    <CardSkeleton count={cards} />
  </div>
);

/**
 * Page header skeleton
 */
export const PageHeaderSkeleton = () => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.5) 0%, rgba(4, 12, 26, 0.5) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <Skeleton width="200px" height="2rem" />
        <div style={{ marginTop: '0.5rem' }}>
          <Skeleton width="280px" height="1rem" />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Skeleton width="120px" height="2rem" />
        <Skeleton width="40px" height="40px" style={{ borderRadius: '50%' }} />
      </div>
    </div>
  </div>
);

/**
 * Chart skeleton for data visualizations
 */
export const ChartSkeleton = ({ height = '300px' }) => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.5) 0%, rgba(4, 12, 26, 0.5) 100%)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.1)',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    height,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0,
      display: 'flex',
      alignItems: 'flex-end',
      padding: '1rem',
      gap: '0.5rem',
    }}>
      {Array(12).fill(0).map((_, index) => (
        <div 
          key={index}
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.3) 100%)',
            borderRadius: '0.25rem 0.25rem 0 0',
            animation: 'chart-pulse 2s infinite',
            animationDelay: `${index * 0.1}s`,
          }}
        />
      ))}
    </div>
    
    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {Array(6).fill(0).map((_, index) => (
          <Skeleton key={`label-${index}`} width="40px" height="0.75rem" />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton wrapper for component-level loading
 */
export const SkeletonWrapper = ({ children, isLoading, skeleton, fallback = null }) => {
  if (isLoading) {
    return skeleton || <DashboardGridSkeleton />;
  }
  
  return children || fallback;
};

/**
 * Suspense fallback skeleton
 */
export const SuspenseFallback = () => (
  <div style={{
    minHeight: 'calc(100vh - 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, #040c1a 0%, #020408 60%)',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '120px',
        height: '120px',
        margin: '0 auto 2rem',
        position: 'relative',
      }}>
        {/* Cyber-noir loading spinner */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '2px solid transparent',
          borderTop: '2px solid #00d4ff',
          borderRight: '2px solid #00d4ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}/>
        
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          bottom: '20px',
          border: '2px solid transparent',
          borderBottom: '2px solid #f5b041',
          borderLeft: '2px solid #f5b041',
          borderRadius: '50%',
          animation: 'spin 0.75s linear infinite reverse',
        }}/>
        
        <div style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          right: '40px',
          bottom: '40px',
          border: '2px solid transparent',
          borderTop: '2px solid #00ff88',
          borderLeft: '2px solid #00ff88',
          borderRadius: '50%',
          animation: 'spin 0.5s linear infinite',
        }}/>
      </div>
      
      <div style={{
        fontSize: '1rem',
        color: '#00d4ff',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.1em',
        marginBottom: '0.5rem',
      }}>
        DRISHTI KAVACH
      </div>
      
      <div style={{
        fontSize: '0.75rem',
        color: '#7a8290',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.2em',
      }}>
        NEURAL SHIELD INITIALIZING...
      </div>
    </div>
  </div>
);

// Animation styles
const animationStyles = `
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes chart-pulse {
    0%, 100% {
      opacity: 0.3;
      height: 30%;
    }
    50% {
      opacity: 0.7;
      height: 80%;
    }
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .skeleton {
      animation: none !important;
    }
    
    @keyframes skeleton-shimmer {
      0%, 100% {
        opacity: 0.5;
      }
      50% {
        opacity: 0.8;
      }
    }
  }
`;

export default {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  FormSkeleton,
  DashboardGridSkeleton,
  PageHeaderSkeleton,
  ChartSkeleton,
  SkeletonWrapper,
  SuspenseFallback,
  animationStyles,
};