// ============================================
// Drishti Kavach — Error Page Components
// Cyber-noir themed error pages
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { FluidContainer } from '../layout/ResponsiveGrid';

/**
 * Base error page with cyber-noir styling
 */
const BaseErrorPage = ({ code, title, message, children, showBackButton = true }) => {
  const cyberButtonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.25rem',
    border: '1px solid #00d4ff',
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
    color: '#00d4ff',
    fontFamily: "'Orbitron', monospace",
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.025em',
    textDecoration: 'none',
    display: 'inline-block',
  };

  const cyberCardStyle = {
    background: 'linear-gradient(135deg, rgba(4, 8, 16, 0.98) 0%, rgba(4, 12, 26, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    borderRadius: '0.5rem',
    padding: '3rem',
    position: 'relative',
    overflow: 'hidden',
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  };

  return (
    <FluidContainer maxWidth="1440px">
      <div style={{
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={cyberCardStyle}>
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.02) 2px, rgba(0,212,255,0.02) 4px)',
            pointerEvents: 'none',
          }}/>
          
          {/* Hex corner decorations */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            width: '2rem',
            height: '2rem',
            borderTop: '2px solid #00d4ff',
            borderLeft: '2px solid #00d4ff',
            borderTopLeftRadius: '0.5rem',
          }}/>
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '2rem',
            height: '2rem',
            borderTop: '2px solid #00d4ff',
            borderRight: '2px solid #00d4ff',
            borderTopRightRadius: '0.5rem',
          }}/>
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            width: '2rem',
            height: '2rem',
            borderBottom: '2px solid #00d4ff',
            borderLeft: '2px solid #00d4ff',
            borderBottomLeftRadius: '0.5rem',
          }}/>
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            width: '2rem',
            height: '2rem',
            borderBottom: '2px solid #00d4ff',
            borderRight: '2px solid #00d4ff',
            borderBottomRightRadius: '0.5rem',
          }}/>
          
          {/* Error code */}
          <div style={{
            fontSize: '6rem',
            fontWeight: 'bold',
            color: '#00d4ff',
            fontFamily: "'Orbitron', monospace",
            letterSpacing: '0.2em',
            marginBottom: '1rem',
            textShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
            lineHeight: 1,
          }}>
            {code}
          </div>
          
          {/* Error title */}
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: "'Orbitron', monospace",
            letterSpacing: '0.1em',
            marginBottom: '1rem',
          }}>
            {title}
          </h1>
          
          {/* Error message */}
          <p style={{
            fontSize: '1rem',
            color: '#cccccc',
            marginBottom: '2rem',
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {message}
          </p>
          
          {/* Additional content */}
          {children && (
            <div style={{ marginBottom: '2rem' }}>
              {children}
            </div>
          )}
          
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {showBackButton && (
              <Link 
                to="/" 
                style={cyberButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 212, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← RETURN TO DASHBOARD
              </Link>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                ...cyberButtonStyle,
                borderColor: '#f5b041',
                background: 'linear-gradient(135deg, rgba(245, 176, 65, 0.1) 0%, rgba(245, 176, 65, 0.05) 100%)',
                color: '#f5b041',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(245, 176, 65, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🔄 REFRESH PAGE
            </button>
          </div>
          
          {/* Footer note */}
          <div style={{
            marginTop: '2rem',
            fontSize: '0.75rem',
            color: '#5a6270',
            fontFamily: "'Orbitron', monospace",
            letterSpacing: '0.1em',
          }}>
            दृष्टिः रक्षति, रक्षा दृश्यते
          </div>
        </div>
      </div>
    </FluidContainer>
  );
};

/**
 * 404 - Page Not Found
 */
export const NotFoundPage = () => (
  <BaseErrorPage
    code="404"
    title="PAGE NOT FOUND"
    message="The requested resource could not be located. This may be due to a broken link, removed content, or incorrect URL."
  >
    <div style={{
      padding: '1rem',
      background: 'rgba(2, 4, 8, 0.5)',
      border: '1px solid rgba(0, 212, 255, 0.1)',
      borderRadius: '0.25rem',
      marginBottom: '1rem',
    }}>
      <div style={{
        fontSize: '0.75rem',
        color: '#7a8290',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.05em',
        marginBottom: '0.25rem',
      }}>
        CURRENT PATH
      </div>
      <div style={{
        fontSize: '0.875rem',
        color: '#cccccc',
        fontFamily: "'JetBrains Mono', monospace",
        wordBreak: 'break-all',
      }}>
        {window.location.pathname}
      </div>
    </div>
  </BaseErrorPage>
);

/**
 * 500 - Internal Server Error
 */
export const ServerErrorPage = ({ error = null }) => (
  <BaseErrorPage
    code="500"
    title="INTERNAL SERVER ERROR"
    message="An unexpected error occurred while processing your request. Our systems have been notified and are investigating."
  >
    {error && (
      <div style={{
        padding: '1rem',
        background: 'rgba(2, 4, 8, 0.5)',
        border: '1px solid rgba(255, 61, 61, 0.2)',
        borderRadius: '0.25rem',
        marginBottom: '1rem',
        textAlign: 'left',
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#ff3d3d',
          fontFamily: "'Orbitron', monospace",
          letterSpacing: '0.05em',
          marginBottom: '0.5rem',
        }}>
          ERROR DETAILS
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#cccccc',
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {error.message || error.toString()}
        </div>
      </div>
    )}
  </BaseErrorPage>
);

/**
 * 403 - Forbidden/Access Denied
 */
export const ForbiddenPage = () => (
  <BaseErrorPage
    code="403"
    title="ACCESS DENIED"
    message="You do not have sufficient permissions to access this resource. Please contact your administrator if you believe this is an error."
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1rem',
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: '#ff3d3d',
        boxShadow: '0 0 12px #ff3d3d',
        animation: 'pulse-critical 1s infinite',
      }}/>
      <span style={{
        fontSize: '0.875rem',
        color: '#ff3d3d',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.05em',
      }}>
        PERMISSION VIOLATION DETECTED
      </span>
    </div>
  </BaseErrorPage>
);

/**
 * 401 - Unauthorized
 */
export const UnauthorizedPage = () => (
  <BaseErrorPage
    code="401"
    title="UNAUTHORIZED ACCESS"
    message="Authentication is required to access this resource. Please log in with valid credentials."
    showBackButton={false}
  >
    <div style={{ marginBottom: '1.5rem' }}>
      <Link 
        to="/login"
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '0.25rem',
          border: '1px solid #00ff88',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)',
          color: '#00ff88',
          fontFamily: "'Orbitron', monospace",
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          letterSpacing: '0.025em',
          textDecoration: 'none',
          display: 'inline-block',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 136, 0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        🔐 LOGIN TO CONTINUE
      </Link>
    </div>
  </BaseErrorPage>
);

/**
 * 503 - Service Unavailable
 */
export const ServiceUnavailablePage = () => (
  <BaseErrorPage
    code="503"
    title="SERVICE UNAVAILABLE"
    message="Our services are temporarily unavailable due to maintenance or high load. Please try again in a few minutes."
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1rem',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#f5b041',
        boxShadow: '0 0 12px #f5b041',
        animation: 'pulse-medium 1.5s infinite',
      }}/>
      <span style={{
        fontSize: '0.875rem',
        color: '#f5b041',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.05em',
      }}>
        SYSTEM MAINTENANCE IN PROGRESS
      </span>
    </div>
    
    <div style={{
      padding: '1rem',
      background: 'rgba(245, 176, 65, 0.05)',
      border: '1px solid rgba(245, 176, 65, 0.2)',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      color: '#cccccc',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      Estimated restoration time: 30 minutes
    </div>
  </BaseErrorPage>
);

/**
 * Connection Error Page
 */
export const ConnectionErrorPage = () => (
  <BaseErrorPage
    code="⚡"
    title="CONNECTION ERROR"
    message="Unable to establish a connection to the server. Please check your internet connection and try again."
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '1rem',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#00d4ff',
        boxShadow: '0 0 12px #00d4ff',
        animation: 'pulse-low 2s infinite',
      }}/>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#7a8290',
      }}/>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#7a8290',
      }}/>
      <span style={{
        fontSize: '0.875rem',
        color: '#7a8290',
        fontFamily: "'Orbitron', monospace",
        letterSpacing: '0.05em',
      }}>
        CONNECTION: 1/3 ACTIVE
      </span>
    </div>
  </BaseErrorPage>
);

/**
 * Custom error boundary component
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Animation styles
const errorAnimationStyles = `
  @keyframes pulse-critical {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
  
  @keyframes pulse-medium {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
  
  @keyframes pulse-low {
    0%, 100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    div {
      animation: none !important;
    }
  }
`;

export default {
  NotFoundPage,
  ServerErrorPage,
  ForbiddenPage,
  UnauthorizedPage,
  ServiceUnavailablePage,
  ConnectionErrorPage,
  ErrorBoundary,
  BaseErrorPage,
  errorAnimationStyles,
};