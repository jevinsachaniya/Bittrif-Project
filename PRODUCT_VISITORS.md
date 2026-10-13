# Product visitors

The React storefront and FastAPI backend record visits to successfully loaded
product detail pages. The older Node/static storefront is separate from this flow.

- Logged-in clients are recorded with the name, email and phone stored in their
  verified account. Passwords and session tokens are never included in visitor rows.
- Guests see an optional contact dialog after 5 seconds on a product page.
  Close, Escape, clicking outside, or **Skip for now** allows browsing to continue.
- The prompt appears once per tab browsing session, including after a refresh.
  Submitting requires a name and either email or phone, but submission is optional.
- A skipped visit stays anonymous. Shared contact details apply to guest visits
  in the same session and are reused for subsequent visits in that session.
- There is one stored entry per client and product. Repeat visits increase the
  visit count and update the last visit time; retrying a request does neither.
  Logged-in clients are recognized across devices through their account; guests
  are recognized through a visitor ID saved in their browser. Clearing browser
  storage or using another browser creates a new anonymous identity.
  Existing duplicate entries are consolidated automatically on backend startup,
  preserving visit counts, first/last visit times, and shared contact details.

Open **Admin > Product Visitors** at `/admin/product-visitors`. The table includes
client, email, phone, product, visitor type, visit count, and visit times in the browser's local
timezone. Search, type filters, refresh, and pagination are provided.

Database tables are added automatically when FastAPI starts; existing store data
is preserved. Restart the backend and refresh the frontend after updating.
Previously stored login sessions need one new login. New verified sessions last
30 days; expired sessions become guests when a product visit is recorded.

The visitor table uses the application's existing admin access model. The current
admin routes and APIs have no administrator authorization checks; this feature
does not add an admin login or restrict access to the visitor list.

## Verification

From the repository root:

```powershell
python -m pip install -r backend/requirements-dev.txt
python -m unittest discover -s backend -p test_product_visits.py -v
```

These integration tests use a temporary database, covering guest contact,
verified account identity, validation, concurrent retry deduplication,
search/filtering/pagination, and repeat database initialization.

In `client`, run `npm.cmd run build` and `npm.cmd run lint`.
