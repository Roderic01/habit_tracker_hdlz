import { Dashboard } from '@/components/dashboard';

export default function Home() {
  // Mock user ID until we implement authentication
  const mockUserId = 'user-123';

  return (
    <div className="min-h-screen bg-background">
      <Dashboard userId={mockUserId} />
    </div>
  );
}
