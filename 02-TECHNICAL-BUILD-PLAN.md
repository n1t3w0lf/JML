# JML, Talent Search & Asset Tracking System
## Technical Build Plan for SPFx Development Team

**Document Version:** 1.0
**Date:** November 6, 2025
**Target Audience:** SharePoint SPFx & Microsoft Graph Developers
**Technology Stack:** SPFx 1.19+, React 18+, TypeScript 5+, Microsoft Graph API, PnPjs

---

## Table of Contents
1. [Solution Architecture](#solution-architecture)
2. [Data Model & SharePoint Lists](#data-model--sharepoint-lists)
3. [SPFx Components Structure](#spfx-components-structure)
4. [Automatic Provisioning Strategy](#automatic-provisioning-strategy)
5. [Microsoft Graph Integration](#microsoft-graph-integration)
6. [Development Phases](#development-phases)
7. [Technical Specifications](#technical-specifications)

---

## Solution Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SharePoint Online Site                       │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  JML Module    │  │ Talent Module  │  │ Asset Module   │   │
│  │  (SPFx)        │  │ (SPFx)         │  │ (SPFx)         │   │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘   │
│           │                    │                    │            │
│           └────────────────────┼────────────────────┘            │
│                                │                                 │
│  ┌─────────────────────────────┴──────────────────────────────┐ │
│  │              Shared Services Layer (SPFx)                   │ │
│  │  - Notification Service  - Workflow Service                 │ │
│  │  - Permission Service    - Audit Service                    │ │
│  └─────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
    ┌───────────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │ SharePoint Lists │  │ MS Graph API │  │ Power       │
    │ & Libraries      │  │ - Entra ID   │  │ Automate    │
    │                  │  │ - Teams      │  │ Flows       │
    └──────────────────┘  │ - People     │  └─────────────┘
                          └──────────────┘
                                  │
                          ┌───────▼────────┐
                          │  External HR   │
                          │  System API    │
                          └────────────────┘
```

### Solution Package Structure

```
jml-solution/
├── src/
│   ├── webparts/
│   │   ├── jmlDashboard/              # Main JML Dashboard
│   │   ├── employeeOnboarding/        # Joiner workflow
│   │   ├── employeeOffboarding/       # Leaver workflow
│   │   ├── employeeTransfer/          # Mover workflow
│   │   ├── talentSearch/              # Talent search interface
│   │   ├── skillsProfile/             # Employee skills management
│   │   ├── internalJobBoard/          # Job posting board
│   │   ├── assetDashboard/            # Asset management dashboard
│   │   ├── assetCheckout/             # Asset assignment interface
│   │   └── myAssets/                  # Employee self-service view
│   │
│   ├── extensions/
│   │   ├── jmlCommandSet/             # List command extensions
│   │   ├── assetFieldCustomizer/      # QR code field customizer
│   │   └── employeeHeaderExtension/   # Employee profile header
│   │
│   ├── services/
│   │   ├── JMLService.ts              # JML business logic
│   │   ├── TalentService.ts           # Talent search logic
│   │   ├── AssetService.ts            # Asset management logic
│   │   ├── NotificationService.ts     # Notification handler
│   │   ├── WorkflowService.ts         # Workflow orchestration
│   │   ├── GraphService.ts            # MS Graph operations
│   │   ├── PnPService.ts              # PnPjs wrapper
│   │   └── AuditService.ts            # Audit logging
│   │
│   ├── models/
│   │   ├── IEmployee.ts
│   │   ├── IJMLProcess.ts
│   │   ├── ISkill.ts
│   │   ├── IAsset.ts
│   │   ├── IWorkflowTask.ts
│   │   └── INotification.ts
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── EmployeeCard/
│   │   │   ├── TaskList/
│   │   │   ├── StatusBadge/
│   │   │   ├── SearchPanel/
│   │   │   ├── ApprovalPanel/
│   │   │   └── TimelineView/
│   │   │
│   │   ├── jml/
│   │   │   ├── OnboardingChecklist/
│   │   │   ├── AccessProvisioningPanel/
│   │   │   ├── OffboardingWizard/
│   │   │   └── TransferWorkflow/
│   │   │
│   │   ├── talent/
│   │   │   ├── SkillsMatrix/
│   │   │   ├── AdvancedSearch/
│   │   │   ├── JobMatchingPanel/
│   │   │   └── CareerPathVisualization/
│   │   │
│   │   └── assets/
│   │       ├── AssetGrid/
│   │       ├── CheckoutForm/
│   │       ├── QRCodeGenerator/
│   │       └── AssetTimeline/
│   │
│   ├── hooks/
│   │   ├── useEmployeeData.ts
│   │   ├── useAssetTracking.ts
│   │   ├── useWorkflowTasks.ts
│   │   └── useNotifications.ts
│   │
│   └── utils/
│       ├── dateHelpers.ts
│       ├── validators.ts
│       ├── formatters.ts
│       └── constants.ts
│
├── sharepoint/
│   └── assets/
│       ├── elements.xml              # Feature provisioning
│       ├── schema-employees.xml      # Employee list schema
│       ├── schema-jml.xml            # JML tracking list
│       ├── schema-skills.xml         # Skills catalog
│       ├── schema-assets.xml         # Asset inventory
│       ├── schema-tasks.xml          # Workflow tasks
│       └── clientsideinstance.xml    # Pre-configured web parts
│
├── config/
│   ├── package-solution.json         # Solution config
│   ├── serve.json
│   └── config.json
│
└── teams/
    └── manifest.json                 # Teams app manifest
```

---

## Data Model & SharePoint Lists

### List 1: Employees Master

**Purpose:** Central employee directory with JML status
**List Type:** Custom List
**Internal Name:** EmployeesMaster

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Employee ID | EmployeeID | Text | Yes | Unique identifier |
| Full Name | Title | Text | Yes | Default title field |
| Email | Email | Text | Yes | Work email |
| Employee Type | EmployeeType | Choice | Yes | Full-time, Part-time, Contractor, Intern |
| Department | Department | Text | Yes | |
| Job Title | JobTitle | Text | Yes | |
| Manager | Manager | Person | Yes | Lookup to Entra ID |
| Start Date | StartDate | DateTime | Yes | |
| End Date | EndDate | DateTime | No | Populated on departure |
| Office Location | OfficeLocation | Text | Yes | |
| Work Phone | WorkPhone | Text | No | |
| Employee Status | EmployeeStatus | Choice | Yes | Pre-Boarding, Active, On Leave, Notice Period, Departed |
| Current JML Status | JMLStatus | Choice | Yes | None, Onboarding, Transfer, Offboarding |
| Cost Center | CostCenter | Text | No | |
| Division | Division | Text | No | |
| Reports To | ReportsTo | Lookup | No | Manager employee ID |
| Rehire Eligible | RehireEligible | Yes/No | No | |
| User Account | UserAccount | Person | No | Linked Entra ID account |
| Profile Photo URL | ProfilePhotoURL | Hyperlink | No | Graph API photo |
| Created Date | Created | DateTime | Auto | |
| Modified Date | Modified | DateTime | Auto | |

**Views:**
- All Employees
- Active Employees
- New Hires (Last 30 Days)
- Departures (Next 30 Days)
- By Department
- By Manager

**Indexes:**
- EmployeeID
- Email
- EmployeeStatus

---

### List 2: JML Processes

**Purpose:** Track all JML processes and their stages
**List Type:** Custom List
**Internal Name:** JMLProcesses

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Process ID | Title | Text | Yes | Auto-generated: JML-YYYYMMDD-#### |
| Employee | EmployeeID | Lookup | Yes | Link to Employees Master |
| Process Type | ProcessType | Choice | Yes | Onboarding, Transfer, Offboarding |
| Process Status | ProcessStatus | Choice | Yes | Pending, In Progress, Completed, On Hold, Cancelled |
| Initiated Date | InitiatedDate | DateTime | Yes | |
| Initiated By | InitiatedBy | Person | Yes | |
| Target Completion | TargetCompletion | DateTime | Yes | |
| Actual Completion | ActualCompletion | DateTime | No | |
| Priority | Priority | Choice | Yes | Low, Medium, High, Urgent |
| Current Stage | CurrentStage | Choice | Yes | Varies by process type |
| Overall Progress | OverallProgress | Number | No | 0-100% |
| HR Assigned | HRAssigned | Person | No | |
| IT Assigned | ITAssigned | Person | No | |
| Manager | Manager | Person | Yes | |
| Department | Department | Text | Yes | |
| Notes | Notes | Multiple Lines | No | Rich text enabled |
| Blockers | Blockers | Multiple Lines | No | |
| Old Department | OldDepartment | Text | No | For transfers |
| New Department | NewDepartment | Text | No | For transfers |
| Old Job Title | OldJobTitle | Text | No | For transfers |
| New Job Title | NewJobTitle | Text | No | For transfers |
| Departure Reason | DepartureReason | Choice | No | Resignation, Termination, Retirement, End of Contract |
| Exit Interview Completed | ExitInterviewDone | Yes/No | No | |
| Access Revoked | AccessRevoked | Yes/No | No | |
| Assets Returned | AssetsReturned | Yes/No | No | |

**Views:**
- Active Processes
- My Team Processes
- Overdue Processes
- By Process Type
- Completed (Last 90 Days)

---

### List 3: JML Tasks

**Purpose:** Individual tasks within JML processes
**List Type:** Tasks List (with custom columns)
**Internal Name:** JMLTasks

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Task Title | Title | Text | Yes | |
| JML Process | JMLProcessID | Lookup | Yes | Link to JML Processes |
| Employee | EmployeeID | Lookup | Yes | Link to Employees Master |
| Task Category | TaskCategory | Choice | Yes | HR, IT, Facilities, Manager, Employee |
| Assigned To | AssignedTo | Person | Yes | |
| Task Status | Status | Choice | Yes | Not Started, In Progress, Completed, Blocked, Cancelled |
| Priority | Priority | Choice | Yes | Low, Medium, High, Critical |
| Due Date | DueDate | DateTime | Yes | |
| Completed Date | CompletedDate | DateTime | No | |
| Task Type | TaskType | Choice | Yes | Document Collection, System Access, Training, Asset Assignment, etc. |
| Depends On | DependsOn | Lookup | No | Other task IDs |
| Estimated Hours | EstimatedHours | Number | No | |
| Actual Hours | ActualHours | Number | No | |
| Completion Notes | CompletionNotes | Multiple Lines | No | |
| Auto Generated | AutoGenerated | Yes/No | No | System-generated vs. manual |
| Reminder Sent | ReminderSent | Yes/No | No | |
| SLA Deadline | SLADeadline | DateTime | No | |

**Views:**
- My Tasks
- Overdue Tasks
- By Employee
- By Category
- Completed Tasks

---

### List 4: Skills Catalog

**Purpose:** Master list of all skills in organization
**List Type:** Custom List
**Internal Name:** SkillsCatalog

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Skill Name | Title | Text | Yes | |
| Skill Category | SkillCategory | Choice | Yes | Technical, Business, Leadership, Language, Tools, Certification |
| Sub Category | SubCategory | Text | No | Programming, Cloud, PM, etc. |
| Description | Description | Multiple Lines | No | |
| Requires Certification | RequiresCertification | Yes/No | No | |
| Is Active | IsActive | Yes/No | Yes | Default: Yes |
| Related Skills | RelatedSkills | Lookup | No | Multi-select |
| Industry Standard | IndustryStandard | Yes/No | No | |
| Created By | CreatedBy | Person | Auto | |

**Views:**
- All Active Skills
- By Category
- Certification Required

---

### List 5: Employee Skills

**Purpose:** Junction table linking employees to skills
**List Type:** Custom List
**Internal Name:** EmployeeSkills

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Record ID | Title | Text | Yes | Auto: EMP###-SKILL### |
| Employee | EmployeeID | Lookup | Yes | Link to Employees Master |
| Skill | SkillID | Lookup | Yes | Link to Skills Catalog |
| Proficiency Level | ProficiencyLevel | Choice | Yes | Beginner, Intermediate, Advanced, Expert |
| Years Experience | YearsExperience | Number | No | Decimal allowed |
| Last Used | LastUsed | DateTime | No | |
| Acquired Date | AcquiredDate | DateTime | No | |
| Self Assessed | SelfAssessed | Yes/No | Yes | Default: Yes |
| Manager Validated | ManagerValidated | Yes/No | No | |
| Validated By | ValidatedBy | Person | No | |
| Validation Date | ValidationDate | DateTime | No | |
| Certification | Certification | Hyperlink | No | Link to certificate |
| Certification Expiry | CertificationExpiry | DateTime | No | |
| Evidence Projects | EvidenceProjects | Multiple Lines | No | |
| Endorsements | EndorsementCount | Number | No | |
| Is Primary Skill | IsPrimarySkill | Yes/No | No | |
| Willing to Mentor | WillingToMentor | Yes/No | No | |
| Interest Level | InterestLevel | Choice | No | Would like to learn more, Maintain, Expert |

**Views:**
- By Employee
- By Skill
- Expiring Certifications
- Expert Level Skills
- Validation Pending

---

### List 6: Asset Inventory

**Purpose:** Master inventory of all company assets
**List Type:** Custom List
**Internal Name:** AssetInventory

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Asset Tag | Title | Text | Yes | Unique: AST-###### |
| Asset Name | AssetName | Text | Yes | |
| Asset Category | AssetCategory | Choice | Yes | Laptop, Desktop, Phone, Monitor, Peripheral, Software, Other |
| Asset Type | AssetType | Text | No | MacBook Pro, iPhone 15, Dell Monitor, etc. |
| Manufacturer | Manufacturer | Text | No | |
| Model | Model | Text | No | |
| Serial Number | SerialNumber | Text | Yes | |
| Purchase Date | PurchaseDate | DateTime | No | |
| Purchase Cost | PurchaseCost | Currency | No | |
| Vendor | Vendor | Text | No | |
| Warranty End Date | WarrantyEndDate | DateTime | No | |
| Asset Status | AssetStatus | Choice | Yes | In Stock, Assigned, In Use, In Repair, Retired, Lost |
| Condition | Condition | Choice | Yes | New, Good, Fair, Poor, Damaged |
| Current Location | CurrentLocation | Text | No | |
| Assigned To | AssignedTo | Person | No | |
| Assignment Date | AssignmentDate | DateTime | No | |
| Expected Return Date | ExpectedReturnDate | DateTime | No | |
| Asset Value | AssetValue | Currency | No | Current depreciated value |
| Depreciation Rate | DepreciationRate | Number | No | Annual percentage |
| EOL Date | EOLDate | DateTime | No | End of life date |
| Replacement Due | ReplacementDue | DateTime | No | |
| Asset Image | AssetImage | Image | No | |
| QR Code | QRCode | Image | No | Auto-generated |
| Barcode | Barcode | Text | No | |
| RFID Tag | RFIDTag | Text | No | |
| Notes | Notes | Multiple Lines | No | |
| Specs | Specifications | Multiple Lines | No | JSON format for flexible specs |
| Operating System | OperatingSystem | Text | No | |
| Processor | Processor | Text | No | |
| RAM | RAM | Text | No | |
| Storage | Storage | Text | No | |
| License Key | LicenseKey | Text | No | Encrypted |
| Maintenance Schedule | MaintenanceSchedule | Choice | No | Monthly, Quarterly, Annual, As Needed |
| Last Maintenance | LastMaintenance | DateTime | No | |
| Next Maintenance | NextMaintenance | DateTime | No | |

**Views:**
- All Assets
- Available Assets
- Assigned Assets
- By Category
- Warranty Expiring
- Maintenance Due
- Retired Assets

---

### List 7: Asset History

**Purpose:** Complete audit trail of asset lifecycle
**List Type:** Custom List
**Internal Name:** AssetHistory

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| History ID | Title | Text | Yes | Auto-increment |
| Asset | AssetID | Lookup | Yes | Link to Asset Inventory |
| Action Type | ActionType | Choice | Yes | Purchased, Assigned, Returned, Transferred, Repaired, Retired, Lost, Found |
| Action Date | ActionDate | DateTime | Yes | |
| Performed By | PerformedBy | Person | Yes | |
| From Employee | FromEmployee | Person | No | |
| To Employee | ToEmployee | Person | No | |
| From Location | FromLocation | Text | No | |
| To Location | ToLocation | Text | No | |
| Condition Before | ConditionBefore | Choice | No | |
| Condition After | ConditionAfter | Choice | No | |
| Cost | Cost | Currency | No | For purchases/repairs |
| Notes | Notes | Multiple Lines | No | |
| Related JML Process | JMLProcessID | Lookup | No | |
| Digital Signature | DigitalSignature | Image | No | |

**Views:**
- Recent Activity
- By Asset
- By Employee
- By Action Type

---

### List 8: Internal Job Postings

**Purpose:** Internal job opportunities
**List Type:** Custom List
**Internal Name:** InternalJobPostings

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Job Title | Title | Text | Yes | |
| Job ID | JobID | Text | Yes | Unique |
| Department | Department | Text | Yes | |
| Location | Location | Text | Yes | |
| Job Type | JobType | Choice | Yes | Full-time, Part-time, Temporary, Contract |
| Posting Status | PostingStatus | Choice | Yes | Draft, Open, Closed, Filled, Cancelled |
| Posted Date | PostedDate | DateTime | No | |
| Application Deadline | ApplicationDeadline | DateTime | Yes | |
| Hiring Manager | HiringManager | Person | Yes | |
| Job Description | JobDescription | Multiple Lines | Yes | Rich text |
| Responsibilities | Responsibilities | Multiple Lines | Yes | |
| Required Skills | RequiredSkills | Lookup | Yes | Multi-select to Skills Catalog |
| Preferred Skills | PreferredSkills | Lookup | No | Multi-select to Skills Catalog |
| Minimum Experience | MinExperience | Number | No | Years |
| Salary Range Min | SalaryRangeMin | Currency | No | |
| Salary Range Max | SalaryRangeMax | Currency | No | |
| Education Required | EducationRequired | Text | No | |
| Certifications Required | CertificationsRequired | Multiple Lines | No | |
| Number of Openings | NumberOfOpenings | Number | Yes | Default: 1 |
| Applications Count | ApplicationsCount | Number | No | Calculated |
| Visibility | Visibility | Choice | Yes | Company-wide, Department Only, Selected Groups |
| Eligible Employees | EligibleEmployees | Person | No | Multi-select |

**Views:**
- Open Positions
- My Department
- Closing Soon
- Recently Filled

---

### List 9: Job Applications

**Purpose:** Track internal applications
**List Type:** Custom List
**Internal Name:** JobApplications

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Application ID | Title | Text | Yes | Auto |
| Job Posting | JobPostingID | Lookup | Yes | |
| Applicant | ApplicantID | Lookup | Yes | Link to Employees Master |
| Application Date | ApplicationDate | DateTime | Yes | |
| Application Status | ApplicationStatus | Choice | Yes | Submitted, Under Review, Interview Scheduled, Rejected, Offer Extended, Accepted, Declined |
| Cover Letter | CoverLetter | Multiple Lines | No | |
| Resume | Resume | Hyperlink | No | Link to OneDrive |
| Skill Match Score | SkillMatchScore | Number | No | 0-100% |
| Current Manager Notified | ManagerNotified | Yes/No | No | |
| Interview Date | InterviewDate | DateTime | No | |
| Interview Notes | InterviewNotes | Multiple Lines | No | |
| Feedback | Feedback | Multiple Lines | No | |
| Rating | Rating | Number | No | 1-5 |
| Rejection Reason | RejectionReason | Multiple Lines | No | |

---

### List 10: Workflow Templates

**Purpose:** Reusable task templates for JML processes
**List Type:** Custom List
**Internal Name:** WorkflowTemplates

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Template Name | Title | Text | Yes | |
| Process Type | ProcessType | Choice | Yes | Onboarding, Transfer, Offboarding |
| Department | Department | Text | No | Blank = all departments |
| Employee Type | EmployeeType | Choice | No | Blank = all types |
| Task Order | TaskOrder | Number | Yes | Sequence |
| Task Title | TaskTitle | Text | Yes | |
| Task Description | TaskDescription | Multiple Lines | No | |
| Task Category | TaskCategory | Choice | Yes | |
| Assign To Role | AssignToRole | Choice | Yes | HR, IT, Manager, Employee, Facilities |
| Days from Start | DaysFromStart | Number | Yes | When to trigger (0 = immediately) |
| SLA Hours | SLAHours | Number | No | |
| Is Mandatory | IsMandatory | Yes/No | Yes | |
| Depends On Task | DependsOnTask | Text | No | Task order number |
| Is Active | IsActive | Yes/No | Yes | |

---

### List 11: Notifications Queue

**Purpose:** Track notification delivery
**List Type:** Custom List
**Internal Name:** NotificationsQueue

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Notification ID | Title | Text | Yes | Auto |
| Recipient | Recipient | Person | Yes | |
| Notification Type | NotificationType | Choice | Yes | Email, Teams, In-App, SMS |
| Subject | Subject | Text | Yes | |
| Message Body | MessageBody | Multiple Lines | Yes | |
| Priority | Priority | Choice | Yes | Low, Medium, High |
| Status | Status | Choice | Yes | Pending, Sent, Failed, Cancelled |
| Scheduled Send | ScheduledSend | DateTime | Yes | |
| Actual Send | ActualSend | DateTime | No | |
| Related Process | RelatedProcess | Lookup | No | |
| Related Task | RelatedTask | Lookup | No | |
| Retry Count | RetryCount | Number | No | |
| Error Message | ErrorMessage | Multiple Lines | No | |

---

### List 12: Audit Log

**Purpose:** Complete audit trail of all system actions
**List Type:** Custom List
**Internal Name:** AuditLog

#### Columns

| Display Name | Internal Name | Type | Required | Notes |
|-------------|--------------|------|----------|-------|
| Log ID | Title | Text | Yes | Auto |
| Timestamp | Timestamp | DateTime | Yes | |
| User | UserAccount | Person | Yes | |
| Action Type | ActionType | Choice | Yes | Create, Read, Update, Delete, Approve, Reject |
| Entity Type | EntityType | Choice | Yes | Employee, Asset, Skill, Job, etc. |
| Entity ID | EntityID | Text | Yes | |
| Field Changed | FieldChanged | Text | No | |
| Old Value | OldValue | Multiple Lines | No | |
| New Value | NewValue | Multiple Lines | No | |
| IP Address | IPAddress | Text | No | |
| User Agent | UserAgent | Text | No | |
| Session ID | SessionID | Text | No | |
| Related Process | RelatedProcess | Text | No | |
| Success | Success | Yes/No | Yes | |
| Error Details | ErrorDetails | Multiple Lines | No | |

---

### Document Libraries

#### Library 1: Employee Documents
- Resumes
- Offer letters
- Signed policies
- Performance reviews
- Training certificates

#### Library 2: Asset Documentation
- Purchase orders
- Invoices
- Warranty documents
- Manuals
- Maintenance records

#### Library 3: Templates
- Offer letter templates
- Policy templates
- Email templates
- Report templates

---

## SPFx Components Structure

### Web Part 1: JML Dashboard

**File:** `src/webparts/jmlDashboard/JmlDashboardWebPart.ts`

**Purpose:** Executive dashboard showing all JML activities

**Features:**
- Real-time metrics (active processes, pending tasks, overdue items)
- Process status cards (Onboarding, Transfers, Offboarding)
- Team view for managers
- Quick actions (start new process, view my tasks)
- Charts and visualizations
- Export capabilities

**React Component Structure:**
```tsx
<JmlDashboard>
  <MetricsRow>
    <MetricCard title="Active Onboardings" />
    <MetricCard title="Pending Transfers" />
    <MetricCard title="In-Progress Offboardings" />
    <MetricCard title="Overdue Tasks" />
  </MetricsRow>

  <FilterBar>
    <DateRangePicker />
    <DepartmentFilter />
    <StatusFilter />
  </FilterBar>

  <ProcessGrid>
    <ProcessCard processType="onboarding" />
    <ProcessCard processType="transfer" />
    <ProcessCard processType="offboarding" />
  </ProcessGrid>

  <TasksSection>
    <TaskList filter="myTasks" />
    <TaskList filter="teamTasks" />
  </TasksSection>

  <ChartsSection>
    <Chart type="timeline" />
    <Chart type="departmentBreakdown" />
  </ChartsSection>
</JmlDashboard>
```

**Props:**
```typescript
export interface IJmlDashboardProps {
  siteUrl: string;
  graphClient: MSGraphClientV3;
  context: WebPartContext;
  viewType: 'personal' | 'team' | 'admin';
  showCharts: boolean;
  refreshInterval: number; // milliseconds
}
```

**State Management:**
```typescript
interface IDashboardState {
  processes: IJMLProcess[];
  tasks: IWorkflowTask[];
  metrics: IMetrics;
  loading: boolean;
  error: string | null;
  filters: IFilterOptions;
}
```

---

### Web Part 2: Employee Onboarding Wizard

**File:** `src/webparts/employeeOnboarding/EmployeeOnboardingWebPart.ts`

**Purpose:** Guided wizard for creating new employee onboarding process

**Features:**
- Multi-step form (Employee Info → Department Setup → Access Requirements → Asset Assignment)
- Form validation
- Save as draft
- Template selection
- Auto-task generation
- Notification configuration

**React Component Structure:**
```tsx
<OnboardingWizard>
  <WizardProgress currentStep={currentStep} totalSteps={5} />

  <Step1_EmployeeInfo>
    <PersonSearch field="selectEmployee" />
    <TextField field="employeeId" />
    <DatePicker field="startDate" />
    <Dropdown field="employeeType" />
    <Dropdown field="department" />
    <TextField field="jobTitle" />
    <PeoplePicker field="manager" />
  </Step1_EmployeeInfo>

  <Step2_AccessRequirements>
    <CheckboxGroup title="Microsoft 365">
      <Checkbox label="Exchange Online" />
      <Checkbox label="Teams" />
      <Checkbox label="SharePoint" />
    </CheckboxGroup>
    <CheckboxGroup title="Business Applications">
      {/* Dynamic from config */}
    </CheckboxGroup>
    <CheckboxGroup title="Network Access">
      <Checkbox label="VPN" />
      <Checkbox label="WiFi" />
    </CheckboxGroup>
  </Step2_AccessRequirements>

  <Step3_AssetAssignment>
    <AssetSelector category="laptop" />
    <AssetSelector category="phone" />
    <AssetSelector category="monitor" />
    <AssetSelector category="accessories" />
  </Step3_AssetAssignment>

  <Step4_TaskReview>
    <GeneratedTaskList editable={true} />
  </Step4_TaskReview>

  <Step5_Confirmation>
    <SummaryPanel />
    <NotificationSettings />
  </Step5_Confirmation>

  <WizardActions>
    <Button onClick={handleBack}>Back</Button>
    <Button onClick={handleSaveDraft}>Save Draft</Button>
    <Button onClick={handleNext} primary>Next</Button>
  </WizardActions>
</OnboardingWizard>
```

---

### Web Part 3: Talent Search Interface

**File:** `src/webparts/talentSearch/TalentSearchWebPart.ts`

**Purpose:** Advanced search for finding talent by skills

**Features:**
- Multi-faceted search
- Boolean operators
- Skill filters with proficiency levels
- Department/location filters
- Availability status
- Results ranking
- Save searches
- Export results
- Contact employees directly

**React Component Structure:**
```tsx
<TalentSearch>
  <SearchHeader>
    <SearchBox
      placeholder="Search by skills, name, department..."
      onSearch={handleSearch}
    />
    <SavedSearches />
  </SearchHeader>

  <SearchLayout>
    <FilterPanel>
      <SkillsFilter>
        <SkillSelector multi={true} />
        <ProficiencySlider />
        <MatchOperator options={['ALL', 'ANY']} />
      </SkillsFilter>

      <DepartmentFilter />
      <LocationFilter />
      <AvailabilityFilter />
      <ExperienceRangeFilter />

      <FilterActions>
        <Button onClick={clearFilters}>Clear All</Button>
        <Button onClick={applyFilters} primary>Apply</Button>
      </FilterActions>
    </FilterPanel>

    <ResultsPanel>
      <ResultsHeader>
        <ResultsCount count={results.length} />
        <SortDropdown />
        <ViewToggle options={['grid', 'list']} />
        <ExportButton />
      </ResultsHeader>

      <ResultsList>
        {results.map(employee => (
          <EmployeeResultCard
            employee={employee}
            matchScore={employee.matchScore}
            matchedSkills={employee.matchedSkills}
            onContact={handleContact}
            onViewProfile={handleViewProfile}
          />
        ))}
      </ResultsList>

      <Pagination />
    </ResultsPanel>
  </SearchLayout>
</TalentSearch>
```

**Advanced Features:**
```typescript
// Skill matching algorithm
interface ISkillMatchOptions {
  requiredSkills: string[];
  preferredSkills: string[];
  minimumProficiency: ProficiencyLevel;
  matchType: 'exact' | 'fuzzy' | 'related';
  includeRelatedSkills: boolean;
}

// Search scoring
interface ISearchScore {
  overallScore: number; // 0-100
  requiredSkillsMatch: number;
  preferredSkillsMatch: number;
  proficiencyScore: number;
  experienceScore: number;
  availabilityBonus: number;
}
```

---

### Web Part 4: Asset Dashboard

**File:** `src/webparts/assetDashboard/AssetDashboardWebPart.ts`

**Purpose:** Comprehensive asset management interface

**Features:**
- Asset inventory grid
- Quick filters (Available, Assigned, In Repair, etc.)
- Asset check-out/check-in
- QR code generation
- Asset timeline
- Maintenance scheduling
- Bulk operations
- Reports

**React Component Structure:**
```tsx
<AssetDashboard>
  <DashboardHeader>
    <MetricsBar>
      <Metric label="Total Assets" value={totalAssets} />
      <Metric label="Available" value={available} />
      <Metric label="Assigned" value={assigned} />
      <Metric label="In Repair" value={inRepair} />
    </MetricsBar>

    <QuickActions>
      <CommandButton icon="Add" onClick={addAsset}>Add Asset</CommandButton>
      <CommandButton icon="CheckOut" onClick={checkOut}>Check Out</CommandButton>
      <CommandButton icon="Import" onClick={bulkImport}>Import</CommandButton>
      <CommandButton icon="Export" onClick={exportData}>Export</CommandButton>
    </QuickActions>
  </DashboardHeader>

  <FilterBar>
    <SearchBox />
    <Dropdown field="category" />
    <Dropdown field="status" />
    <Dropdown field="location" />
    <DateRangePicker field="purchaseDate" />
  </FilterBar>

  <AssetGrid>
    <DetailsList
      items={assets}
      columns={columns}
      selectionMode="multiple"
      onItemInvoked={handleAssetClick}
      contextualMenuItems={getContextMenuItems}
    />
  </AssetGrid>

  <AssetDetailsPanel
    isOpen={showPanel}
    asset={selectedAsset}
  >
    <AssetInfo />
    <AssetTimeline />
    <AssetHistory />
    <AssetActions />
  </AssetDetailsPanel>
</AssetDashboard>
```

---

### Web Part 5: My Assets (Employee Self-Service)

**File:** `src/webparts/myAssets/MyAssetsWebPart.ts`

**Purpose:** Employee view of their assigned assets

**Features:**
- List of assigned assets
- Asset details
- Report issues
- Request return
- View asset history
- Download documentation

**React Component Structure:**
```tsx
<MyAssets>
  <Header>
    <Title>My Assigned Assets</Title>
    <RequestButton onClick={openRequestDialog}>Request Equipment</RequestButton>
  </Header>

  <AssetsList>
    {assets.map(asset => (
      <AssetCard
        asset={asset}
        showActions={true}
      >
        <AssetImage src={asset.imageUrl} />
        <AssetDetails>
          <Label>{asset.assetName}</Label>
          <Property label="Asset Tag" value={asset.assetTag} />
          <Property label="Serial" value={asset.serialNumber} />
          <Property label="Assigned Date" value={asset.assignmentDate} />
          <Property label="Condition" value={asset.condition} />
        </AssetDetails>

        <AssetActions>
          <IconButton icon="Info" title="Details" onClick={viewDetails} />
          <IconButton icon="Warning" title="Report Issue" onClick={reportIssue} />
          <IconButton icon="ReturnKey" title="Request Return" onClick={requestReturn} />
          <IconButton icon="Download" title="Manual" onClick={downloadManual} />
        </AssetActions>

        <QRCodeDisplay code={asset.qrCode} />
      </AssetCard>
    ))}
  </AssetsList>

  <IssueDialog
    isOpen={showIssueDialog}
    asset={selectedAsset}
    onSubmit={handleIssueSubmit}
  />
</MyAssets>
```

---

### Web Part 6: Skills Profile Manager

**File:** `src/webparts/skillsProfile/SkillsProfileWebPart.ts`

**Purpose:** Employee self-service for managing skills profile

**Features:**
- Add/edit skills
- Set proficiency levels
- Upload certificates
- Link to projects
- Request endorsements
- View skill analytics
- Career path recommendations

**React Component Structure:**
```tsx
<SkillsProfile>
  <ProfileHeader>
    <EmployeeCard employee={currentEmployee} />
    <SkillsScore overallScore={skillScore} />
  </ProfileHeader>

  <SkillsSection>
    <SectionHeader>
      <Title>My Skills</Title>
      <Button onClick={addSkill}>Add Skill</Button>
    </SectionHeader>

    <SkillsMatrix view="category">
      {skillsByCategory.map(category => (
        <SkillCategoryGroup category={category}>
          {category.skills.map(skill => (
            <SkillChip
              skill={skill}
              proficiency={skill.proficiency}
              validated={skill.validated}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          ))}
        </SkillCategoryGroup>
      ))}
    </SkillsMatrix>
  </SkillsSection>

  <CertificationsSection>
    <Title>Certifications</Title>
    <CertificationsList>
      {certifications.map(cert => (
        <CertificationCard
          name={cert.name}
          issuer={cert.issuer}
          issueDate={cert.issueDate}
          expiryDate={cert.expiryDate}
          credentialUrl={cert.url}
          showExpiry Warning={isExpiringSoon(cert)}
        />
      ))}
    </CertificationsList>
  </CertificationsSection>

  <RecommendationsSection>
    <Title>Skill Recommendations</Title>
    <RecommendationsList recommendations={recommendations} />
  </RecommendationsSection>

  <SkillEditDialog
    isOpen={showDialog}
    skill={selectedSkill}
    onSave={handleSave}
  >
    <SkillSearchField />
    <ProficiencySelector />
    <YearsExperienceField />
    <LastUsedDatePicker />
    <CertificationUpload />
    <EvidenceField />
  </SkillEditDialog>
</SkillsProfile>
```

---

## Automatic Provisioning Strategy

### Package Solution Configuration

**File:** `config/package-solution.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/spfx-build/package-solution.schema.json",
  "solution": {
    "name": "jml-talent-asset-solution",
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "version": "1.0.0.0",
    "includeClientSideAssets": true,
    "isDomainIsolated": false,
    "developer": {
      "name": "Your Company",
      "websiteUrl": "https://www.yourcompany.com",
      "privacyUrl": "https://www.yourcompany.com/privacy",
      "termsOfUseUrl": "https://www.yourcompany.com/terms"
    },
    "metadata": {
      "shortDescription": {
        "default": "Comprehensive JML, Talent Search, and Asset Tracking Solution"
      },
      "longDescription": {
        "default": "A feature-rich SPFx solution for managing employee lifecycle (Joiner-Mover-Leaver), talent search with skills database, and IT asset tracking - all integrated into SharePoint Online."
      },
      "screenshotPaths": [],
      "videoUrl": "",
      "categories": ["HR", "IT Management", "Workflow"]
    },
    "features": [
      {
        "title": "JML Talent Asset Core Lists",
        "description": "Provisions all required SharePoint lists and libraries",
        "id": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
        "version": "1.0.0.0",
        "assets": {
          "elementManifests": [
            "elements.xml"
          ],
          "elementFiles": [
            "schema-employees.xml",
            "schema-jml.xml",
            "schema-skills.xml",
            "schema-assets.xml",
            "schema-tasks.xml",
            "schema-notifications.xml",
            "schema-audit.xml",
            "schema-jobs.xml"
          ]
        }
      },
      {
        "title": "JML Talent Asset Web Parts",
        "description": "Provisions pre-configured web parts on site pages",
        "id": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
        "version": "1.0.0.0",
        "assets": {
          "elementManifests": [
            "clientsideinstance.xml"
          ]
        }
      }
    ]
  },
  "paths": {
    "zippedPackage": "solution/jml-talent-asset-solution.sppkg"
  }
}
```

### Feature Framework Elements

**File:** `sharepoint/assets/elements.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">

  <!-- Employees Master List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Employees Master"
    Description="Central employee directory with JML status"
    TemplateType="100"
    Url="Lists/EmployeesMaster"
    RootWebOnly="FALSE">
    <Data>
      <Rows>
        <!-- Sample data can go here -->
      </Rows>
    </Data>
  </ListInstance>

  <!-- JML Processes List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="JML Processes"
    Description="Track all JML processes and their stages"
    TemplateType="100"
    Url="Lists/JMLProcesses"
    RootWebOnly="FALSE" />

  <!-- JML Tasks List -->
  <ListInstance
    FeatureId="00bfea71-e1c2-4e1b-a1c4-c97d30a7900a"
    Title="JML Tasks"
    Description="Individual tasks within JML processes"
    TemplateType="107"
    Url="Lists/JMLTasks"
    RootWebOnly="FALSE" />

  <!-- Skills Catalog List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Skills Catalog"
    Description="Master list of all skills in organization"
    TemplateType="100"
    Url="Lists/SkillsCatalog"
    RootWebOnly="FALSE" />

  <!-- Employee Skills List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Employee Skills"
    Description="Junction table linking employees to skills"
    TemplateType="100"
    Url="Lists/EmployeeSkills"
    RootWebOnly="FALSE" />

  <!-- Asset Inventory List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Asset Inventory"
    Description="Master inventory of all company assets"
    TemplateType="100"
    Url="Lists/AssetInventory"
    RootWebOnly="FALSE" />

  <!-- Asset History List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Asset History"
    Description="Complete audit trail of asset lifecycle"
    TemplateType="100"
    Url="Lists/AssetHistory"
    RootWebOnly="FALSE" />

  <!-- Internal Job Postings List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Internal Job Postings"
    Description="Internal job opportunities"
    TemplateType="100"
    Url="Lists/InternalJobPostings"
    RootWebOnly="FALSE" />

  <!-- Job Applications List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Job Applications"
    Description="Track internal applications"
    TemplateType="100"
    Url="Lists/JobApplications"
    RootWebOnly="FALSE" />

  <!-- Workflow Templates List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Workflow Templates"
    Description="Reusable task templates for JML processes"
    TemplateType="100"
    Url="Lists/WorkflowTemplates"
    RootWebOnly="FALSE" />

  <!-- Notifications Queue List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Notifications Queue"
    Description="Track notification delivery"
    TemplateType="100"
    Url="Lists/NotificationsQueue"
    RootWebOnly="FALSE" />

  <!-- Audit Log List -->
  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Audit Log"
    Description="Complete audit trail of all system actions"
    TemplateType="100"
    Url="Lists/AuditLog"
    RootWebOnly="FALSE" />

  <!-- Document Libraries -->
  <ListInstance
    FeatureId="00bfea71-e717-4e80-aa17-d0c71b360101"
    Title="Employee Documents"
    Description="Employee-related documents"
    TemplateType="101"
    Url="EmployeeDocuments"
    RootWebOnly="FALSE" />

  <ListInstance
    FeatureId="00bfea71-e717-4e80-aa17-d0c71b360101"
    Title="Asset Documentation"
    Description="Asset-related documents"
    TemplateType="101"
    Url="AssetDocumentation"
    RootWebOnly="FALSE" />

  <ListInstance
    FeatureId="00bfea71-e717-4e80-aa17-d0c71b360101"
    Title="Templates"
    Description="Document templates"
    TemplateType="101"
    Url="Templates"
    RootWebOnly="FALSE" />

  <!-- Custom Fields Definition -->
  <Field
    ID="{12345678-1234-1234-1234-123456789012}"
    Name="EmployeeID"
    DisplayName="Employee ID"
    Type="Text"
    Required="TRUE"
    Group="JML Custom Columns" />

  <!-- Add more field definitions here -->

</Elements>
```

### List Schema Example - Employees Master

**File:** `sharepoint/assets/schema-employees.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<List xmlns:ows="Microsoft SharePoint"
      Title="Employees Master"
      FolderCreation="FALSE"
      Direction="$Resources:Direction;"
      Url="Lists/EmployeesMaster"
      BaseType="0">
  <MetaData>
    <ContentTypes>
      <ContentTypeRef ID="0x01" />
    </ContentTypes>
    <Fields>
      <!-- Employee ID -->
      <Field
        ID="{a1b2c3d4-1111-1111-1111-111111111111}"
        Name="EmployeeID"
        DisplayName="Employee ID"
        Type="Text"
        Required="TRUE"
        Indexed="TRUE"
        Group="JML Custom Columns" />

      <!-- Email -->
      <Field
        ID="{a1b2c3d4-2222-2222-2222-222222222222}"
        Name="Email"
        DisplayName="Email"
        Type="Text"
        Required="TRUE"
        Group="JML Custom Columns" />

      <!-- Employee Type -->
      <Field
        ID="{a1b2c3d4-3333-3333-3333-333333333333}"
        Name="EmployeeType"
        DisplayName="Employee Type"
        Type="Choice"
        Required="TRUE"
        Group="JML Custom Columns">
        <CHOICES>
          <CHOICE>Full-time</CHOICE>
          <CHOICE>Part-time</CHOICE>
          <CHOICE>Contractor</CHOICE>
          <CHOICE>Intern</CHOICE>
        </CHOICES>
        <Default>Full-time</Default>
      </Field>

      <!-- Department -->
      <Field
        ID="{a1b2c3d4-4444-4444-4444-444444444444}"
        Name="Department"
        DisplayName="Department"
        Type="Text"
        Required="TRUE"
        Group="JML Custom Columns" />

      <!-- Job Title -->
      <Field
        ID="{a1b2c3d4-5555-5555-5555-555555555555}"
        Name="JobTitle"
        DisplayName="Job Title"
        Type="Text"
        Required="TRUE"
        Group="JML Custom Columns" />

      <!-- Manager -->
      <Field
        ID="{a1b2c3d4-6666-6666-6666-666666666666}"
        Name="Manager"
        DisplayName="Manager"
        Type="User"
        Required="TRUE"
        Group="JML Custom Columns" />

      <!-- Start Date -->
      <Field
        ID="{a1b2c3d4-7777-7777-7777-777777777777}"
        Name="StartDate"
        DisplayName="Start Date"
        Type="DateTime"
        Format="DateOnly"
        Required="TRUE"
        Group="JML Custom Columns" />

      <!-- End Date -->
      <Field
        ID="{a1b2c3d4-8888-8888-8888-888888888888}"
        Name="EndDate"
        DisplayName="End Date"
        Type="DateTime"
        Format="DateOnly"
        Required="FALSE"
        Group="JML Custom Columns" />

      <!-- Office Location -->
      <Field
        ID="{a1b2c3d4-9999-9999-9999-999999999999}"
        Name="OfficeLocation"
        DisplayName="Office Location"
        Type="Text"
        Required="TRUE"
        Group="JML Custom Columns" />

      <!-- Employee Status -->
      <Field
        ID="{a1b2c3d4-aaaa-aaaa-aaaa-aaaaaaaaaaaa}"
        Name="EmployeeStatus"
        DisplayName="Employee Status"
        Type="Choice"
        Required="TRUE"
        Group="JML Custom Columns">
        <CHOICES>
          <CHOICE>Pre-Boarding</CHOICE>
          <CHOICE>Active</CHOICE>
          <CHOICE>On Leave</CHOICE>
          <CHOICE>Notice Period</CHOICE>
          <CHOICE>Departed</CHOICE>
        </CHOICES>
        <Default>Active</Default>
      </Field>

      <!-- JML Status -->
      <Field
        ID="{a1b2c3d4-bbbb-bbbb-bbbb-bbbbbbbbbbbb}"
        Name="JMLStatus"
        DisplayName="Current JML Status"
        Type="Choice"
        Required="TRUE"
        Group="JML Custom Columns">
        <CHOICES>
          <CHOICE>None</CHOICE>
          <CHOICE>Onboarding</CHOICE>
          <CHOICE>Transfer</CHOICE>
          <CHOICE>Offboarding</CHOICE>
        </CHOICES>
        <Default>None</Default>
      </Field>

      <!-- More fields follow the same pattern -->

    </Fields>
    <Views>
      <View
        BaseViewID="1"
        Type="HTML"
        WebPartZoneID="Main"
        DisplayName="All Employees"
        DefaultView="TRUE"
        MobileView="TRUE"
        MobileDefaultView="TRUE"
        SetupPath="pages\viewpage.aspx"
        ImageUrl="/_layouts/images/generic.png"
        Url="AllItems.aspx">
        <Query>
          <OrderBy>
            <FieldRef Name="Title" />
          </OrderBy>
        </Query>
        <ViewFields>
          <FieldRef Name="EmployeeID" />
          <FieldRef Name="Title" />
          <FieldRef Name="Email" />
          <FieldRef Name="Department" />
          <FieldRef Name="JobTitle" />
          <FieldRef Name="Manager" />
          <FieldRef Name="EmployeeStatus" />
          <FieldRef Name="JMLStatus" />
        </ViewFields>
        <RowLimit Paged="TRUE">30</RowLimit>
      </View>

      <View
        BaseViewID="2"
        Type="HTML"
        WebPartZoneID="Main"
        DisplayName="Active Employees"
        MobileView="TRUE"
        SetupPath="pages\viewpage.aspx"
        ImageUrl="/_layouts/images/generic.png"
        Url="ActiveEmployees.aspx">
        <Query>
          <Where>
            <Eq>
              <FieldRef Name="EmployeeStatus" />
              <Value Type="Choice">Active</Value>
            </Eq>
          </Where>
          <OrderBy>
            <FieldRef Name="Department" />
            <FieldRef Name="Title" />
          </OrderBy>
        </Query>
        <ViewFields>
          <FieldRef Name="EmployeeID" />
          <FieldRef Name="Title" />
          <FieldRef Name="Email" />
          <FieldRef Name="Department" />
          <FieldRef Name="JobTitle" />
          <FieldRef Name="Manager" />
        </ViewFields>
        <RowLimit Paged="TRUE">30</RowLimit>
      </View>

      <!-- More views... -->

    </Views>
  </MetaData>
</List>
```

---

## Microsoft Graph Integration

### Graph Service Implementation

**File:** `src/services/GraphService.ts`

```typescript
import { MSGraphClientV3 } from '@microsoft/sp-http';
import { IUser, IUserPhoto, ITeamChannel } from '../models';

export class GraphService {
  private graphClient: MSGraphClientV3;

  constructor(graphClient: MSGraphClientV3) {
    this.graphClient = graphClient;
  }

  /**
   * Get user profile from Entra ID
   */
  public async getUserProfile(userPrincipalName: string): Promise<IUser> {
    try {
      const response = await this.graphClient
        .api(`/users/${userPrincipalName}`)
        .select('id,displayName,mail,jobTitle,department,officeLocation,manager')
        .expand('manager')
        .get();

      return {
        id: response.id,
        displayName: response.displayName,
        email: response.mail,
        jobTitle: response.jobTitle,
        department: response.department,
        officeLocation: response.officeLocation,
        manager: response.manager
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get user photo
   */
  public async getUserPhoto(userId: string): Promise<string> {
    try {
      const response = await this.graphClient
        .api(`/users/${userId}/photo/$value`)
        .responseType('blob')
        .get();

      const url = window.URL.createObjectURL(response);
      return url;
    } catch (error) {
      console.error('Error fetching user photo:', error);
      return null; // Return default avatar
    }
  }

  /**
   * Create user account (requires admin permissions)
   */
  public async createUser(userDetails: any): Promise<string> {
    try {
      const response = await this.graphClient
        .api('/users')
        .post({
          accountEnabled: true,
          displayName: userDetails.displayName,
          mailNickname: userDetails.mailNickname,
          userPrincipalName: userDetails.userPrincipalName,
          passwordProfile: {
            forceChangePasswordNextSignIn: true,
            password: userDetails.temporaryPassword
          },
          jobTitle: userDetails.jobTitle,
          department: userDetails.department,
          officeLocation: userDetails.officeLocation
        });

      return response.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Disable user account
   */
  public async disableUser(userId: string): Promise<void> {
    try {
      await this.graphClient
        .api(`/users/${userId}`)
        .patch({
          accountEnabled: false
        });
    } catch (error) {
      console.error('Error disabling user:', error);
      throw error;
    }
  }

  /**
   * Assign license to user
   */
  public async assignLicense(userId: string, skuId: string): Promise<void> {
    try {
      await this.graphClient
        .api(`/users/${userId}/assignLicense`)
        .post({
          addLicenses: [
            {
              disabledPlans: [],
              skuId: skuId
            }
          ],
          removeLicenses: []
        });
    } catch (error) {
      console.error('Error assigning license:', error);
      throw error;
    }
  }

  /**
   * Remove license from user
   */
  public async removeLicense(userId: string, skuId: string): Promise<void> {
    try {
      await this.graphClient
        .api(`/users/${userId}/assignLicense`)
        .post({
          addLicenses: [],
          removeLicenses: [skuId]
        });
    } catch (error) {
      console.error('Error removing license:', error);
      throw error;
    }
  }

  /**
   * Send Teams notification
   */
  public async sendTeamsNotification(
    channelId: string,
    teamId: string,
    message: string
  ): Promise<void> {
    try {
      await this.graphClient
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post({
          body: {
            content: message,
            contentType: 'html'
          }
        });
    } catch (error) {
      console.error('Error sending Teams notification:', error);
      throw error;
    }
  }

  /**
   * Add user to group
   */
  public async addUserToGroup(userId: string, groupId: string): Promise<void> {
    try {
      await this.graphClient
        .api(`/groups/${groupId}/members/$ref`)
        .post({
          '@odata.id': `https://graph.microsoft.com/v1.0/directoryObjects/${userId}`
        });
    } catch (error) {
      console.error('Error adding user to group:', error);
      throw error;
    }
  }

  /**
   * Remove user from group
   */
  public async removeUserFromGroup(userId: string, groupId: string): Promise<void> {
    try {
      await this.graphClient
        .api(`/groups/${groupId}/members/${userId}/$ref`)
        .delete();
    } catch (error) {
      console.error('Error removing user from group:', error);
      throw error;
    }
  }

  /**
   * Get user's manager
   */
  public async getUserManager(userId: string): Promise<IUser> {
    try {
      const response = await this.graphClient
        .api(`/users/${userId}/manager`)
        .get();

      return {
        id: response.id,
        displayName: response.displayName,
        email: response.mail,
        jobTitle: response.jobTitle
      };
    } catch (error) {
      console.error('Error fetching user manager:', error);
      return null;
    }
  }

  /**
   * Get user's direct reports
   */
  public async getUserDirectReports(userId: string): Promise<IUser[]> {
    try {
      const response = await this.graphClient
        .api(`/users/${userId}/directReports`)
        .get();

      return response.value.map((user: any) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.mail,
        jobTitle: user.jobTitle
      }));
    } catch (error) {
      console.error('Error fetching direct reports:', error);
      return [];
    }
  }

  /**
   * Search users
   */
  public async searchUsers(searchTerm: string): Promise<IUser[]> {
    try {
      const response = await this.graphClient
        .api('/users')
        .filter(`startswith(displayName,'${searchTerm}') or startswith(mail,'${searchTerm}')`)
        .select('id,displayName,mail,jobTitle,department')
        .top(25)
        .get();

      return response.value;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
}
```

---

## Development Phases

### Phase 1: Foundation (Weeks 1-3)

**Objective:** Setup project structure and core infrastructure

#### Week 1: Project Setup
- [ ] Initialize SPFx solution (yo @microsoft/sharepoint)
- [ ] Configure TypeScript, React, and build settings
- [ ] Setup Git repository and branching strategy
- [ ] Create solution structure (folders, services, models)
- [ ] Setup development environment
- [ ] Configure package-solution.json for provisioning
- [ ] Create base list schemas (XML files)

#### Week 2: Core Services
- [ ] Implement PnPService wrapper
- [ ] Implement GraphService
- [ ] Implement AuditService
- [ ] Implement NotificationService
- [ ] Create base models and interfaces
- [ ] Setup error handling and logging
- [ ] Create utility functions

#### Week 3: Automatic Provisioning
- [ ] Complete all list schema XML files
- [ ] Create elements.xml with feature definitions
- [ ] Test provisioning locally
- [ ] Create sample data scripts
- [ ] Document provisioning process
- [ ] Test deployment to test tenant

**Deliverables:**
- Working SPFx solution structure
- All core services implemented
- Automatic provisioning tested
- Documentation updated

---

### Phase 2: JML Module (Weeks 4-7)

**Objective:** Implement full JML functionality

#### Week 4: JML Data Layer
- [ ] Implement JMLService
- [ ] Create JML-related models
- [ ] Implement CRUD operations for JML lists
- [ ] Create workflow orchestration logic
- [ ] Implement task generation from templates

#### Week 5: Onboarding (Joiner)
- [ ] Build OnboardingWizard component
- [ ] Implement multi-step form
- [ ] Create access provisioning panel
- [ ] Integrate with GraphService
- [ ] Implement task auto-generation
- [ ] Build onboarding dashboard view

#### Week 6: Transfer (Mover) & Offboarding (Leaver)
- [ ] Build TransferWorkflow component
- [ ] Implement access review logic
- [ ] Build OffboardingWizard component
- [ ] Implement access revocation logic
- [ ] Create asset return workflow
- [ ] Build knowledge transfer features

#### Week 7: JML Dashboard
- [ ] Build JMLDashboard web part
- [ ] Implement metrics and KPIs
- [ ] Create timeline visualization
- [ ] Build task management interface
- [ ] Implement filtering and search
- [ ] Create reports

**Deliverables:**
- Complete JML module
- All three workflows (Joiner, Mover, Leaver)
- JML Dashboard
- Unit tests
- User documentation

---

### Phase 3: Talent Module (Weeks 8-11)

**Objective:** Implement talent search and skills management

#### Week 8: Skills Management
- [ ] Implement TalentService
- [ ] Build SkillsCatalog admin interface
- [ ] Create SkillsProfile web part
- [ ] Implement skill add/edit/delete
- [ ] Build proficiency assessment UI
- [ ] Create certification upload

#### Week 9: Talent Search
- [ ] Build TalentSearch web part
- [ ] Implement advanced search logic
- [ ] Create skill matching algorithm
- [ ] Build filter panel
- [ ] Implement search results ranking
- [ ] Create saved searches feature

#### Week 10: Internal Recruitment
- [ ] Build InternalJobBoard web part
- [ ] Implement job posting creation
- [ ] Create job application workflow
- [ ] Build skill matching for jobs
- [ ] Implement application tracking
- [ ] Create interview scheduling

#### Week 11: Career Development
- [ ] Build career path visualization
- [ ] Implement succession planning interface
- [ ] Create training recommendations
- [ ] Build talent analytics dashboard
- [ ] Implement skills gap analysis
- [ ] Create reports

**Deliverables:**
- Complete Talent module
- Skills management system
- Talent search interface
- Internal job board
- Analytics dashboards

---

### Phase 4: Asset Module (Weeks 12-15)

**Objective:** Implement asset tracking system

#### Week 12: Asset Management
- [ ] Implement AssetService
- [ ] Build AssetDashboard web part
- [ ] Implement asset CRUD operations
- [ ] Create asset catalog management
- [ ] Build QR code generation
- [ ] Implement barcode support

#### Week 13: Assignment & Checkout
- [ ] Build AssetCheckout component
- [ ] Implement check-out/check-in workflow
- [ ] Create digital signature capture
- [ ] Build condition documentation
- [ ] Implement loaner management
- [ ] Create bulk assignment

#### Week 14: Maintenance & Lifecycle
- [ ] Build maintenance tracking
- [ ] Implement warranty management
- [ ] Create repair workflow
- [ ] Build retirement process
- [ ] Implement depreciation calculation
- [ ] Create lifecycle analytics

#### Week 15: Employee Self-Service
- [ ] Build MyAssets web part
- [ ] Implement employee asset view
- [ ] Create issue reporting
- [ ] Build return request workflow
- [ ] Implement mobile-responsive design
- [ ] Create asset history timeline

**Deliverables:**
- Complete Asset module
- Asset management dashboard
- Check-out/check-in system
- Maintenance tracking
- Employee self-service portal

---

### Phase 5: Integration & Testing (Weeks 16-18)

**Objective:** Integrate all modules and comprehensive testing

#### Week 16: Cross-Module Integration
- [ ] Integrate JML with Asset module
- [ ] Integrate JML with Talent module
- [ ] Implement unified notification system
- [ ] Create cross-module workflows
- [ ] Build unified employee view
- [ ] Implement Power Automate flows

#### Week 17: Testing
- [ ] Unit testing (Jest)
- [ ] Integration testing
- [ ] User acceptance testing (UAT)
- [ ] Performance testing
- [ ] Security testing
- [ ] Accessibility testing (WCAG 2.1)
- [ ] Cross-browser testing

#### Week 18: Bug Fixes & Optimization
- [ ] Fix identified bugs
- [ ] Optimize performance
- [ ] Refactor code
- [ ] Update documentation
- [ ] Create deployment guide
- [ ] Prepare training materials

**Deliverables:**
- Fully integrated solution
- Test reports
- Bug fixes
- Performance optimization
- Updated documentation

---

### Phase 6: Deployment & Training (Weeks 19-20)

**Objective:** Deploy to production and train users

#### Week 19: Production Deployment
- [ ] Deploy to production tenant
- [ ] Verify automatic provisioning
- [ ] Configure permissions
- [ ] Import master data
- [ ] Setup Power Automate flows
- [ ] Configure notifications
- [ ] Verify integrations

#### Week 20: Training & Handover
- [ ] Conduct admin training
- [ ] Conduct HR user training
- [ ] Conduct IT user training
- [ ] Conduct manager training
- [ ] Conduct employee training
- [ ] Provide user guides
- [ ] Establish support process
- [ ] Monitor initial usage

**Deliverables:**
- Production deployment complete
- All users trained
- Support documentation
- Handover complete

---

## Technical Specifications

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | SharePoint Framework (SPFx) | 1.19+ |
| Frontend Library | React | 18.2+ |
| Language | TypeScript | 5.0+ |
| UI Library | Fluent UI React | 9.0+ |
| State Management | React Hooks + Context API | - |
| Data Access | PnPjs | 3.20+ |
| Graph API | Microsoft Graph Client | 3.0+ |
| Build Tool | Webpack | 5.0+ |
| Testing | Jest + React Testing Library | Latest |
| Linting | ESLint | Latest |
| Formatting | Prettier | Latest |

### Required NPM Packages

```json
{
  "dependencies": {
    "@microsoft/sp-core-library": "~1.19.0",
    "@microsoft/sp-property-pane": "~1.19.0",
    "@microsoft/sp-webpart-base": "~1.19.0",
    "@microsoft/sp-lodash-subset": "~1.19.0",
    "@microsoft/sp-office-ui-fabric-core": "~1.19.0",
    "@microsoft/sp-http": "~1.19.0",
    "@microsoft/sp-listview-extensibility": "~1.19.0",
    "@microsoft/sp-application-base": "~1.19.0",
    "@pnp/sp": "^3.20.0",
    "@pnp/graph": "^3.20.0",
    "@pnp/logging": "^3.20.0",
    "@pnp/common": "^3.20.0",
    "@pnp/odata": "^3.20.0",
    "@fluentui/react": "^9.0.0",
    "@fluentui/react-hooks": "^9.0.0",
    "@fluentui/react-icons": "^2.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "office-ui-fabric-react": "^7.204.0",
    "qrcode.react": "^3.1.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@microsoft/sp-build-web": "~1.19.0",
    "@microsoft/sp-module-interfaces": "~1.19.0",
    "@microsoft/sp-tslint-rules": "~1.19.0",
    "@microsoft/rush-stack-compiler-4.7": "0.1.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "@types/webpack-env": "~1.18.0",
    "@types/es6-promise": "0.0.33",
    "@types/jest": "^29.5.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "typescript": "4.7.4",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### SharePoint Permissions

**Required Permissions:**
```json
{
  "webApiPermissionRequests": [
    {
      "resource": "Microsoft Graph",
      "scope": "User.Read.All"
    },
    {
      "resource": "Microsoft Graph",
      "scope": "User.ReadWrite.All"
    },
    {
      "resource": "Microsoft Graph",
      "scope": "Group.ReadWrite.All"
    },
    {
      "resource": "Microsoft Graph",
      "scope": "Directory.Read.All"
    },
    {
      "resource": "Microsoft Graph",
      "scope": "ChannelMessage.Send"
    }
  ]
}
```

### Performance Requirements

- **Page Load:** < 2 seconds
- **Search Results:** < 1 second
- **List Operations:** < 500ms
- **Large Lists:** Support 5000+ items with pagination
- **Concurrent Users:** Support 5000+ simultaneous users
- **API Calls:** Implement caching (5-minute TTL)
- **Bundle Size:** < 500KB per web part

### Browser Support

- Microsoft Edge (Chromium) - Latest 2 versions
- Google Chrome - Latest 2 versions
- Mozilla Firefox - Latest 2 versions
- Safari - Latest 2 versions

### Mobile Responsiveness

- Breakpoints: 320px, 640px, 1024px, 1366px, 1920px
- Touch-friendly UI (44px minimum tap targets)
- Progressive Web App (PWA) capabilities

---

## Next Steps

1. **Review and Approval:** Present this plan to stakeholders
2. **Environment Setup:** Provision development, test, and production tenants
3. **Team Assembly:** Assign developers to modules
4. **Sprint Planning:** Break down phases into 2-week sprints
5. **Kick-off Meeting:** Align team on architecture and standards
6. **Begin Phase 1:** Start with foundation work

---

**Document End**

This technical build plan provides a complete roadmap for SPFx developers to implement the JML, Talent Search, and Asset Tracking solution with automatic provisioning of all SharePoint artifacts.
