import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Mobile viewport height fix — sets --app-height to the ACTUAL visible height.
// This is the battle-tested fix for iOS Safari where 100vh includes the URL bar.
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
// Also fire on orientation change (some iOS versions need this)
window.addEventListener('orientationchange', () => {
  setTimeout(setAppHeight, 100);
});

// Error boundary to catch and display runtime crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#ff6b9d', background: '#0d0015', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h1>SUPERNOVA crashed</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#ccc' }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: 12 }}>{this.state.error.stack}</pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: 20, padding: '10px 20px', background: '#ff6b9d', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            Clear data &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
