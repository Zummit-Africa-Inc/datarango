"use client";

import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@datarango/ui";

import { Field, FormSection } from "@/components/form";
import { INDUSTRIES, ORG_SIZES, type OrgProfile } from "@/hooks/operations";

/** Where Datarango sells first, then the rest of the usual suspects. */
const COUNTRY_CODES = [
  "NG",
  "GH",
  "KE",
  "ZA",
  "EG",
  "ET",
  "TZ",
  "UG",
  "RW",
  "SN",
  "CI",
  "CM",
  "MA",
  "DZ",
  "TN",
  "ZM",
  "ZW",
  "BW",
  "NA",
  "US",
  "GB",
  "CA",
  "FR",
  "DE",
  "NL",
  "IE",
  "AE",
  "SA",
  "IN",
  "SG",
  "AU",
];

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export const countryName = (code: string | null) => (code ? (regionNames?.of(code) ?? code) : null);

const COUNTRIES = COUNTRY_CODES.map((code) => ({ code, name: countryName(code) ?? code }));

/** Radix Select can't hold an empty value, so "not set" has a stand-in. */
const NONE = "__none";

const OptionalSelect = ({
  id,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) => (
  <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
    <SelectTrigger id={id} className="w-full">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value={NONE}>Not set</SelectItem>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value}>
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const text = (value: string) => (value.trim() ? value : null);

/**
 * The organisation's descriptive details, shared by "New organisation" and
 * "Edit organisation". Everything is optional.
 */
export const OrgProfileFields = ({
  profile,
  onChange,
  allowPlatformCourses,
  onAllowPlatformCourses,
}: {
  profile: OrgProfile;
  onChange: (profile: OrgProfile) => void;
  allowPlatformCourses: boolean;
  onAllowPlatformCourses: (allowed: boolean) => void;
}) => {
  const set = <K extends keyof OrgProfile>(key: K, value: OrgProfile[K]) =>
    onChange({ ...profile, [key]: value });

  return (
    <>
      <FormSection title="About the organisation" cols={3}>
        <Field label="Website" htmlFor="org-website" hint="Full address, starting with https://">
          <Input
            id="org-website"
            type="url"
            placeholder="https://"
            value={profile.website ?? ""}
            onChange={(e) => set("website", text(e.target.value))}
          />
        </Field>
        <Field label="Industry" htmlFor="org-industry">
          <OptionalSelect
            id="org-industry"
            placeholder="Choose an industry"
            value={profile.industry}
            onChange={(v) => set("industry", v)}
            options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
          />
        </Field>
        <Field label="Size" htmlFor="org-size">
          <OptionalSelect
            id="org-size"
            placeholder="Number of people"
            value={profile.size}
            onChange={(v) => set("size", v)}
            options={ORG_SIZES.map((s) => ({ value: s, label: `${s} people` }))}
          />
        </Field>
        <Field label="Country" htmlFor="org-country">
          <OptionalSelect
            id="org-country"
            placeholder="Choose a country"
            value={profile.country}
            onChange={(v) => set("country", v)}
            options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Contact and invoicing"
        description="Printed on invoices and used for payment notices."
        cols={3}
      >
        <Field
          label="Billing email"
          htmlFor="org-billing-email"
          hint="Where invoices go, if not the owner."
        >
          <Input
            id="org-billing-email"
            type="email"
            autoComplete="off"
            value={profile.billingEmail ?? ""}
            onChange={(e) => set("billingEmail", text(e.target.value))}
          />
        </Field>
        <Field label="Phone" htmlFor="org-phone">
          <Input
            id="org-phone"
            type="tel"
            autoComplete="off"
            value={profile.phone ?? ""}
            onChange={(e) => set("phone", text(e.target.value))}
          />
        </Field>
        <Field label="Tax ID" htmlFor="org-tax" hint="VAT or TIN.">
          <Input
            id="org-tax"
            value={profile.taxId ?? ""}
            onChange={(e) => set("taxId", text(e.target.value))}
          />
        </Field>
        <Field label="Address" htmlFor="org-address" span="full">
          <Textarea
            id="org-address"
            rows={2}
            value={profile.address ?? ""}
            onChange={(e) => set("address", text(e.target.value))}
          />
        </Field>
      </FormSection>

      <FormSection
        title="Datarango courses"
        description={
          allowPlatformCourses
            ? "Members see Datarango's catalogue as well as the organisation's own courses."
            : "Members only see the organisation's own courses."
        }
        action={
          <Switch
            aria-label="Show Datarango courses to members"
            checked={allowPlatformCourses}
            onCheckedChange={onAllowPlatformCourses}
          />
        }
      />

      <FormSection title="Staff notes" description="Only staff see these." cols={1}>
        <Field label="Notes" htmlFor="org-notes" hint="How the deal came in, who to talk to.">
          <Textarea
            id="org-notes"
            rows={3}
            value={profile.notes ?? ""}
            onChange={(e) => set("notes", text(e.target.value))}
          />
        </Field>
      </FormSection>
    </>
  );
};
