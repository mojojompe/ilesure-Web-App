import React from 'react';
import { ErrorPage } from '../pages/ErrorPage';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * BUGFIX (QA-CO-013): the app had no error boundary anywhere, and `ErrorPage`
 * existed but was imported by nothing.
 *
 * The consequence was that a single bad screen took the whole application down:
 * `/company/archived` threw on an undefined price, React unmounted the entire tree,
 * and every subsequent in-app navigation rendered a blank white page until a full
 * browser reload. One render error should cost the user that screen, not the session.
 *
 * `reset` clears the error and re-renders, which is enough to recover when the user
 * navigates elsewhere; the underlying data problem is fixed separately at the source.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <ErrorPage error={this.state.error} reset={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
