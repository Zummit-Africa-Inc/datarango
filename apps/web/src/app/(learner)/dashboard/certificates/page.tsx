"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Copy, Download, ExternalLink, Loader2 } from "lucide-react";

import { Button, PageLayout, Skeleton } from "@datarango/ui";

import { requestCertificatePdfUrl, useMyCertificates } from "@/hooks/learning";

export default function CertificatesPage() {
  const { data, isLoading } = useMyCertificates();
  const certificates = data?.certificates ?? [];

  return (
    <PageLayout
      title="Certificates"
      subtitle="Earned by completing every lesson and end-of-module exercise."
    >
      {isLoading ? (
        <Skeleton skeleton="list" rows={3} />
      ) : certificates.length === 0 ? (
        <div className="border-hairline bg-card rounded-xs border px-6 py-16 text-center">
          <BadgeCheck className="text-muted-foreground mx-auto size-8" strokeWidth={1.5} />
          <p className="font-heading text-ink mt-3 text-lg">No certificates yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Finish a course — every lesson plus each module&apos;s exercise — and one is issued
            automatically.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/dashboard/courses">Browse courses</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((certificate) => (
            <div
              className="border-hairline bg-card flex flex-wrap items-center gap-4 rounded-xs border p-5"
              key={certificate.id}
            >
              <BadgeCheck className="size-6 shrink-0 text-emerald-600" strokeWidth={1.5} />

              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-ink truncate text-lg">
                  {certificate.courseTitle}
                </h2>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Issued{" "}
                  {new Date(certificate.issuedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="mono-data text-muted-foreground mt-1 text-xs">{certificate.serial}</p>
              </div>

              <div className="flex items-center gap-2">
                <CopyLinkButton serial={certificate.serial} />
                <DownloadPdfButton assetId={certificate.pdfAssetId} />
                <Button asChild size="sm" variant="outline">
                  {/* The public page — what a hiring manager actually opens. */}
                  <Link href={`/verify/${certificate.serial}`} target="_blank">
                    <ExternalLink className="size-3.5" />
                    View
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}

/**
 * Downloads the certificate PDF through a link fetched at click time. Until
 * platform.media has rendered it (seconds after issue) the button says so
 * rather than disappearing, so the learner knows one is coming.
 */
const DownloadPdfButton = ({ assetId }: { assetId: string | null }) => {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!assetId) {
    return (
      <Button disabled size="sm" title="Your PDF is being prepared" variant="ghost">
        <Download className="size-3.5" />
        PDF soon
      </Button>
    );
  }

  const download = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const { url } = await requestCertificatePdfUrl(assetId);
      window.location.assign(url);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button disabled={busy} onClick={download} size="sm" variant="ghost">
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      {failed ? "Try again" : "PDF"}
    </Button>
  );
};

/**
 * Copies the public verification URL rather than the serial alone — pasting a
 * link into a CV or a message is the actual thing people want to do with this.
 */
const CopyLinkButton = ({ serial }: { serial: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}/verify/${serial}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, denied permission) — the View
      // button still gets them there, so this stays silent.
    }
  };

  return (
    <Button onClick={copy} size="sm" variant="ghost">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
};
