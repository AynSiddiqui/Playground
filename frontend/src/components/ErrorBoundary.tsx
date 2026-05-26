import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.heading}>⚠️ Visualization Error</h2>
            <p style={styles.text}>
              The visualizer encountered an unexpected error while rendering the state.
              This typically happens if the backend sends malformed snapshot data.
            </p>
            <div style={styles.errorBox}>
              <code>{this.state.error?.toString() || 'Unknown Error'}</code>
            </div>
            <button style={styles.button} onClick={this.handleReset}>
              Reset Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--bg-secondary)',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'var(--bg-primary)',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    maxWidth: '500px',
    textAlign: 'center' as const,
    border: '1px solid var(--border-color)',
  },
  heading: {
    margin: '0 0 1rem 0',
    color: 'var(--error-color)',
  },
  text: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--error-color)',
    padding: '1rem',
    borderRadius: '4px',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
    wordBreak: 'break-all' as const,
    textAlign: 'left' as const,
  },
  button: {
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};
