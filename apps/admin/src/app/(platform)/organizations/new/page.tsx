"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStaffPermission } from "@datarango/auth";
import {
  Button,
  Input,
  PageLayout,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  toast,
} from "@datarango/ui";

import { Field, FormActions, FormSection } from "@/components/form";
import { OrgProfileFields } from "@/components/org-form";
import { Notice } from "@/components/people-ui";
import {
  EMPTY_PROFILE,
  formatMoney,
  useBillingPlans,
  useCreateOrg,
  useSubscribeOrg,
  type OrgProfile,
} from "@/hooks/operations";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sets up an organisation for an existing user, who becomes its owner, and,
 * for staff who can also bill, starts its subscription in the same step.
 * Staff can't create user accounts, so the owner must have signed up.
 */
export default function NewOrganizationPage() {
  const canCreate = useStaffPermission("orgs:organizations:create");
  const canBill = useStaffPermission("billing:organization:manage");

  return (
    <PageLayout title="New organisation" subtitle="Set up an organisation for an existing user.">
      <Link
        href="/organizations"
        className="text-muted-foreground hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> All organisations
      </Link>
      {canCreate ? (
        <NewOrgForm canBill={canBill} />
      ) : (
        <Notice
          title="You can't create organisations"
          body="This needs the orgs:organizations:create permission."
        />
      )}
    </PageLayout>
  );
}

const NewOrgForm = ({ canBill }: { canBill: boolean }) => {
  const router = useRouter();
  const create = useCreateOrg();
  const subscribe = useSubscribeOrg({ silent: true });
  const { data: planData } = useBillingPlans(canBill);

  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [profile, setProfile] = useState<OrgProfile>(EMPTY_PROFILE);
  const [allowPlatformCourses, setAllowPlatformCourses] = useState(true);

  const [billNow, setBillNow] = useState(canBill);
  const [planCode, setPlanCode] = useState("");
  const [seats, setSeats] = useState("10");

  const plans = (planData?.plans ?? []).filter((p) => p.audience === "business");
  const plan = plans.find((p) => p.code === planCode);
  const seatCount = Number.parseInt(seats, 10);
  const billing = canBill && billNow;

  const valid =
    name.trim().length >= 2 &&
    EMAIL.test(ownerEmail.trim()) &&
    (!billing || (!!plan && seatCount > 0));
  const busy = create.isPending || subscribe.isPending;

  const submit = async () => {
    const org = await create.mutateAsync({
      name: name.trim(),
      ownerEmail: ownerEmail.trim(),
      profile,
      allowPlatformCourses,
    });

    if (!billing || !plan) {
      toast.success(`${org.name} created`);
      router.push(`/organizations/${org.id}`);
      return;
    }

    try {
      await subscribe.mutateAsync({ orgId: org.id, planCode: plan.code, seats: seatCount });
      toast.success(`${org.name} created and subscribed to ${plan.name}`);
      router.push(`/organizations/${org.id}`);
    } catch {
      // The org exists; only the subscription failed (its error was shown).
      // Billing is where it can be retried.
      toast.info(`${org.name} was created. Start its subscription from Billing.`);
      router.push(`/billing/${org.id}`);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit().catch(() => undefined);
      }}
    >
      <FormSection title="Organisation and owner">
        <Field label="Organisation name" htmlFor="org-name">
          <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field
          label="Owner's email"
          htmlFor="org-owner"
          hint="Must be an existing Datarango account. Staff can't create user accounts, so ask them to sign up first."
        >
          <Input
            id="org-owner"
            type="email"
            autoComplete="off"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
        </Field>
      </FormSection>

      <OrgProfileFields
        profile={profile}
        onChange={setProfile}
        allowPlatformCourses={allowPlatformCourses}
        onAllowPlatformCourses={setAllowPlatformCourses}
      />

      {canBill ? (
        <FormSection
          title="Subscription"
          description={
            billNow
              ? "Started as soon as the organisation is created, at the plan's standard price."
              : "No subscription yet. It can be started later from Billing."
          }
          cols={3}
          action={
            <Switch
              aria-label="Start a subscription now"
              checked={billNow}
              onCheckedChange={setBillNow}
            />
          }
        >
          {billNow && (
            <>
              <Field label="Plan" htmlFor="org-plan">
                <Select value={planCode} onValueChange={setPlanCode}>
                  <SelectTrigger id="org-plan" className="w-full">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name} · {formatMoney(p.unitAmountMinor, p.currency)}/{p.interval}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Seats" htmlFor="org-seats">
                <Input
                  id="org-seats"
                  inputMode="numeric"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value.replace(/\D/g, ""))}
                />
              </Field>
              <Field label="Estimated charge">
                <p className="text-ink flex h-9 items-center text-sm">
                  {plan && seatCount > 0
                    ? `${formatMoney(plan.unitAmountMinor * seatCount, plan.currency)} / ${plan.interval}`
                    : "Choose a plan and seats"}
                </p>
              </Field>
            </>
          )}
        </FormSection>
      ) : (
        <FormSection
          title="Subscription"
          description="Starting a subscription needs billing:organization:manage. Billing staff can start it from Billing once the organisation exists."
        />
      )}

      <FormActions>
        <Button asChild variant="ghost">
          <Link href="/organizations">Cancel</Link>
        </Button>
        <Button type="submit" disabled={!valid || busy}>
          {busy ? "Creating…" : billing ? "Create and subscribe" : "Create organisation"}
        </Button>
      </FormActions>
    </form>
  );
};
