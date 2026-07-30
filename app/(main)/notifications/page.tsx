import { NotificationCenter } from "@/components/kenzie/NotificationCenter";
import { FeaturePage, FeaturePageHeader, FeatureSection } from "@/components/features/FeaturePage";
import { requireCurrentHouseholdContext } from "@/lib/auth/context";
import { getMyNotifications } from "@/lib/kenzie/notifications/service";

export default async function NotificationsPage() {
  const context = await requireCurrentHouseholdContext();
  const notifications = await getMyNotifications(context);
  return (
    <FeaturePage>
      <FeaturePageHeader
        eyebrow="Your updates"
        title="Notifications"
        description="Private notes, reminders, and household updates for your signed-in family account."
      />
      <FeatureSection title="Recent notifications" description="Only notifications addressed to you appear here.">
        <NotificationCenter notifications={notifications} />
      </FeatureSection>
    </FeaturePage>
  );
}
