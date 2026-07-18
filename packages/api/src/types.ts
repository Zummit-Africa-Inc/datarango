/** One page of a cursor-paginated gateway response (`?cursor=&limit=`). */
export interface CursorPage<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;
