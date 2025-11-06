# JML, Talent Search & Asset Tracking System
## Business Analysis & Feature Specification

**Document Version:** 1.0
**Date:** November 6, 2025
**Prepared By:** Business/Systems Analyst
**Target Platform:** SharePoint Online with SPFx

---

## Executive Summary

This document outlines the comprehensive feature set for an integrated **Joiner-Mover-Leaver (JML)**, **Talent Search**, and **Asset Tracking** system designed for SharePoint Online. This solution addresses three critical business needs: employee lifecycle management, internal talent discovery, and IT asset management.

### Business Drivers

1. **Security Compliance**: 80% of cyberattacks use identity-based methods (CrowdStrike 2025 Global Threat Report)
2. **Operational Efficiency**: Reduce manual administrative burden in HR and IT operations
3. **Talent Retention**: Improve internal mobility and employee development
4. **Asset Accountability**: Track and manage IT equipment through employee lifecycle
5. **Regulatory Compliance**: Ensure audit trails and access governance

---

## Module 1: Joiner-Mover-Leaver (JML) Management

### 1.1 Joiner (Onboarding) Features

#### Core Functionality
- **Pre-boarding Workflow**
  - Create employee record before start date
  - Trigger automated onboarding tasks
  - Generate unique employee ID
  - Assign to department, team, and manager

- **Access Provisioning**
  - Define and assign birthright access based on role
  - Automated account creation requests
  - Email account setup
  - Microsoft 365 license assignment
  - SharePoint site permissions
  - Application access requests

- **Onboarding Task Management**
  - Automated task lists for HR, IT, and Managers
  - Day 1, Week 1, Month 1, Month 3 checklists
  - Task assignment and tracking
  - Document collection (I-9, W-4, emergency contacts)
  - Equipment requisition automation

- **Welcome Package**
  - Automated welcome email generation
  - Company handbook and policies distribution
  - Org chart visualization
  - Team introduction materials
  - Training schedule assignment

#### Data Requirements
- Employee personal information
- Job title and role classification
- Department and cost center
- Manager and reporting structure
- Start date and employment type
- Office location and workspace assignment
- Contact information

#### Integration Points
- HR system (source of truth)
- Microsoft Entra ID (formerly Azure AD)
- Exchange Online
- Microsoft 365 licensing system
- Asset management module

### 1.2 Mover (Internal Transition) Features

#### Core Functionality
- **Transfer Detection**
  - Monitor HR system for role changes
  - Detect department transfers
  - Identify promotions and title changes
  - Track location changes

- **Access Review & Update**
  - Automated access rights review
  - Remove previous role access
  - Provision new role access
  - Temporary access during transition period
  - Approval workflow for access changes

- **Manager Transition**
  - Notification to old and new managers
  - Transfer of task ownership
  - Update reporting structure
  - Performance review transfer

- **Team Communication**
  - Automated announcements
  - Org chart updates
  - Directory updates
  - Email signature updates

#### Business Rules
- Grace period for old access (configurable: 0-30 days)
- Dual reporting during transition
- Asset reassignment triggers
- Training requirements for new role

### 1.3 Leaver (Offboarding) Features

#### Core Functionality
- **Departure Workflow**
  - Voluntary vs involuntary separation handling
  - Notice period tracking
  - Exit interview scheduling
  - Last day of work management

- **Access Revocation**
  - Phased access removal (immediate vs. graceful)
  - Account deactivation in Entra ID
  - Revoke Microsoft 365 licenses
  - Remove from distribution lists and teams
  - SharePoint permission cleanup
  - VPN and physical access removal

- **Knowledge Transfer**
  - Document ownership reassignment
  - Project handover tracking
  - Email forwarding setup (temporary)
  - OneDrive content preservation/transfer
  - Contact list transfer

- **Asset Recovery**
  - Equipment return checklist
  - Laptop, phone, badge retrieval
  - Software license reclamation
  - Shipping labels for remote employees

- **Final Settlements**
  - Final paycheck processing reminder
  - Benefits termination
  - 401k rollover information
  - COBRA notification

#### Compliance & Audit
- Complete audit trail of all access changes
- Document retention policy enforcement
- Legal hold management
- Exit interview data capture
- Rehire eligibility tracking

### 1.4 JML Dashboard & Reporting

#### Management Dashboard
- Active joiners/movers/leavers count
- Pending tasks by department
- Overdue items and bottlenecks
- Average onboarding time
- Average offboarding time
- Access review compliance rate

#### Reports
- Monthly JML activity summary
- Department onboarding metrics
- Access provisioning audit log
- Task completion rates
- Asset return compliance
- Rehire analytics

---

## Module 2: Talent Search & Internal Recruitment

### 2.1 Employee Skills Database

#### Core Features
- **Skills Catalog**
  - Centralized skills taxonomy
  - Technical skills (programming languages, tools, platforms)
  - Soft skills (leadership, communication, project management)
  - Certifications and licenses
  - Languages spoken
  - Industry expertise

- **Proficiency Levels**
  - Beginner, Intermediate, Advanced, Expert
  - Self-assessment with manager validation
  - Time-based skill tracking (years of experience)
  - Project-based evidence linking

- **Skills Management**
  - Employee self-service skill updates
  - Manager endorsements
  - Peer endorsements
  - Skill expiration tracking (certifications)
  - Skill gap identification

#### Data Model
- Employee profile linkage
- Skill name and category
- Proficiency level
- Acquisition date
- Last used date
- Validation status
- Supporting evidence (certificates, projects)

### 2.2 Advanced Talent Search

#### Search Capabilities
- **Multi-criteria Search**
  - Search by skills (AND/OR logic)
  - Filter by proficiency level
  - Department and location filters
  - Availability status
  - Years of experience range
  - Certification status

- **Intelligent Matching**
  - Fuzzy search for skill variations
  - Related skills suggestions
  - Boolean search operators
  - Saved search queries
  - Search history

- **Search Results**
  - Ranked by relevance
  - Skill match percentage
  - Employee availability indicator
  - Contact information
  - Current project assignments
  - Manager information

#### Privacy Controls
- Employee opt-in/opt-out for internal recruitment
- Visibility controls (department only, company-wide)
- Anonymous skill browsing
- Manager notification preferences

### 2.3 Internal Job Posting & Matching

#### Job Posting Features
- **Internal Job Board**
  - Post internal opportunities
  - Required vs. desired skills
  - Department and location
  - Salary range
  - Application deadline

- **Automated Matching**
  - Notify employees with skill matches
  - Skill gap analysis for near matches
  - Recommended training to qualify
  - Succession planning alignment

- **Application Management**
  - Internal application workflow
  - Manager notification
  - Interview scheduling
  - Feedback collection
  - Offer management

### 2.4 Career Development & Succession Planning

#### Features
- **Career Pathing**
  - Visualize career progression options
  - Skills required for target roles
  - Recommended training and development
  - Mentorship matching

- **Succession Planning**
  - Identify critical roles
  - Map potential successors
  - Readiness assessment
  - Development plans for successors

- **Training Recommendations**
  - AI-based skill gap analysis
  - Course catalog integration
  - Training enrollment tracking
  - Completion certificates

### 2.5 Talent Analytics & Reporting

#### Dashboards
- Skills inventory by department
- Skills supply vs. demand analysis
- Certification expiration tracking
- Internal mobility rates
- Time to fill internal positions
- Training ROI metrics

#### Reports
- Skills heat map
- Succession readiness
- Flight risk analysis
- High-potential employee tracking
- Department skill benchmarking

---

## Module 3: Asset Tracking System

### 3.1 Asset Catalog Management

#### Core Features
- **Asset Registration**
  - Unique asset ID generation
  - Asset category (laptop, phone, monitor, keyboard, etc.)
  - Make and model
  - Serial number
  - Purchase date and cost
  - Vendor information
  - Warranty information
  - Asset condition

- **Asset Lifecycle Tracking**
  - Purchase → Inventory → Assigned → In Use → Maintenance → Retired
  - Lifecycle status dates
  - Depreciation tracking
  - End-of-life planning

- **Asset Tagging**
  - QR code generation
  - Barcode support
  - RFID tag integration (optional)
  - Physical asset tags printing

#### Asset Categories
- Computing Equipment (laptops, desktops, tablets)
- Mobile Devices (phones, hotspots)
- Peripherals (monitors, keyboards, mice, webcams)
- Networking Equipment (routers, switches)
- Software Licenses
- Office Equipment
- Security Devices (key cards, tokens)

### 3.2 Assignment & Check-Out Management

#### Features
- **Asset Assignment**
  - Assign to employee (linked to JML)
  - Assignment date and reason
  - Expected return date
  - Assigned location tracking
  - Multi-asset assignment (kit creation)

- **Check-Out/Check-In Process**
  - Digital signature capture
  - Condition documentation (photos)
  - Accessory tracking
  - Loaner equipment management
  - Temporary assignments

- **Employee Asset View**
  - Self-service view of assigned assets
  - Asset return requests
  - Damage reporting
  - Upgrade requests

#### Automation
- Auto-assign assets during onboarding
- Auto-create return tasks during offboarding
- Manager approval workflows
- Bulk assignment capabilities

### 3.3 Maintenance & Support

#### Features
- **Maintenance Tracking**
  - Scheduled maintenance calendar
  - Repair request logging
  - Repair vendor management
  - Repair cost tracking
  - Maintenance history

- **Issue Management**
  - Employee-reported issues
  - Troubleshooting ticket integration
  - Replacement device workflow
  - Loaner device management

- **Warranty Management**
  - Warranty expiration alerts
  - Warranty claim tracking
  - Extended warranty management

### 3.4 Inventory Management

#### Features
- **Stock Management**
  - Available inventory count
  - Stock level alerts (reorder points)
  - Warehouse location tracking
  - Stock forecasting

- **Procurement Integration**
  - Purchase request generation
  - Vendor catalog
  - Purchase order tracking
  - Receiving and intake process

- **Asset Retirement**
  - Decommissioning workflow
  - Data wiping certification
  - Donation tracking
  - Recycling compliance
  - Disposal documentation

### 3.5 Asset Analytics & Reporting

#### Dashboards
- Total asset value
- Assets by status
- Assets by employee
- Assets by department
- Assets nearing EOL
- Warranty expirations
- Maintenance costs

#### Reports
- Asset utilization rates
- Cost per employee
- Asset lifecycle analysis
- Inventory turnover
- Maintenance cost analysis
- Compliance reports (audit trail)
- Missing asset reports

### 3.6 Mobile Asset Management

#### Features
- Mobile app for asset scanning
- Quick check-out/check-in
- Photo capture for condition
- Offline mode support
- Location-based asset discovery

---

## Cross-Module Integration Features

### 4.1 Unified Employee View

- Single pane of glass for employee status
- JML status + Assets + Skills in one view
- Timeline view of employee journey
- Manager dashboard for team overview

### 4.2 Automated Workflows

#### Joiner → Asset Assignment
- Automatically create asset assignment tasks
- Notify IT to prepare equipment
- Link asset assignment to onboarding checklist

#### Joiner → Skills Profile
- Automatically create employee profile in talent system
- Pre-populate skills from job description
- Prompt for self-assessment

#### Mover → Asset Reallocation
- Trigger asset review on role change
- Update asset location on office move
- Reassign department-specific equipment

#### Leaver → Asset Recovery
- Automatically create asset return tasks
- Generate return shipping label
- Track return completion
- Block final offboarding until assets returned

### 4.3 Notification System

#### Notification Types
- Email notifications
- Microsoft Teams notifications
- In-app notifications
- SMS notifications (for critical items)

#### Notification Triggers
- Task assignments
- Approaching deadlines
- Overdue items
- Status changes
- Approval requests
- System alerts

### 4.4 Approval Workflows

- Manager approvals
- HR approvals
- IT approvals
- Multi-level approval chains
- Delegation support
- Approval history tracking

### 4.5 Document Management

- Centralized document library
- Document templates (offer letters, policies)
- Version control
- Digital signatures
- Document expiration alerts
- Compliance document tracking

### 4.6 Audit & Compliance

- Complete audit trail for all actions
- User activity logging
- Change history tracking
- Compliance report generation
- Data retention policies
- GDPR compliance features
- Export capabilities for legal requests

---

## User Roles & Permissions

### Role Matrix

| Role | JML Access | Talent Access | Asset Access |
|------|-----------|---------------|--------------|
| **System Administrator** | Full admin | Full admin | Full admin |
| **HR Manager** | Full access | Full access | View only |
| **IT Manager** | View access | View only | Full access |
| **Department Manager** | View team | View & search team | View team |
| **Employee** | View self | Manage self profile | View self |
| **Recruiter** | Limited | Full search & post | None |
| **Finance** | Reports only | Reports only | Full reports |

### Detailed Permissions

#### JML Module
- **Create/Edit**: HR Manager, System Admin
- **View All**: HR Manager, Department Managers (own team)
- **Workflow Actions**: Assigned task owners
- **Reports**: HR Manager, Department Managers, Finance

#### Talent Module
- **Skills Management**: Employee (self), Manager (team)
- **Search All**: HR Manager, Recruiters, Managers
- **Job Posting**: HR Manager, Recruiters
- **Analytics**: HR Manager, Department Managers

#### Asset Module
- **Asset Management**: IT Manager, System Admin
- **Assignment**: IT Manager, System Admin
- **Check-Out/In**: IT Staff, Designated personnel
- **View Own**: All employees
- **Reports**: IT Manager, Finance, Department Managers

---

## Non-Functional Requirements

### Performance
- Page load time < 2 seconds
- Search results in < 1 second
- Support 5,000+ concurrent users
- Handle 50,000+ employee records
- Support 100,000+ asset records

### Scalability
- Multi-tenant capable
- Support for 100,000+ employees
- Horizontal scaling support

### Availability
- 99.9% uptime SLA
- Zero data loss tolerance
- Disaster recovery plan

### Security
- Role-based access control (RBAC)
- Row-level security
- Data encryption at rest
- Data encryption in transit
- Multi-factor authentication support
- Audit logging for all actions

### Usability
- Mobile responsive design
- Accessibility compliance (WCAG 2.1 AA)
- Multi-language support
- Intuitive UI/UX
- < 30 minutes training time for basic users

### Integration
- Microsoft Entra ID integration
- HR system integration (API-based)
- Microsoft Teams integration
- Power Automate workflows
- Microsoft Graph API utilization
- Exchange Online integration

### Compliance
- GDPR compliance
- SOC 2 compliance
- Data residency requirements
- Audit trail requirements
- Data retention policies

---

## Success Metrics

### JML Module KPIs
- Average onboarding time (target: < 3 days)
- Task completion rate (target: > 95%)
- Time to access provisioning (target: < 2 hours)
- Offboarding completion rate (target: 100%)
- Asset return rate (target: > 98%)

### Talent Module KPIs
- Internal hire rate (target: > 25% of positions)
- Time to fill internal positions (target: < 14 days)
- Employee engagement with skills updates (target: > 80%)
- Succession planning coverage (target: > 90% of critical roles)

### Asset Module KPIs
- Asset tracking accuracy (target: > 99%)
- Asset recovery rate (target: > 98%)
- Average time to provision equipment (target: < 1 day)
- Asset utilization rate (target: > 85%)
- Cost per employee (target: trackable trend)

---

## Future Enhancements (Phase 2)

1. **AI/ML Capabilities**
   - Predictive analytics for flight risk
   - AI-powered talent matching
   - Anomaly detection for security
   - Automated skill inference from projects

2. **Advanced Integration**
   - Learning management system integration
   - Performance management system integration
   - Applicant tracking system integration
   - Service desk integration

3. **Enhanced Mobile Experience**
   - Native mobile apps
   - Offline capabilities
   - Push notifications
   - Biometric authentication

4. **IoT Integration**
   - Real-time asset location tracking
   - Smart office integration
   - Environmental monitoring

5. **Advanced Analytics**
   - Predictive asset maintenance
   - Workforce planning analytics
   - Skills forecasting
   - Cost optimization recommendations

---

## Appendix

### Glossary
- **JML**: Joiner-Mover-Leaver
- **SPFx**: SharePoint Framework
- **Entra ID**: Microsoft Entra ID (formerly Azure AD)
- **RBAC**: Role-Based Access Control
- **GDPR**: General Data Protection Regulation
- **EOL**: End of Life

### References
- CrowdStrike 2025 Global Threat Report
- Microsoft Learn: SharePoint SPFx Documentation
- NIST Cybersecurity Framework
- ISO 27001 Standards

---

**Document End**
