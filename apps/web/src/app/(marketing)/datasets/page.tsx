import { Database, FolderGit2, Gauge, HardDriveDownload, Share2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { ProductPage } from "@/components/marketing/feature-preview";
import { PHOTOS } from "@/content/marketing";

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
    <ProductPage
      accent="sky"
      appHref="/dashboard/datasets"
      eyebrow="Datasets"
      lede="Versioned, hosted datasets that mount straight into your notebooks. The setup part of data work, gone."
      overlay={
        <>
          <p className="text-sm font-semibold">lagos-house-prices</p>
          <p className="text-foreground-muted mt-1 font-mono text-xs">v3 · 48,210 rows · CSV</p>
          <p className="bg-muted mt-3 truncate rounded-lg px-2.5 py-1.5 font-mono text-xs">
            /data/lagos-house-prices/v3
          </p>
          <p className="text-foreground-muted mt-2 text-xs">Mounted read-only in your notebook</p>
        </>
      }
      photo={PHOTOS.monitor}
      points={POINTS}
      story={{
        eyebrow: "No downloads",
        title: "Open a notebook, the data is there",
        body: "Datasets mount read-only into your session at a pinned version, so your results are reproducible and nobody's laptop fills up.",
        bullets: [
          "Pinned versions you can cite",
          "Mounted, not downloaded",
          "The same data competitions score against",
        ],
        photo: PHOTOS.coding,
      }}
      title="Data that's ready to use"
    />
  );
}
