import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          color: '#1e293b',
          backgroundColor: '#f8fafc',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#e11d48' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#64748b', maxWidth: '500px', marginBottom: '2rem' }}>
            An unexpected error occurred while loading this view. Please try reloading the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ff5e14',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
