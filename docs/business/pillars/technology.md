# Money-Key Technology Pillar

> Strategic Framework for Digital Infrastructure and Automation Excellence

## Executive Summary

Money-Key's technology pillar enables seamless lead management and case processing through an automation-first approach. Our modern tech stack leverages Next.js, Supabase, and strategic integrations to maximize operational efficiency while maintaining data security and compliance standards.

**Core Philosophy**: Technology serves business outcomes through intelligent automation, reducing manual work and enabling data-driven decision making.

---

## Strategic Level: Vision & Direction

### Strategic Objectives

1. **Automation-First Culture**
   - Automate 80% of routine workflows by end of 2026
   - Eliminate manual data entry through API integrations
   - Enable case processing with minimal human intervention
   - Reduce operational touch time per case from current baseline

2. **Data-Driven Intelligence**
   - Real-time KPI dashboards reflecting business performance
   - Lead scoring to prioritize high-value opportunities
   - Predictive analytics for conversion forecasting
   - Compliance audit trails for regulatory requirements

3. **Seamless Integration Ecosystem**
   - Connect all business tools (accounting, calendar, documents, SMS)
   - Enable webhook-triggered workflows across systems
   - Single source of truth for lead and customer data
   - Reduce context switching and duplicate data entry

4. **Scalable & Reliable Infrastructure**
   - Support 10x growth without system redesign
   - 99.5%+ uptime for production systems
   - Automated backup and disaster recovery
   - Performance optimization for growing datasets

### Strategic Initiatives (2026 Roadmap)

| Initiative | Timeline | Impact | Owner |
|-----------|----------|--------|-------|
| Webhook-based status automation | Q1 | 5-10 hours/week saved | Engineering |
| Lead scoring engine | Q1 | Better prioritization | Product |
| Google Calendar integration | Q2 | Automatic scheduling | Integrations |
| Automated KPI dashboard | Q2 | Daily insights | Data |
| Invoice generation | Q2 | Faster billing cycle | Finance |
| SMS gateway integration | Q3 | Backup communication | Operations |
| Document auto-upload reminders | Q3 | Higher completion rates | Support |
| Advanced reporting analytics | Q4 | Better decision data | Analytics |

---

## Tactical Level: Architecture & Implementation

### Current Technology Stack

#### Frontend Architecture
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS 3
- **UI Components**: Radix UI (headless, accessible)
- **Data Visualization**: Recharts (charts and graphs)
- **Form Management**: React Hook Form + Zod validation
- **Markdown Editor**: UIW React MD Editor (for playbooks)
- **Notifications**: Sonner (toast notifications)
- **Hosting**: Vercel (edge functions, serverless)

#### Backend Architecture
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT-based)
- **Real-time**: Supabase Realtime
- **Edge Functions**: Deno-based serverless functions
- **File Storage**: Supabase Storage
- **API**: RESTful via Supabase API

#### External Integrations
- **WhatsApp**: Green API (message sending, avatar retrieval)
- **Analytics**: Sentry (error tracking, performance monitoring)
- **Testing**: Playwright (E2E test automation)

#### Development Tools
- **Language**: TypeScript 5
- **Linting**: ESLint with Next.js config
- **Testing**: Playwright for end-to-end tests
- **Package Management**: npm
- **Version Control**: Git (GitHub)
- **CI/CD**: GitHub Actions (via Vercel)

### Data Architecture

#### Core Entities

**Leads Table**
```sql
- id (UUID, primary key)
- name (string, required)
- first_name, last_name (strings)
- email (string, optional)
- phone (string, optional)
- status (enum, 17 canonical statuses)
- expected_revenue (decimal)
- probability (percentage)
- refund_amount (decimal) -- NEW
- commission_rate (decimal) -- NEW
- playbook_id (foreign key)
- utm_source, utm_medium, utm_campaign, utm_content, utm_term (tracking)
- utm_data (JSON, comprehensive tracking metadata)
- gclid (Google Ads tracking)
- landing_page (source page)
- referrer (HTTP referrer)
- ip_address, user_agent (session tracking)
- whatsapp_avatar_url (cached avatar from Green API)
- custom_fields (JSON, flexible schema)
- created_at, updated_at, deleted_at (soft delete)
```

**Lead Events Table** (Audit Trail)
```sql
- id (UUID)
- lead_id (foreign key)
- event_type (created, updated, field_changed, status_changed, deleted, restored, note_added, note_updated, note_deleted)
- field_name (which field changed, if applicable)
- old_value, new_value (previous and current values)
- user_email (who made the change)
- metadata (JSON, additional context)
- created_at (timestamp)
```

**Playbooks Table** (Workflow Templates)
```sql
- id (UUID)
- name (string)
- description (string)
- content (markdown)
- category (string)
- is_default (boolean)
- created_by (user reference)
- created_at, updated_at, deleted_at
```

**User Profiles Table**
```sql
- id (UUID)
- user_id (Supabase Auth reference)
- email, display_name
- created_at, updated_at
```

**Lead Notes Table**
```sql
- id (UUID)
- lead_id (foreign key)
- content (text)
- user_id (who created)
- created_at, updated_at, deleted_at
```

#### Lead Status Pipeline

```
FOLLOW UP (Initial Contact Attempts)
├─ not_contacted (טרם יצרנו קשר)
└─ no_answer (אין מענה)

WARM (Active Engagement)
├─ contacted (נוצר קשר)
├─ message_sent (נשלחה הודעה)
├─ meeting_set (נקבעה שיחה)
└─ pending_agreement (בהמתנה להסכם)

SIGNED (Active Customer Processing)
├─ signed (חתם על הסכם התקשרות)
├─ under_review (בבדיקה)
├─ report_submitted (הוגש דוח)
├─ missing_document (חסר מסמך)
├─ completed (הושלם)
├─ waiting_for_payment (ממתין להגבייה)
└─ payment_completed (גבייה הושלמה)

EXIT (Pipeline Exit)
├─ not_relevant (לא רלוונטי)
├─ closed_elsewhere (סגר במקום אחר)
└─ paying_customer (לקוח משלם)

FUTURE (Future Opportunities)
└─ future_interest (מעוניין בעתיד)
```

### Integration Strategy

#### Green API (WhatsApp)
**Purpose**: Direct customer communication and avatar retrieval

**Current Implementation**:
- Send WhatsApp messages to leads
- Retrieve contact avatars (profile pictures)
- Store `whatsapp_avatar_url` for display

**Future Enhancement**: Webhook-based message status tracking

```typescript
// Example: Send WhatsApp message
await greenApi.sendMessage({
  chatId: phone + '@c.us',
  message: messageText
})

// Example: Get avatar
const avatarUrl = await greenApi.getAvatar(phone)
```

#### UTM Parameter Tracking
**Purpose**: Understand lead source and marketing effectiveness

**Captured Parameters**:
- `utm_source` (where traffic comes from: google, facebook, direct, etc.)
- `utm_medium` (channel type: cpc, organic, email, referral)
- `utm_campaign` (specific campaign name)
- `utm_content` (which link/ad variant)
- `utm_term` (search keywords)
- `utm_data` (JSON with full query string and additional context)

**Usage**:
- Source attribution in KPI dashboard
- ROI analysis per channel
- Campaign performance tracking
- Budget allocation decisions

#### Sentry Integration
**Purpose**: Production error tracking and performance monitoring

**Captured Data**:
- Unhandled exceptions and errors
- Performance metrics (load times, API latency)
- User sessions (errors in context)
- Release tracking for version mapping

**Benefits**:
- Real-time alerting for critical errors
- Performance regression detection
- Source map support for debugging minified code

### Webhook & Automation Framework

#### Webhook-Triggered Workflows

**Status Change Triggers**
```
When status changes to:
├─ "meeting_set" → Send calendar invite request
├─ "pending_agreement" → Schedule follow-up reminder (3 days)
├─ "signed" → Trigger document checklist workflow
├─ "missing_document" → Send document upload reminder
├─ "report_submitted" → Route to finance for review
├─ "waiting_for_payment" → Send payment collection message
├─ "completed" → Trigger invoice generation
└─ "paying_customer" → Add to success metrics
```

**Data Change Triggers**
```
When field changes:
├─ refund_amount → Recalculate expected_revenue
├─ commission_rate → Update financial projections
├─ phone → Validate and update WhatsApp contact
└─ custom_fields → Route to appropriate system (Zoho, accounting)
```

**Event-Based Actions**
```
Automatic actions on:
├─ Lead creation → Send welcome message (WhatsApp)
├─ 48h no reply → Escalation reminder
├─ Document upload → Validate and trigger review
└─ Status exit → Archive and move to completed
```

### API Endpoints & Server Actions

**Read Operations**
```typescript
// List leads with filters
GET /api/leads?status=signed&dateFrom=2024-01-01&limit=50

// Get lead detail with full history
GET /api/leads/:id/detail

// Get KPI dashboard data
GET /api/kpis?dateFrom=2024-01-01&dateTo=2024-01-31

// Track source attribution
GET /api/analytics/utm?source=google&dateRange=90d

// Get lead events (audit trail)
GET /api/leads/:id/events?type=field_changed
```

**Write Operations**
```typescript
// Create lead (with UTM auto-capture)
POST /api/leads
{
  name, email, phone, source,
  utm_source, utm_medium, utm_campaign,
  custom_fields, expected_revenue
}

// Update lead status (triggers webhooks)
PATCH /api/leads/:id
{ status: "signed" }

// Add lead note
POST /api/leads/:id/notes
{ content: "..." }

// Bulk status update (from playbook)
POST /api/leads/bulk-update
{
  ids: [...],
  status: "contacted",
  playbook_id: "..."
}
```

---

## Operational Level: Daily Systems & Maintenance

### System Monitoring & Health Checks

#### Production Metrics to Monitor

| Metric | Target | Alert Threshold | Check Frequency |
|--------|--------|-----------------|-----------------|
| API Response Time | <200ms | >500ms | Real-time |
| Error Rate | <0.1% | >0.5% | Real-time |
| Database Connections | <50% utilization | >80% | 5 minutes |
| Storage Usage | <70% quota | >85% | Daily |
| Auth Failures | <5% | >10% | Hourly |
| WhatsApp Delivery Rate | >95% | <90% | Daily |

#### Sentry Dashboard Checks
- Daily review of error trends
- Performance regression detection
- New error alerting
- Release health tracking

#### Uptime Monitoring
- Vercel deployment status
- Supabase service health
- Green API integration status
- Database query performance

### Data Maintenance

#### Daily Tasks
1. **Backup Verification** (automatic via Supabase)
   - Point-in-time recovery available
   - Test restore procedure monthly

2. **Data Quality Checks**
   - Verify no orphaned lead_events
   - Check for duplicate phone numbers
   - Validate status transitions

3. **Performance Optimization**
   - Monitor slow database queries
   - Index optimization as needed
   - Cache validation for KPI data

#### Weekly Tasks
1. **Log Cleanup**
   - Archive old Sentry logs
   - Clear temporary upload files

2. **Metrics Review**
   - Analyze API usage patterns
   - Review error patterns for trends
   - Check lead processing pipeline health

#### Monthly Tasks
1. **Infrastructure Review**
   - Database size growth analysis
   - Storage usage trending
   - Cost optimization review

2. **Integration Health Check**
   - Green API quota usage
   - Authentication token refresh verification
   - Webhook delivery success rates

### Development Workflow

#### Code Quality Standards
- TypeScript strict mode enabled
- ESLint rules enforced
- All new features require unit/integration tests
- Playwright E2E tests for critical flows

#### Deployment Process
1. Feature branch development with TypeScript checking
2. Pull request with code review (architecture + business logic)
3. Automated tests run in CI/CD
4. Merge to main triggers Vercel deployment
5. Staging validation before production rollout

#### Incident Response
- Sentry critical alert triggers immediate investigation
- Rollback capability: Vercel one-click revert to previous version
- Post-incident review and documentation
- Automated monitoring prevents issues before user impact

---

## Automation Opportunities: High-Impact Initiatives

### Quick Wins (1-2 weeks each)

#### 1. Webhook-Based Status Change Triggers
**Current State**: Manual workflow steps after status changes
**Automation**: Trigger actions automatically when status changes

**Implementation**:
- Set up Supabase Edge Functions for each status trigger
- Send WhatsApp message when status = "meeting_set"
- Schedule calendar invite when status = "pending_agreement"
- Send payment reminder when status = "waiting_for_payment"

**Expected Impact**:
- 5-10 hours/week saved (eliminate manual reminders)
- Faster response times (instant triggers vs manual scheduling)
- Higher follow-up rates (never miss a scheduled action)
- Better data accuracy (automated logging)

#### 2. Automated KPI Dashboard Generation
**Current State**: Manual calculation of metrics
**Automation**: Real-time dashboard updated hourly

**Implementation**:
- Edge Function to calculate KPIs from lead_events table
- Cache results for 1-hour performance optimization
- Build dashboard component that reads from cache
- Add email summaries for daily/weekly reporting

**Expected Impact**:
- Daily insights without manual reporting
- Identify trends immediately
- Better decision data (real-time vs daily snapshots)
- 2-3 hours/week saved on reporting

#### 3. Lead Scoring Rules Engine
**Current State**: Manual assessment of lead quality
**Automation**: Automatic score based on engagement signals

**Implementation**:
```typescript
// Scoring rules
const leadScore = {
  baseScore: 0,
  +20: if (status in WARM),
  +40: if (status in SIGNED),
  +50: if (expected_revenue > 10000),
  +30: if (probability > 80%),
  +25: if (days_since_contact < 7),
  +15: if (has_multiple_interactions),
  -10: if (days_since_contact > 30),
  -20: if (missing_key_documents)
}
```

**Expected Impact**:
- Prioritize high-value leads (focus sales effort)
- Faster conversion for qualified leads
- 3-5 hours/week identifying hot prospects
- Better resource allocation

#### 4. Document Upload Reminders
**Current State**: Manual follow-up for missing documents
**Automation**: Automatic reminders based on lead status

**Implementation**:
- Webhook triggers when status = "missing_document"
- Send WhatsApp message with document upload link
- Follow-up reminder after 2 days if still missing
- Auto-complete when document detected

**Expected Impact**:
- Faster document collection
- Fewer abandoned cases due to missing docs
- 4-6 hours/week saved on follow-ups

### Medium-Term Initiatives (3-6 weeks each)

#### 5. Google Calendar Integration
**Purpose**: Automatic scheduling and time management

**Implementation**:
- OAuth 2.0 integration with Google Calendar
- When status = "meeting_set", create calendar event
- Bi-directional sync (event changes update lead)
- Timezone handling for international clients
- Conflict detection and smart rescheduling

**Expected Impact**:
- Eliminate double-booking
- Automatic schedule reminders
- Calendar data feeds dashboards
- 1-2 hours/week scheduling time saved

#### 6. Invoice Generation & Billing
**Purpose**: Automate billing workflow

**Implementation**:
- Edge Function to generate invoices when status = "completed"
- Integrate with accounting system (QuickBooks/Xero)
- Auto-send invoices via email
- Payment tracking integration
- Commission calculation automation

**Expected Impact**:
- Faster payment collection (immediate invoicing)
- Reduced billing errors (automated calculation)
- 3-4 hours/week billing administration
- Better cash flow (faster invoicing)

#### 7. SMS Gateway Integration (Backup Communication)
**Purpose**: Redundant communication channel if WhatsApp fails

**Implementation**:
- Integration with Twilio or similar SMS provider
- Route messages through WhatsApp first, SMS fallback
- Track delivery status for both channels
- Unified inbox for all messages

**Expected Impact**:
- Higher message delivery reliability
- Faster response from clients who prefer SMS
- Reduced missed communications
- Better audit trail

#### 8. Document Storage Integration (Google Drive/Dropbox)
**Purpose**: Centralized document management

**Implementation**:
- API integration with Google Drive or Dropbox
- Auto-upload documents when received
- Create folder structure per lead
- Link in CRM for easy access
- Permission management

**Expected Impact**:
- Centralized document storage
- Easier document retrieval
- Compliance audit trail
- Reduced email clutter

### Advanced Analytics (2+ months)

#### 9. Predictive Lead Scoring
**Purpose**: ML-based conversion likelihood prediction

**Features**:
- Historical conversion patterns
- Time-to-conversion modeling
- Churn risk identification
- Optimal contact timing
- Budget allocation optimization

#### 10. Advanced Reporting & BI
**Purpose**: Executive dashboards and business intelligence

**Features**:
- Custom report builder
- Time-series analysis
- Cohort analysis (leads from same period)
- Funnel analysis with drop-off identification
- Forecasting models

---

## Integration Roadmap: The Connected Ecosystem

### Phase 1: Foundation (Q1 2026)
- Webhook framework for status triggers
- Green API optimization (error handling, retry logic)
- KPI automation dashboard
- Lead scoring engine

### Phase 2: Communication (Q2 2026)
- Google Calendar integration
- SMS gateway (Twilio/MessageBird)
- Document management (Google Drive)
- Email automation (transactional emails)

### Phase 3: Finance & Operations (Q3 2026)
- Accounting software integration (QuickBooks/Xero)
- Invoice automation
- Commission calculation automation
- Payment tracking integration

### Phase 4: Intelligence (Q4 2026)
- Advanced analytics and BI
- ML-based lead scoring
- Predictive churn modeling
- Customer lifetime value calculations

### Future Considerations (2027+)
- Video conferencing integration (Zoom/Google Meet)
- Advanced document OCR and processing
- AI-powered customer support automation
- Advanced forecasting and planning

---

## Current State Assessment Questions

These questions help identify your technology gaps and prioritization:

### 1. **Tool Ecosystem Inventory**
   > "What tools and systems do you currently use alongside the CRM?"

   **Why This Matters**: Understand where integrations are needed

   **Expected Answers**:
   - Calendar system (Google Calendar, Outlook, etc.)
   - Accounting software (QuickBooks, Xero, Zoho)
   - Document storage (Google Drive, OneDrive, Dropbox)
   - Communication (WhatsApp, email, SMS)
   - Payments (PayPal, Stripe, bank transfers)

   **Follow-up Investigation**:
   - How much time is spent manually transferring data between systems?
   - Which systems are critical to your workflow?
   - What manual data entry tasks could be automated?

### 2. **Manual Work Quantification**
   > "What manual tasks take the most time in your daily workflow?"

   **Why This Matters**: Identify highest-ROI automation opportunities

   **Expected Answers**:
   - Updating lead status manually
   - Sending follow-up reminders
   - Collecting missing documents
   - Scheduling meetings
   - Generating invoices
   - Data entry from phone calls

   **Analysis Framework**:
   - Estimate hours/week per task
   - Calculate annual cost (hours × hourly rate)
   - Prioritize by cost and frequency
   - Identify automation feasibility

### 3. **Integration Priorities**
   > "Which integrations would help you most in order?"

   **Why This Matters**: Sequence implementation roadmap

   **Suggested Rankings** (adjust for your business):
   1. Google Calendar (time management)
   2. WhatsApp/SMS (communication reliability)
   3. Accounting software (financial accuracy)
   4. Document management (compliance)
   5. Payment tracking (cash flow)

   **Evaluation Criteria**:
   - Time saved per integration
   - Complexity to implement
   - Cost-benefit ratio
   - Strategic importance

### 4. **Current Automation Usage**
   > "Do you use automation anywhere today? What works well, what doesn't?"

   **Why This Matters**: Learn from existing automation experiences

   **Common Patterns**:
   - Email rules/filters
   - Calendar reminders
   - Spreadsheet formulas
   - IFTTT or Zapier rules
   - WhatsApp templates/broadcasts

   **Key Questions**:
   - Which automations deliver value?
   - Which have you abandoned and why?
   - What failures have occurred?
   - What unexpected benefits emerged?
   - What obstacles prevented adoption?

### 5. **Data Tracking Gaps**
   > "What data would you like to track that you don't currently track?"

   **Why This Matters**: Understand business intelligence needs

   **Suggested Data Points**:
   - Lead source quality (conversion by source)
   - Sales rep performance (productivity metrics)
   - Time to conversion (cycle length)
   - Document submission rates
   - Communication effectiveness (reply rates)
   - Customer lifetime value
   - Seasonal patterns
   - Geographic performance

   **Implementation Guide**:
   - Which data is essential vs nice-to-have?
   - What's the cost of tracking each data point?
   - How would each metric improve decision making?
   - What dashboards would you build with this data?

---

## Performance Benchmarks & Targets

### System Performance
- API response time: <200ms (p95)
- Page load time: <2 seconds (fully interactive)
- Database query time: <100ms (p95)
- Error rate: <0.1% of transactions

### Operational Metrics
- System uptime: 99.5% (monthly)
- Deployment frequency: Multiple per day (with Vercel)
- Mean time to recovery: <30 minutes for critical issues
- Documentation coverage: 100% for APIs

### Automation Impact
- Manual time saved per day: Target 3-5 hours
- Lead processing speed: 10x improvement target
- Error reduction: Target 90% reduction in manual entry errors
- Data consistency: Target 100% audit trail coverage

---

## Risk Management & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Database downtime | Low | Critical | Supabase 99.9% SLA, automated backups, failover |
| API integration failure | Medium | High | Fallback procedures, error monitoring, circuit breakers |
| Data loss | Very Low | Critical | Point-in-time recovery, geographic redundancy |
| Security breach | Low | Critical | OAuth 2.0, row-level security, encrypted storage |
| Performance degradation | Medium | Medium | Load testing, database optimization, CDN caching |

### Operational Risks

| Risk | Mitigation |
|------|-----------|
| Key person dependency | Documentation, code reviews, knowledge sharing |
| Skill gaps in new tech | Training, external consultation, pair programming |
| Integration complexity | Phased rollout, pilot testing, vendor support contracts |

---

## Success Metrics & KPIs

### Leading Indicators (Predict Success)
- Code coverage >80% for critical paths
- Zero critical security vulnerabilities
- API response time consistency <200ms
- Test automation coverage >70%

### Lagging Indicators (Measure Results)
- Manual work hours reduced by 50% (target)
- Lead processing time decreased 10x
- Data consistency improved (fewer manual corrections)
- System uptime >99.5%
- User adoption rate >90%

### Business Outcomes
- Faster case closure times
- Lower CAC through better data
- Higher conversion rates through lead scoring
- Improved cash flow through invoice automation
- Better decision making through real-time dashboards

---

## Technology Standards & Best Practices

### Code Quality
- TypeScript strict mode always enabled
- ESLint rules enforced via CI/CD
- Code review required before merge
- Database migrations version controlled

### Security Standards
- Row-level security (RLS) policies enforced
- Environment variables for secrets (never hardcoded)
- API rate limiting enabled
- CORS properly configured
- Input validation on all forms

### Documentation Standards
- API endpoints documented
- Database schema changes tracked
- Architecture decisions recorded (ADRs)
- Incident post-mortems completed

### Testing Standards
- Critical user flows covered by E2E tests
- Database migrations tested before production
- Performance tests for key operations
- Regression tests for bug fixes

---

## Contact & Support

**Technology Questions**: Contact your engineering team
**Integration Requests**: Submit via technology roadmap process
**Performance Issues**: Alert via Sentry or support ticket
**Strategic Planning**: Quarterly architecture review meetings

---

**Last Updated**: February 2026
**Document Owner**: Engineering & Product Teams
**Version**: 1.0
