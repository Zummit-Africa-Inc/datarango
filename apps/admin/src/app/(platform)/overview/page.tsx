"use client";

import {
  Building2,
  ClipboardCheck,
  MailWarning,
  UserCog,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { useStaffPermission } from "@datarango/auth";
import { Skeleton, Statistics } from "@datarango/ui";

import { Notice } from "@/components/people-ui";
import { useDeadLetters } from "@/hooks/notifications";
import { usePlatformOrgs } from "@/hooks/operations";
import { usePlatformUsers, useStaffAccounts } from "@/hooks/people";
import { useReviewQueue } from "@/hooks/review";

/**
 * The admin home. Each tile is its own component and is only mounted when the
 * person holds the permission for its data, so nothing is requested that would
 * come back as a 403, and nobody sees a number they aren't allowed to.
 */
export default function OverviewPage() {
  const tiles: ReactNode[] = [];
  const canUsers = useStaffPermission("users:accounts:view");
  const canOrgs = useStaffPermission("orgs:organizations:view");
  const canReview = useStaffPermission("creator:courses:view");
  const canNotifications = useStaffPermission("notifications:deliveries:view");
  const canStaff = useStaffPermission("staff:accounts:view");

  if (canUsers) tiles.push(<UsersTile key="users" />, <SuspendedUsersTile key="suspended" />);
  if (canOrgs) tiles.push(<OrgsTile key="orgs" />);
  if (canReview) tiles.push(<ReviewTile key="review" />);
  if (canNotifications) tiles.push(<FailedNotificationsTile key="dead" />);
  if (canStaff) tiles.push(<StaffTile key="staff" />);

  return tiles.length === 0 ? (
    <Notice
      title="Nothing to show yet"
      body="Your roles don't include any of the areas summarised here. Ask a Super admin if you need access."
    />
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tiles}</div>
  );
}

const Tile = ({
  href,
  label,
  value,
  icon,
  description,
  loading,
}: {
  href: string;
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  description?: string;
  loading: boolean;
}) =>
  loading ? (
    <Skeleton skeleton="widget" />
  ) : (
    <Link href={href} className="block transition-opacity hover:opacity-90">
      <Statistics
        label={label}
        value={(value ?? 0).toLocaleString()}
        icon={icon}
        description={description}
      />
    </Link>
  );

const UsersTile = () => {
  const { data, isLoading } = usePlatformUsers({ pageSize: 1 });
  return <Tile href="/users" label="Users" value={data?.total} icon={Users} loading={isLoading} />;
};

const SuspendedUsersTile = () => {
  const { data, isLoading } = usePlatformUsers({ status: "suspended", pageSize: 1 });
  return (
    <Tile
      href="/users"
      label="Suspended users"
      value={data?.total}
      icon={UserX}
      loading={isLoading}
    />
  );
};

const OrgsTile = () => {
  const { data, isLoading } = usePlatformOrgs({ pageSize: 1 });
  return (
    <Tile
      href="/organizations"
      label="Organisations"
      value={data?.total}
      icon={Building2}
      loading={isLoading}
    />
  );
};

const ReviewTile = () => {
  const { data, isLoading } = useReviewQueue({ pageSize: 100 });
  const count = data?.length ?? 0;
  return (
    <Tile
      href="/review"
      label="Courses waiting for review"
      value={count}
      icon={ClipboardCheck}
      description={count >= 100 ? "100 or more" : undefined}
      loading={isLoading}
    />
  );
};

const FailedNotificationsTile = () => {
  const { data, isLoading } = useDeadLetters({ pageSize: 1 });
  return (
    <Tile
      href="/notifications"
      label="Failed notifications"
      value={data?.total}
      icon={MailWarning}
      loading={isLoading}
    />
  );
};

const StaffTile = () => {
  const { data, isLoading } = useStaffAccounts();
  return (
    <Tile
      href="/staff"
      label="Staff"
      value={data?.filter((a) => a.status !== "deactivated").length}
      icon={UserCog}
      loading={isLoading}
    />
  );
};
