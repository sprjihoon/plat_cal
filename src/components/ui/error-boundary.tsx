'use client';

import { Component, type ReactNode } from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-semibold mb-2">문제가 발생했습니다</h2>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            페이지를 불러오는 중 오류가 발생했습니다. 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <Button onClick={() => this.setState({ hasError: false, error: null })}>
            다시 시도
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
