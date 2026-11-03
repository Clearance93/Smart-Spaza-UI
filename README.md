# Smart Spaza UI

Angular 21 web app for the Smart Spaza marketplace. One codebase hosts all four portals
behind a real login on `/login`, authenticated against **SmartSpazaAPI** (.NET 10 + JWT).

| Role | Routes | What is included |
| --- | --- | --- |
| Retailer | `/dashboard`, `/orders`, `/tracking`, `/inventory`, `/suppliers`, `/analytics`, `/notifications`, `/settings` | Shop dashboard, order management, live delivery tracking, stock, supplier marketplace, analytics and settings |
| Supplier | `/supplier/dashboard`, `/supplier/command-center`, `/supplier/products`, `/supplier/orders`, `/supplier/analytics` | Existing supplier command centre, catalogue, orders and analytics |
| Driver | `/driver/dashboard`, `/driver/deliveries`, `/driver/navigation`, `/driver/history`, `/driver/earnings`, `/driver/notifications`, `/driver/settings` | Active route, delivery status flow, turn-by-turn view, history, earnings and profile |
| Admin | `/admin/dashboard`, `/admin/retailers`, `/admin/suppliers`, `/admin/orders` | Platform KPIs, partner approvals and marketplace lists |

Shared features: JWT authentication, role-based route guards, responsive dark
sidebar/light content shell, `/scanner` for retailers and suppliers.

## Authentication

Sign-in calls `POST /api/Auth/login` on SmartSpazaAPI, stores the access/refresh token in
`localStorage` and maps API roles to portal roles:

| API role | Portal |
| --- | --- |
| `SpazaOwner` | Retailer |
| `Supplier` | Supplier |
| `Driver` | Driver |

Demo accounts (seeded by the API):

| Role | Email | Password |
| --- | --- | --- |
| Retailer | `demo@smartspaza.co.za` | `Spaza_123` |
| Supplier | `supplier@smartspaza.co.za` | `Spaza_123` |
| Driver | `driver@smartspaza.co.za` | `Spaza_123` |

Start the API first (see the `SmartSpazaAPI` repo). `ng serve` proxies `/api` to the
**deployed backend** `http://smartspaza-api.runasp.net` (`proxy.conf.json`). To run against
a local API on port 5223 instead, use:

```bash
npm run start:local
```

> The Admin portal is still a UI demo and has no API role yet.

### Operational data

Authentication, **inventory** and the **scanner/till** are backed by SmartSpazaAPI. The
remaining dashboards (retailer orders/tracking/analytics/suppliers/notifications,
supplier portal, driver portal and admin console) still use in-memory demo data — the API
does not expose those endpoints yet. Whenever such a screen is open the top bar shows a
**“Demo data”** badge, so demo numbers are never mistaken for live data.

Demo data lives in:

- `src/app/core/services/retailer.service.ts`
- `src/app/core/services/driver.service.ts`
- `src/app/core/services/admin.service.ts`
- `src/app/core/services/orders.service.ts`
- `src/app/core/services/dashboard.service.ts`
- `src/app/core/services/command-center.service.ts`
- `src/app/core/services/products.service.ts`

Replace those services with API calls module by module; the components only depend on
their signals.

## Production deployment

The UI is **hosted by SmartSpazaAPI** on the same site, so `/` serves the Angular app and
`/api` serves the API — no CORS and no extra web server:

| URL | Served by |
| --- | --- |
| `http://smartspaza-api.runasp.net/` | Angular UI (`wwwroot/index.html`) |
| `/login`, `/scanner`, `/dashboard`, … | Angular client routes (SPA fallback) |
| `/api/*` | SmartSpazaAPI controllers |
| `/swagger` | API docs |
| `/health` | database health check |

Build the UI into the API and publish the site:

```bash
npm run lint
npm test -- --watch=false
npm run deploy:api                       # ng build + copy into SmartSpazaAPI\SmartSpazaAPI\wwwroot

cd ..\SmartSpazaAPI
dotnet publish SmartSpazaAPI\SmartSpazaAPI.csproj -c Release -o publish
# upload the publish folder (FTP / Web Deploy) to runasp.net
```

`npm run deploy:api` can target another checkout with `API_WWWROOT=<path-to-wwwroot>`.

`environment.prod.ts` replaces `environment.ts` in production builds and uses the
same-origin `/api` path. If you prefer a separate static host (nginx, S3, Azure Static Web
Apps), serve `dist/Smart-Spaza-UI/browser` with an SPA fallback and proxy `/api` to the API
yourself.

Production checklist before go-live:

- Set `Auth:RequireEmailConfirmation` to `true` and configure `Smtp:*` in the API
- Remove the seeded demo accounts (`demo@`, `supplier@`, `driver@smartspaza.co.za`)
- Keep `Cors:AllowedOrigins` empty for same-site hosting
- Serve over HTTPS (JWT access/refresh tokens are stored in `localStorage`)

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
