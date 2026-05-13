import { Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6 glass-panel rounded-3xl p-8 animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-error/15 ring-1 ring-error/35 flex items-center justify-center mx-auto shadow-[0_12px_32px_-8px_rgb(251_113_133_/_0.4)]">
            <AlertCircle className="text-3xl text-error" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Something went wrong</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              An unexpected error occurred. Your data is safe — this is a display issue only.
            </p>
          </div>
          {this.state.error && (
            <details className="text-left bg-surface-container-low/70 backdrop-blur rounded-xl p-4 border border-outline-variant/30">
              <summary className="text-xs uppercase tracking-widest text-on-surface-variant cursor-pointer select-none">
                Error details
              </summary>
              <pre className="mt-3 text-xs text-error overflow-auto whitespace-pre-wrap break-all">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            className="btn btn-primary btn-lg w-full"
          >
            Reload App
          </button>
        </div>
      </div>
    )
  }
}
