import { Database, FolderGit2, Gauge, HardDriveDownload, Share2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { FeaturePreview } from "@/components/marketing/feature-preview";

export const metadata: Metadata = {
  title: "Datasets",
  description:
    "Hosted, versioned datasets that mount straight into your notebooks — no downloads, no setup.",
};

const POINTS = [
  {
    icon: Database,
    title: "Hosted for you",
    body: "Upload datasets once; we store, version and serve them. Browse what the community has published.",
  },
  {
    icon: FolderGit2,
    title: "Immutable versions",
    body: "Every published version is frozen forever — analyses and competitions always know exactly what data they ran on.",
  },
  {
    icon: HardDriveDownload,
    title: "Mount, don't download",
    body: "Datasets mount read-only into your notebook sessions at /data — zero copies, zero quota spent.",
  },
  {
    icon: Gauge,
    title: "Fair quotas",
    body: "Personal and organization storage quotas keep hosting sustainable — and your own uploads under control.",
  },
  {
    icon: Share2,
    title: "Built for competitions",
    body: "Competition datasets use the same machinery — one click from dataset page to a working notebook.",
  },
  {
    icon: ShieldCheck,
    title: "Scanned & safe",
    body: "Uploads are validated and scanned before they're published. What you mount is what was reviewed.",
  },
];

export default function DatasetsPage() {
  return (
    <FeaturePreview
      eyebrow="Datasets"
      title={
        <>
          Data that's <span className="text-primary-500">ready to use</span>
        </>
      }
      lede="Versioned, hosted datasets that mount straight into your notebooks — the boring part of data work, deleted."
      points={POINTS}
    />
  );
}
