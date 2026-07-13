// ============================================
// Drishti Kavach — Responsive Grid System
// Cyber-noir themed responsive layout components
// ============================================

import React from 'react';

/**
 * Main grid container with cyber styling
 */
export const GridContainer = ({ children, className = '' }) => (
  <div className={`grid-container ${className}`}
       style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(12, 1fr)',
         gap: '1.5rem',
         width: '100%',
         maxWidth: '1440px',
         margin: '0 auto',
         padding: '0 1rem',
         position: 'relative',
       }}>
    {children}
  </div>
);

/**
 * Grid item with responsive column spans
 */
export const GridItem = ({ 
  children, 
  className = '', 
  xs = 12, 
  sm, 
  md, 
  lg, 
  xl,
  style = {}
}) => {
  const getColSpan = (breakpoint, value) => {
    if (!value) return '';
    return `col-span-${breakpoint}-${value}`;
  };

  const colClasses = [
    getColSpan('xs', xs),
    getColSpan('sm', sm),
    getColSpan('md', md),
    getColSpan('lg', lg),
    getColSpan('xl', xl),
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid-item cyber-card ${colClasses} ${className}`}
         style={{
           gridColumn: `span ${xs}`,
           ...style,
           position: 'relative',
           overflow: 'hidden',
           border: '1px solid rgba(0, 212, 255, 0.15)',
           background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.98) 0%, rgba(4, 12, 26, 0.95) 100%)',
           backdropFilter: 'blur(10px)',
           borderRadius: '0.5rem',
         }}>
      {children}
    </div>
  );
};

/**
 * Dashboard grid layout with cyber styling
 */
export const DashboardGrid = ({ children }) => (
  <div className="dashboard-grid"
       style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
         gap: '1.5rem',
         padding: '1.5rem',
         background: 'radial-gradient(ellipse at 50% 0%, #040c1a 0%, #020408 60%)',
         minHeight: 'calc(100vh - 80px)',
         position: 'relative',
       }}>
    {/* Scanline overlay */}
    <div className="absolute inset-0 pointer-events-none"
         style={{
           background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.01) 2px, rgba(0,212,255,0.01) 4px)',
           opacity: 0.3,
         }}/>
    {children}
  </div>
);

/**
 * Card grid for statistics and metrics
 */
export const CardGrid = ({ children }) => (
  <div className="card-grid"
       style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
         gap: '1.5rem',
         marginBottom: '2rem',
       }}>
    {children}
  </div>
);

/**
 * Two-column layout for forms and details
 */
export const TwoColumnLayout = ({ left, right, className = '' }) => (
  <div className={`two-column-layout ${className}`}
       style={{
         display: 'grid',
         gridTemplateColumns: '1fr 1fr',
         gap: '2rem',
         alignItems: 'start',
       }}>
    <div className="left-column" style={{ width: '100%' }}>
      {left}
    </div>
    <div className="right-column" style={{ width: '100%' }}>
      {right}
    </div>
  </div>
);

/**
 * Three-column layout for dashboard overview
 */
export const ThreeColumnLayout = ({ left, center, right, className = '' }) => (
  <div className={`three-column-layout ${className}`}
       style={{
         display: 'grid',
         gridTemplateColumns: '1fr 2fr 1fr',
         gap: '1.5rem',
         alignItems: 'start',
       }}>
    <div className="left-column" style={{ width: '100%' }}>
      {left}
    </div>
    <div className="center-column" style={{ width: '100%' }}>
      {center}
    </div>
    <div className="right-column" style={{ width: '100%' }}>
      {right}
    </div>
  </div>
);

/**
 * Responsive sidebar layout
 */
export const SidebarLayout = ({ sidebar, content, sidebarWidth = '280px', className = '' }) => (
  <div className={`sidebar-layout ${className}`}
       style={{
         display: 'grid',
         gridTemplateColumns: `${sidebarWidth} 1fr`,
         gap: '2rem',
         minHeight: 'calc(100vh - 80px)',
       }}>
    <div className="sidebar" style={{ width: '100%' }}>
      {sidebar}
    </div>
    <div className="content" style={{ width: '100%' }}>
      {content}
    </div>
  </div>
);

/**
 * Media queries for responsive design
 */
export const MediaQueries = () => (
  <style>
    {`
      /* Mobile (0-640px) */
      @media (max-width: 640px) {
        .grid-container {
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding: 0 0.75rem;
        }
        
        .dashboard-grid {
          grid-template-columns: 1fr;
          padding: 1rem;
          gap: 1rem;
        }
        
        .card-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .two-column-layout,
        .three-column-layout {
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        
        .sidebar-layout {
          grid-template-columns: 1fr;
        }
        
        .sidebar {
          display: none; /* Hide sidebar on mobile */
        }
      }
      
      /* Tablet (641px-1024px) */
      @media (min-width: 641px) and (max-width: 1024px) {
        .grid-container {
          grid-template-columns: repeat(8, 1fr);
          gap: 1.25rem;
          padding: 0 1rem;
        }
        
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        
        .card-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        
        .two-column-layout {
          grid-template-columns: 1fr 1fr;
        }
        
        .three-column-layout {
          grid-template-columns: 1fr;
        }
        
        .sidebar-layout {
          grid-template-columns: 200px 1fr;
        }
      }
      
      /* Desktop (1025px-1440px) */
      @media (min-width: 1025px) and (max-width: 1440px) {
        .grid-container {
          grid-template-columns: repeat(12, 1fr);
          gap: 1.5rem;
          padding: 0 1.5rem;
        }
        
        .dashboard-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        
        .card-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
      }
      
      /* Large Desktop (1441px+) */
      @media (min-width: 1441px) {
        .grid-container {
          gap: 2rem;
          padding: 0 2rem;
        }
        
        .dashboard-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        
        .card-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
      }
      
      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .grid-item {
          border-color: rgba(0, 212, 255, 0.2);
          background: linear-gradient(135deg, rgba(2, 4, 8, 0.98) 0%, rgba(4, 8, 16, 0.95) 100%);
        }
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .grid-item {
          transition: none !important;
          animation: none !important;
        }
      }
      
      /* High contrast mode */
      @media (prefers-contrast: high) {
        .grid-item {
          border-color: #00d4ff;
          background: #020408;
        }
      }
      
      /* Print styles */
      @media print {
        .grid-container {
          grid-template-columns: 1fr !important;
          gap: 0.5rem !important;
        }
        
        .grid-item {
          break-inside: avoid;
          border: 1px solid #000 !important;
          background: #fff !important;
          color: #000 !important;
        }
      }
    `}
  </style>
);

/**
 * Grid helper for column spans
 */
export const Col = ({ span = 1, children, className = '' }) => (
  <div className={`col-span-${span} ${className}`}
       style={{
         gridColumn: `span ${span}`,
       }}>
    {children}
  </div>
);

/**
 * Row helper for vertical spacing
 */
export const Row = ({ children, gap = '1rem', className = '' }) => (
  <div className={`row ${className}`}
       style={{
         display: 'flex',
         flexDirection: 'column',
         gap: gap,
       }}>
    {children}
  </div>
);

/**
 * Fluid container that adapts to screen size
 */
export const FluidContainer = ({ children, maxWidth = '1440px', className = '' }) => (
  <div className={`fluid-container ${className}`}
       style={{
         width: '100%',
         maxWidth: maxWidth,
         margin: '0 auto',
         padding: '0 clamp(1rem, 5vw, 3rem)',
         transition: 'padding 0.3s ease',
       }}>
    {children}
  </div>
);

export default {
  GridContainer,
  GridItem,
  DashboardGrid,
  CardGrid,
  TwoColumnLayout,
  ThreeColumnLayout,
  SidebarLayout,
  MediaQueries,
  Col,
  Row,
  FluidContainer,
};