# CLAUDE.md

This file provides cross-repository guidance for the **FuzzyMatcher** and **Bearoku** projects, which are tightly coupled parts of the LeanData platform.

## Relationship Between Repos

- **FuzzyMatcher** (`FuzzyMatcher/`) — Salesforce managed package (Apex backend + Angular/Backbone frontend). Deployed to customer Salesforce orgs as a package with a version number. Customers upgrade on their own schedule, so many different versions are active simultaneously.
- **Bearoku** (`bearoku/`) — Cloud-hosted Node.js backend (Express + PostgreSQL + Redis). Deployed to **two servers — early and late** — which can be on different versions at any given time. Always serving all customers regardless of their FuzzyMatcher package version.

These repos are coupled because Bearoku serves customers running **different FuzzyMatcher package versions**. All bearoku changes must consider backward compatibility with older FuzzyMatcher versions.

## Cross-Repo Interaction Points

### Version Coupling & Backward Compatibility

Bearoku tracks each customer's installed FuzzyMatcher version. Because:

- Customers upgrade FuzzyMatcher on their own schedule (many versions are active in the wild)
- Bearoku's early and late servers can themselves be on different versions during deployments
- A bearoku deployment instantly affects all customers, but a FuzzyMatcher upgrade is per-customer

**All bearoku changes must consider backward compatibility with older FuzzyMatcher versions.** Specifically:

- Identify the **minimum FuzzyMatcher version** any bearoku change requires
- Bearoku must gracefully handle customers on older FuzzyMatcher versions (feature flags, conditional logic, or safe defaults)
- Example: if page routing changes in FuzzyMatcher, bearoku must continue supporting the old routing for un-upgraded customers
- Plan deployment order carefully — typically bearoku ships first with backward-compatible changes, then FuzzyMatcher ships the package update
- Consider that during bearoku deploys, the early and late servers may be on different bearoku versions simultaneously — changes must be safe in that split state

### Shared ld-library Submodule

Both repos consume `client/ld-library/` as a git submodule (from `github.com/leandata/LDLibrary`).

- Devs make ld-library changes by `cd`-ing into the `client/ld-library/` submodule within whichever project they're working in (FuzzyMatcher or bearoku), then committing and pushing to the LDLibrary upstream
- Changes to ld-library must be validated in **both** FuzzyMatcher and Bearoku
- After pushing ld-library changes, **both** FuzzyMatcher and Bearoku branches need to be updated with the new LDLibrary commit hash (update the submodule pointer and commit in each repo)
- The ld-library PR template has checkboxes for each consuming app — check all affected ones
- FuzzyMatcher consumers: Angela, layout-views
- Bearoku consumers: bookit-scheduler, chrome-extension, layout-views, login, routing

### Frontend: Iframed Bearoku Pages in FuzzyMatcher

Many bearoku frontend pages are **iframed into FuzzyMatcher's Angular UI** and communicate via `window.postMessage`. This is a primary integration surface — changes to either side of the iframe boundary affect the other repo.

**Handshake protocol:**
1. FuzzyMatcher loads a bearoku URL in an iframe (URL from `RemotingRouter.getHerokuAppUrl()`)
2. Bearoku child sends `IFRAME_LOADED` when ready
3. FuzzyMatcher parent responds with `SALESFORCE_ID` message containing org data, user info, and feature flags
4. Ongoing communication uses typed messages (dirty state, dialogs, navigation, overlays)

**Iframed pages:**

| Bearoku Route | FuzzyMatcher Host Component | Iframe ID |
|---|---|---|
| `/v2/meeting-types/management` | `HerokuMeetingTypesComponent` | `meeting-page-iframe` |
| `/v2/meeting-categories` | `HerokuMeetingCategoriesPage` | `meeting-categories-iframe` |
| `/v2/count-calibration` | `HerokuCountsCalibrationPage` | `counts-calibration-iframe` |
| `/v2/count-calibration/table` | `HerokuDistributionTabComponent` | `distribution-table-iframe` |
| `/v2/bookit-invite` | `HerokuBookItInvitePage` | `bookit-invite-iframe` |
| `/v2/bookit-links/meeting-logs` | `BookitLinksMeetingLogsComponent` | `links-meeting-logs-iframe` |
| `/v2/bookit-links/link-management` | `BookitLinksAdminManagementComponent` | `links-admin-management-iframe` |
| `/layout-views` | `JourneyViewComponent` (layout-views app) | dynamic |

**Common message types (child → parent):** `IFRAME_LOADED`, `IFRAME_HEIGHT`, `SET_DIRTY_STATE`, `SHOW_CONFIRMATION_DIALOG`, `OPEN_NEW_TAB`, `REDIRECT`, `SHOW_LOADING_OVERLAY`, `HIDE_LOADING_OVERLAY`

**Common message types (parent → child):** `SALESFORCE_ID`, `CONFIRMATION_DIALOG_CONFIRMED`, `CONFIRMATION_DIALOG_CANCELED`, `CRM_TYPE`

**Key files:**
- FuzzyMatcher iframe service: `Magellan/Angela/src/app/Services/IFrame/iframe.service.ts`
- FuzzyMatcher host components: `Magellan/Angela/src/app/Pages/heroku-*/` and `Pages/bookit/links/`
- Bearoku iframe service: `client/bookit-scheduler/src/app/Services/iframe/iframe.service.ts`
- Bearoku message types: `client/bookit-scheduler/src/types/iframes.ts`, `client/layout-views/src/types/iframes.ts`

**Security:** FuzzyMatcher (parent) validates `event.origin` against the heroku base URL before processing messages. Bearoku (child) sends with `'*'` origin — security relies on parent-side validation.

### Backend: FuzzyMatcher → Bearoku (Apex HTTP Callouts)

FuzzyMatcher Apex code makes HTTP callouts to bearoku's Express backend for post-booking actions, data sync, and token management.

**Authentication:** All calls use `Authorization: org_token <encrypted-salesforce-org-id>`. Bearoku decrypts via `legacyAuthorize` middleware.

**Base URL:** Defaults to `https://app.leandata.com`, overridable via `LeanData.BACKEND_HOST_URL` custom setting.

**Common callout utility:** `PartnerUtility.doHerokuRESTCallWithOrgAuth(herokuPath, method, payload)`

**Key endpoints called by FuzzyMatcher Apex:**

| Endpoint | Apex Class | Purpose |
|---|---|---|
| `POST /meetingLog/updateLeadCreationData` | `L2aRouting.cls` | Update meeting log after async lead/event upsert |
| `POST /leandata-journey/update-signals-by-journeys` | `LDJourney.cls` | Update buying group member statuses after journey changes |
| `POST /revokeBookitTokens` | `PartnerUtility.cls` | Revoke calendar tokens on deauthorization |
| `POST /v2/welcomeEmail` | `PartnerUtility.cls` | Send welcome emails to new BookIt users |
| `POST /transferDataToPG` | `PartnerUtility.cls` | Transfer Salesforce data to bearoku PostgreSQL |
| `POST /attempt-bearoku-refresh` | `PartnerUtility.cls` | Trigger routing pool refresh and auto-calibration |
| `POST /bamboohr/*`, `GET /bamboohr/*` | `PartnerUtility.cls` | BambooHR vacation/availability sync |
| `POST /google-calendar/*`, `GET /google-calendar/*` | `PartnerUtility.cls` | Google Calendar vacation sync |
| `POST /upsert-api-key`, `POST /verify-api-key` | `PartnerUtility.cls` | Manage Gemini API keys for title clustering |

### Backend: Bearoku → Salesforce (nforce + Apex REST)

Bearoku calls back to customer Salesforce orgs using the **nforce** library with OAuth tokens stored in the `customer_token` database table. Each customer org has its own `access_token` and `instance_url`.

**Connection setup:** `apps/common/connection.ts` — creates separate `nforce` connections for production and sandbox orgs.

**Key Apex REST endpoints called by bearoku:**

| Endpoint | Bearoku File | Purpose |
|---|---|---|
| `POST /services/apexrest/LeanDataAPI` | `legacyBearoku/util.ts` → `leanDataAPICall()` | Core API for post-meeting-booking actions (lead creation, event updates) |
| `POST /services/apexrest/LeanDataREST` | `legacyBearoku/util.ts` → `leandataRESTCall()` | REST-based operations against customer org |
| `POST /services/apexrest/LeanData/` | `legacyBearoku/util.ts` → `leanDataCall()` | Generic LeanData operations |
| `POST /services/apexrest/BeaconAPI` | `legacyBearoku/util.ts` → `beaconCallout()` | Beacon/settings sync with customer org |

**Managed package path handling:** Bearoku checks `oauth.managed_package` to determine whether to use the namespaced path (`/services/apexrest/LeanData/LeanDataAPI`) or unmanaged path (`/services/apexrest/LeanDataAPI`). This is a backward compatibility concern when modifying these Apex REST classes.

**Callout utility:** `apps/common/httpHelper.ts` wraps Node.js `https.request()` for all outbound HTTP.

### Shared Flow/Routing Logic

The flowbuilder graph validator in ld-library contains logic shared across both platforms:

- BookIt-specific node types (`bookitTriggerNodeTypes`) used in validation
- Condition operators like "domain fuzzy matches" used in both routing UIs
- Meeting type references (`bearokuMeetingType`) in FuzzyMatcher's validation logic

### Cross-Repo Feature Planning

When a task touches both repos, determine the **project type** early: FuzzyMatcher, Bearoku, or Both. For "Both" projects:

- Define the API contract between the Salesforce package and the cloud service
- Plan deployment order (typically: bearoku first with backward compatibility, then FuzzyMatcher package)
- Consider rollback scenarios — bearoku can be rolled back instantly, FuzzyMatcher package upgrades cannot
- For iframe changes: update message types in bearoku's `iframes.ts` AND the corresponding handler in FuzzyMatcher's host component
- For backend callout changes: update both sides — the bearoku route handler AND the Apex callout in `PartnerUtility.cls`, or the Apex REST class AND the nforce call in bearoku's `util.ts`

## Angular Conventions (Shared Across Both Repos)

Both repos use Angular 18 with identical conventions. All Angular code in either repo must follow these patterns:

- **Standalone components only** — no NgModules
- **Modern control flow** — `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- **Signal-based state** — `signal()`, `computed()` for reactivity
- **Function-based I/O** — `input()`, `output()` (not `@Input()`, `@Output()`)
- **inject() function** — not constructor injection
- **Native bindings** — `[class.active]="cond"` not `[ngClass]`, `[style.prop]="val"` not `[ngStyle]`
- **Strict TypeScript** — no `any`, prefer type inference
- **Reactive forms** over template-driven
- **Services** use `providedIn: 'root'`
- **Error handling** — always use `NewRelicErrorHandler`
- **UI components** — use ld-library `ldc-*` components and `lds-*` CSS classes (not legacy `ld-*` prefix)

## Formatting

Both repos use Prettier with the config from ld-library (`client/ld-library/prettier.config.mjs`). Run `npm run format` in whichever repo you're working in before committing.

## When Working Across Both Repos

If a task requires changes in both FuzzyMatcher and Bearoku:

1. **Read both CLAUDE.md files** — each repo has its own with build commands, architecture details, and repo-specific conventions
2. **Check the bearoku build-plan skill** (`bearoku/.claude/skills/build-plan/SKILL.md`) — it has structured discovery questions for cross-repo features including backward compatibility checklists
3. **ld-library changes** — make changes inside the submodule in whichever repo you're working in, push to LDLibrary upstream, then update the submodule pointer in both FuzzyMatcher and Bearoku
