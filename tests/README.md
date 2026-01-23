# E2E Tests for CRM Pointo

This directory contains end-to-end tests using Playwright.

## Test Structure

```
tests/
├── fixtures/           # Test data helpers
│   ├── test-data.ts    # Supabase seeding/cleanup functions
│   └── index.ts        # Exports
├── pages/              # Page Object Models
│   ├── base-page.ts    # Common page functionality
│   ├── leads-page.ts   # /leads page interactions
│   ├── lead-detail-page.ts  # /leads/[id] page interactions
│   ├── dashboard-page.ts    # /dashboard page interactions
│   └── index.ts        # Exports
└── e2e/                # Test specifications
    ├── lead-crud.spec.ts      # Lead creation, editing, deletion
    ├── lead-status.spec.ts    # Status transitions
    ├── dashboard.spec.ts      # Dashboard KPIs and charts
    └── persistence.spec.ts    # Data persistence tests
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

3. **Set up environment variables**
   ```bash
   cp tests/.env.example .env.local
   ```
   Edit `.env.local` with your Supabase credentials.

4. **Start the dev server**
   ```bash
   npm run dev
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with browser visible
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run specific test file
npx playwright test tests/e2e/lead-crud.spec.ts

# Run tests matching a pattern
npx playwright test -g "edit lead"
```

## Test Cases

### Flow 1: Lead Management (CRUD)
- **1.1**: View lead in table and navigate to detail page
- **1.2**: Edit lead and verify persistence (DB round-trip)
- **1.3**: Cancel edit discards changes
- **1.4**: Search filters leads correctly

### Flow 2: Lead Status Transitions
- **2.1**: Full status lifecycle (new → contacted → customer)
- **2.2**: Change status via table dropdown menu
- **2.3**: Status change persists across navigation
- **2.4**: Current status button is visually selected

### Flow 3: Dashboard Analytics
- **3.1**: Dashboard displays KPI cards and charts
- **3.2**: KPI values update after adding leads
- **3.3**: Quick actions navigate to correct pages
- **3.4**: UTM chart shows lead sources

### Flow 4: Data Persistence
- **4.1**: Cross-session data integrity
- **4.2**: Data consistency across multiple tabs
- **4.3**: New lead appears in leads table
- **4.4**: UI state matches database state
- **4.5**: Handling non-existent lead (404)

## Writing New Tests

1. Use Page Object Models from `pages/` directory
2. Use fixtures from `fixtures/test-data.ts` for seeding data
3. Always clean up test data in `afterEach` or `afterAll` hooks
4. Use semantic selectors (`getByRole`, `getByText`) for Hebrew text
5. Verify persistence by querying the database directly

## Troubleshooting

### Browser not installed
```bash
npx playwright install chromium
```

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Ensure dev server is running on port 3000

### Database connection issues
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not the anon key)
- Check network connectivity to Supabase

### Element not found
- Use `test:debug` to step through tests
- Verify Hebrew text matches exactly (including spaces)
- Check for dynamic loading states
