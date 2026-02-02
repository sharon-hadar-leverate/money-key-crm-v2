# Money-Key Automation Opportunities

> Prioritized list of automation opportunities for Money-Key operations.

## Priority Matrix

| Priority | Impact | Effort | When to Implement |
|----------|--------|--------|-------------------|
| 🔴 High | High value, saves significant time | Low-Medium | Immediate |
| 🟡 Medium | Moderate value | Medium | Next quarter |
| 🟢 Low | Nice to have | High | Future |

---

## 🔴 High Priority (Implement Now)

### 1. Commission Auto-Calculation
**Status:** In Progress (migration 010)

| Aspect | Details |
|--------|---------|
| Current State | Manual calculation |
| Automated State | `commission_amount = refund_amount × commission_rate` |
| Implementation | Database trigger or computed column |
| Impact | Eliminates errors, saves ~5 min/case |

### 2. Lead Follow-up Reminders
**Status:** Not Started

| Aspect | Details |
|--------|---------|
| Current State | Manual tracking |
| Automated State | Auto-schedule based on lead status + time elapsed |
| Implementation | Cron job + notification system |
| Impact | No leads fall through cracks |

**Rules:**
- `new` → remind in 1 hour if no contact
- `contacted` → remind in 2 days if no response
- `documents_pending` → remind in 3 days
- `awaiting_refund` → remind weekly

### 3. Status Change Notifications
**Status:** Not Started

| Aspect | Details |
|--------|---------|
| Current State | Manual check of status changes |
| Automated State | Webhook triggers on status change |
| Implementation | Supabase triggers + webhook handler |
| Impact | Real-time awareness of pipeline movement |

**Trigger Events:**
- Lead moves to `converted` → notify owner
- Lead moves to `documents_pending` → send client checklist
- Lead moves to `lost` → schedule win/loss analysis

### 4. Document Checklist Generation
**Status:** Not Started

| Aspect | Details |
|--------|---------|
| Current State | Manual checklist creation |
| Automated State | Auto-generate based on case type |
| Implementation | Template engine based on lead metadata |
| Impact | Consistent client communication |

**Checklist Types:**
- Standard employee (single employer)
- Multiple employers
- Self-employed hybrid
- Multi-year claim

---

## 🟡 Medium Priority (Next Quarter)

### 5. Weekly KPI Dashboard
**Status:** Partially Implemented

| Aspect | Details |
|--------|---------|
| Current State | Manual data gathering |
| Automated State | Auto-generated dashboard with trends |
| Implementation | Scheduled report generation |
| Impact | Data-driven decisions |

**KPIs to Include:**
- New leads this week
- Conversion rate
- Revenue collected
- Pipeline value
- Avg processing time

### 6. Lead Scoring
**Status:** Not Started

| Aspect | Details |
|--------|---------|
| Current State | No scoring |
| Automated State | Rule-based scoring from UTM + engagement |
| Implementation | Scoring algorithm in CRM |
| Impact | Prioritize high-value leads |

**Scoring Factors:**
- UTM source (referral = +20, organic = +10, paid = +5)
- Response time (fast = +10)
- Documents uploaded (each = +5)
- Multiple years eligible (each year = +10)

### 7. WhatsApp Template Automation
**Status:** Green API Connected

| Aspect | Details |
|--------|---------|
| Current State | Manual message sending |
| Automated State | Template messages triggered by status |
| Implementation | Expand Green API integration |
| Impact | Consistent, timely communication |

**Templates:**
- Welcome message (on lead creation)
- Document request (on status change)
- Status update (on submission)
- Refund received notification

### 8. Calendar Integration
**Status:** Not Started

| Aspect | Details |
|--------|---------|
| Current State | No integrated scheduling |
| Automated State | Book meetings directly from CRM |
| Implementation | Google Calendar API |
| Impact | Streamlined scheduling |

---

## 🟢 Low Priority (Future)

### 9. Invoice Generation
| Aspect | Details |
|--------|---------|
| Current State | Manual invoice creation |
| Automated State | Auto-generate on refund received |
| Integration | Accounting software (חשבשבת, Greeninvoice) |

### 10. Refund Estimation Calculator
| Aspect | Details |
|--------|---------|
| Current State | Manual estimate or none |
| Automated State | Estimate based on income/tax data |
| Implementation | Algorithm based on tax tables |

### 11. Client Portal
| Aspect | Details |
|--------|---------|
| Current State | All communication via WhatsApp |
| Automated State | Self-service document upload + status check |
| Implementation | New frontend feature |

### 12. AI Lead Qualification
| Aspect | Details |
|--------|---------|
| Current State | Manual qualification |
| Automated State | AI analysis of lead quality |
| Implementation | LLM integration for chat analysis |

---

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [x] CRM with lead management
- [x] WhatsApp integration (Green API)
- [x] UTM tracking
- [ ] Commission calculation fields
- [ ] Basic KPI dashboard

### Phase 2: Automation (Next)
- [ ] Follow-up reminder system
- [ ] Status change webhooks
- [ ] Document checklist templates
- [ ] Lead scoring

### Phase 3: Intelligence (Future)
- [ ] Advanced analytics
- [ ] Predictive modeling
- [ ] AI-assisted workflows
- [ ] Client self-service

---

## Technical Requirements

### For High Priority Items:
1. **Supabase Triggers** - For status change events
2. **Cron Jobs** - For scheduled reminders
3. **Notification System** - Email/push for alerts
4. **Template Engine** - For document generation

### For Medium Priority Items:
1. **Google Calendar API** - OAuth setup
2. **Scoring Algorithm** - Business rules engine
3. **Reporting Module** - Automated data aggregation

---

## ROI Estimates

| Automation | Time Saved/Case | Monthly Cases | Monthly Hours Saved |
|------------|-----------------|---------------|---------------------|
| Commission calc | 5 min | 50 | 4.2 hrs |
| Follow-up reminders | 10 min | 50 | 8.3 hrs |
| Document checklist | 5 min | 50 | 4.2 hrs |
| Status notifications | 3 min | 50 | 2.5 hrs |
| **Total** | | | **19.2 hrs/month** |

*Assuming 50 cases/month. Actual savings scale with volume.*
