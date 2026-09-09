import { AppLayout } from '../../components/layout/AppLayout';
import { SupportContent } from '../../components/support/SupportContent';

export function CompanySupportPage() {
  return (
    <AppLayout
      role="company"
      title="Help & Support"
      subtitle="24/7 AI guidance, priority ticketing, and platform operations assistance"
    >
      <SupportContent role="company" />
    </AppLayout>
  );
}
