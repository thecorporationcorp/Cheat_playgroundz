import React from 'react';
import { Activity } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches React errors and provides branded recovery UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] React error caught:', error, errorInfo);

    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: 'black', color: 'white', padding: 40 }}>
          <Activity size={64} color="red" />
          <h1>SYSTEM ERROR</h1>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
