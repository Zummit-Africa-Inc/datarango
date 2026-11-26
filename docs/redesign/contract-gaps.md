# Contract gaps (§6.1)

What `DESIGN-HANDOFF.md` §6–§7 needs from the catalogue contract
(`datarango-contracts/proto/dr/catalog/v1/catalog.proto`, `message Course`)
that the contract doesn't carry today. Per §6.1 the client does **not** fake
these. Where a field is missing, the UI uses the documented fallback or leaves
the element out.

| Needed (§6.1 / §7.3)                                                       | Contract today                                                                                                                | What the UI does now                                                                                                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `coverUrl` (3:1) and `thumbnailUrl` (4:3), stored separately               | One `image_url`, used for both                                                                                                | `imageUrl` in both slots, cropped by aspect ratio. Generated fallback when null or broken.                                                    |
| `accent`                                                                   | —                                                                                                                             | Category mapping (no category field yet), then a hash of `course.id`                                                                          |
| `icon`                                                                     | —                                                                                                                             | `BookOpen`                                                                                                                                    |
| `category` (drives accent, icon, chips, filters)                           | —                                                                                                                             | No category chip; accent from the id hash                                                                                                     |
| `Pricing.kind = 'included'` (`plan: pro \| org`)                           | — (`prices: Price[]` only)                                                                                                    | Never shown. Empty prices → **Free**; otherwise **paid**.                                                                                     |
| `compareAtMinor`                                                           | —                                                                                                                             | Not shown                                                                                                                                     |
| `tokenPrice`                                                               | Lives in **economy**, not the catalogue: `GET /economy/prices/{courseId}` → `CoursePrice.tokenPrice` (one request per course) | Not on cards yet. Needs a batch read, or the token price on the discover projection, to avoid an N+1.                                         |
| Prices as a JSON array on the wire                                         | `pricesJson` is a **string** (serialised `Price[]`)                                                                           | Parsed client-side with `parsePrices`. Unparseable → no price shown, since the server treats it as premium. Fix: expose `prices` as an array. |
| Lesson count, level, duration, rating, skill tag (card meta, §7.3)         | —                                                                                                                             | Left out of cards                                                                                                                             |
| Instructor name/avatar (list view)                                         | `creator_id` only                                                                                                             | Left out                                                                                                                                      |
| Learner progress per course on catalogue cards                             | Enrolment list has no progress %; `/progress` is per course                                                                   | Catalogue: "Enrolled" badge. Dashboard: progress per in-progress course (a few requests).                                                     |
| Weekly activity / hours learned (§7.2 row 3 chart, "hours this week" stat) | No activity time series                                                                                                       | Chart and hours stat left out; stats use `/economy/progress` counts                                                                           |
| Bookmark / saved state ("Saved" tab)                                       | —                                                                                                                             | Not built                                                                                                                                     |
| Public (unauthenticated) course read                                       | `/learning/catalog/*` requires a session                                                                                      | `next/og` cover (`/og/course/{id}`) is seeded by id only, with no title                                                                       |
| Competition / dataset / learning-path media and pricing                    | —                                                                                                                             | Not wired yet                                                                                                                                 |

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

## Auth pages (§7.7)

§7.7 asks for a real photograph and a testimonial beside each sign-in form.
There are no licensed photos or attributable quotes yet, so `AuthSplitLayout`
shows the audience's points on an accent tile instead. Pass `aside.photo` and
`aside.testimonial` once real ones exist; don't use stock "learners" or
invented quotes.

Admin's sign-in page asks staff to use two-factor authentication, but the
server does not require it: `/connect/authorize` for `datarango-admin`
accepts any session, including social and org-SSO ones. Enforcing it needs the
session to record how it was authenticated (an `amr` claim on the accounts
SSO cookie) and a check for the admin client.

## Competitions (§7.7, §8)

Arena's discover now filters by status (upcoming / live / ended) and
eligibility (open / org), sorts by ending soon, newest or prize, and returns a
participant count per card. Still missing from §7.7 and §8:

- **Participants avatar stack**: needs a few participant names or avatars per
  card. Counting goes through a declared RLS widening; returning names would
  need its own decision on what discover may reveal about who entered.
- **Category, prize type (cash / tokens / kudos), team size**: competitions
  have no category or team fields, and the only prize is a token reward.
- **Sort by participants**: counts are computed for the page being shown, so
  ordering by them needs a stored count (or a count over every visible
  competition) on the server.
