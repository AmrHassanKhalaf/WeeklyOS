import { Component, type ReactNode } from 'react'

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
      <div className="min-h-screen bg-[#131313] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl text-error">error</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-on-surface">Something went wrong</h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              An unexpected error occurred. Your data is safe — this is a display issue only.
            </p>
          </div>
          {this.state.error && (
            <details className="text-left bg-surface-container-low rounded-lg p-4 border border-white/5">
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
            className="w-full bg-primary text-background font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Reload App
          </button>
        </div>
      </div>
    )
  }
}
