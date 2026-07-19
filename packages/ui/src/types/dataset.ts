export interface DatasetVersion {
  id: string;
  versionNumber: number;
  sizeBytes: number;
  fileCount: number;
  publishedAt: string;
}

export interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string;
  ownerId: string;
  orgId?: string;
  latestVersionId?: string;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatasetDetail extends Dataset {
  versions: DatasetVersion[];
}
