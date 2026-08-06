import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldAlert } from "lucide-react";

import { Button } from "@datarango/ui";

/**
 * Public certificate verification (decision #10: public page at
 * `/verify/[serial]`, SEO-friendly, no login).
 *
 * A **server component on purpose**: the whole point is that a hiring manager
 * can paste a serial from a CV and get an answer, so the result has to be in
 * the HTML rather than behind a client fetch. The proxy only guards
 * `/dashboard/*`, so this route is public without further arrangement.
 *
 * Reading it needs no credentials because the gateway route is anonymous and
 * Postgres narrows visibility to the single declared serial — knowing the
 * serial is the credential.
 */

interface VerifiedCertificate {
  valid: boolean;
  serial: string;
  courseTitle: string;
  issuedAt: string;
  pdfUrl: string | null;
}

const gatewayUrl = () =>
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Fetches the certificate, or null when the serial doesn't resolve. A network
 * failure also returns null: the page then says it couldn't verify, which is
 * honest, rather than implying the certificate is fake.
 */
const verify = async (serial: string): Promise<VerifiedCertificate | null> => {
  try {
    const response = await fetch(
      `${gatewayUrl()}/learning/certificates/${encodeURIComponent(serial)}/verify`,
      // Never cache: a certificate could in principle be revoked, and a stale
      // "valid" is the one wrong answer that matters here.
      { cache: "no-store" },
    );

    if (!response.ok) return null;
    return (await response.json()) as VerifiedCertificate;
  } catch {
    return null;
  }
};

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ serial: string }>;
}): Promise<Metadata> => {
  const { serial } = await params;
  const certificate = await verify(serial);

  return certificate
    ? {
        title: `${certificate.courseTitle} — verified certificate`,
        description: `Datarango certificate ${certificate.serial} for ${certificate.courseTitle}, issued ${new Date(certificate.issuedAt).toLocaleDateString()}.`,
      }
    : {
        title: "Certificate not found",
        description: "This Datarango certificate serial could not be verified.",
        // Nothing to index on a dead serial.
        robots: { index: false },
      };
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ serial: string }>;
}) {
  const { serial } = await params;
  const certificate = await verify(serial);

  return (
    <main className="container mx-auto px-4 py-24 lg:px-8">
      <div className="mx-auto max-w-xl">
        {certificate ? (
          <div className="border-hairline bg-card rounded-xs border p-8 text-center">
            <BadgeCheck className="mx-auto size-12 text-emerald-600" strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold tracking-widest text-emerald-700 uppercase">
              Verified certificate
            </p>

            <h1 className="font-heading text-ink mt-3 text-3xl tracking-tight">
              {certificate.courseTitle}
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              Issued{" "}
              {new Date(certificate.issuedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <p className="border-hairline text-muted-foreground mono-data mt-6 border-t pt-6 text-sm">
              {certificate.serial}
            </p>

            <p className="text-muted-foreground mt-6 text-sm leading-relaxed">
              This certificate was issued by Datarango on completion of every lesson and
              end-of-module exercise in the course.
            </p>

            {certificate.pdfUrl && (
              <Button asChild className="mt-6" variant="outline">
                <a href={certificate.pdfUrl} rel="noopener noreferrer" target="_blank">
                  Download PDF
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div className="border-hairline bg-card rounded-xs border p-8 text-center">
            <ShieldAlert className="text-muted-foreground mx-auto size-12" strokeWidth={1.5} />
            <h1 className="font-heading text-ink mt-4 text-2xl tracking-tight">
              We couldn&apos;t verify that serial
            </h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              No Datarango certificate matches <span className="mono-data break-all">{serial}</span>
              . Check for a typo — serials look like{" "}
              <span className="mono-data">DR-XXXX-XXXX-XXXX</span> and never contain the letters I,
              L, O or U.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/">Back to Datarango</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
