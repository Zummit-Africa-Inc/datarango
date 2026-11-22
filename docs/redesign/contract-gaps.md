# Contract gaps (§6.1)

What `DESIGN-HANDOFF.md` §6–§7 needs from the catalogue contract
(`datarango-contracts/proto/dr/catalog/v1/catalog.proto`, `message Course`)
that the contract doesn't carry today. Per §6.1 the client does **not** fake
these. Where a field is missing, the UI uses the documented fallback or leaves
the element out.

| Needed (§6.1 / §7.3)                                               | Contract today                                                                                                             | What the UI does now                                                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `coverUrl` (3:1) and `thumbnailUrl` (4:3), stored separately       | One `image_url`, used for both                                                                                             | `imageUrl` in both slots, cropped by aspect ratio. Generated fallback when null or broken.                                                    |
| `accent`                                                           | —                                                                                                                          | Category mapping (no category field yet), then a hash of `course.id`                                                                          |
| `icon`                                                             | —                                                                                                                          | `BookOpen`                                                                                                                                    |
| `category` (drives accent, icon, chips, filters)                   | —                                                                                                                          | No category chip; accent from the id hash                                                                                                     |
| `Pricing.kind = 'included'` (`plan: pro \| org`)                   | — (`prices: Price[]` only)                                                                                                 | Never shown. Empty prices → **Free**; otherwise **paid**.                                                                                     |
| `compareAtMinor`                                                   | —                                                                                                                          | Not shown                                                                                                                                     |
| `tokenPrice`                                                       | Unclear. The server treats any non-free `Price` as premium ("tokens included"), but no currency code is defined for tokens | Not shown. Every non-free price is formatted as money.                                                                                        |
| Prices as a JSON array on the wire                                 | `pricesJson` is a **string** (serialised `Price[]`)                                                                        | Parsed client-side with `parsePrices`. Unparseable → no price shown, since the server treats it as premium. Fix: expose `prices` as an array. |
| Lesson count, level, duration, rating, skill tag (card meta, §7.3) | —                                                                                                                          | Left out of cards                                                                                                                             |
| Instructor name/avatar (list view)                                 | `creator_id` only                                                                                                          | Left out                                                                                                                                      |
| Learner progress per course on catalogue cards                     | Enrolment list has no progress %                                                                                           | "Enrolled" badge instead of a progress ring                                                                                                   |
| Bookmark / saved state ("Saved" tab)                               | —                                                                                                                          | Not built                                                                                                                                     |
| Public (unauthenticated) course read                               | `/learning/catalog/*` requires a session                                                                                   | `next/og` cover (`/og/course/{id}`) is seeded by id only, with no title                                                                       |
| Competition / dataset / learning-path media and pricing            | —                                                                                                                          | Not wired yet                                                                                                                                 |

## Proposed contract change

```proto
message CourseMedia {
  optional string cover_url = 1;
  optional string thumbnail_url = 2;
  optional string accent = 3;   // violet | lime | amber | sky | rose | teal
  optional string icon = 4;     // Lucide icon name
}

message CoursePricing {
  oneof kind {
    Free free = 1;
    Included included = 2;      // plan: "pro" | "org"
    Paid paid = 3;              // Price price; optional Price compare_at; optional int64 token_price
  }
}
```

Adding `category`, `level`, `duration_minutes`, `lesson_count`, `rating` and
`rating_count` to `Course` (or to a discover-only projection) would unlock the
§7.3 card meta row and the §8 filters, which also need query support.
