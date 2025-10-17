'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function Header() {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-6 min-w-0 flex-1">
          <Link href="/documents" className="text-base md:text-xl font-bold truncate">
            SOP Manual
          </Link>

          <nav className="flex gap-2 md:gap-4 text-sm md:text-base">
            <Link
              href="/documents"
              className={pathname === '/documents' ? 'text-blue-600 font-medium' : 'text-gray-600'}
            >
              Docs
            </Link>
            <Link
              href="/workspace/settings"
              className={pathname === '/workspace/settings' ? 'text-blue-600 font-medium' : 'text-gray-600'}
            >
              Settings
            </Link>
          </nav>
        </div>

        {activeWorkspace && (
          <div className="text-xs md:text-sm flex-shrink-0 ml-2">
            <span className="text-gray-500 mr-1">📁</span>
            <span className="text-gray-900 font-medium hidden sm:inline">{activeWorkspace.name}</span>
          </div>
        )}
      </div>
    </header>
  );
}
