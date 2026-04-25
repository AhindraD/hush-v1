import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children:  React.ReactNode;
  accountId: string;
}

/**
 * Main application shell — sidebar + topbar + scrollable content area.
 * Not a 'use client' component; let child pages own that boundary.
 */
export function AppLayout({ children, accountId }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[--bg-base]">
      {/* Left sidebar */}
      <Sidebar accountId={accountId} />

      {/* Right: topbar + content */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar accountId={accountId} />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
