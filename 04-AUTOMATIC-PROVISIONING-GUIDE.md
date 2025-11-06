# JML, Talent Search & Asset Tracking System
## Automatic Provisioning Guide - Complete Implementation

**Document Version:** 1.0
**Date:** November 6, 2025
**Target Audience:** SPFx Developers
**Critical:** This guide ensures ALL lists, libraries, and assets are created automatically on deployment

---

## Table of Contents

1. [Overview](#overview)
2. [Provisioning Architecture](#provisioning-architecture)
3. [Complete Implementation](#complete-implementation)
4. [List Schema Definitions](#list-schema-definitions)
5. [Testing Provisioning](#testing-provisioning)
6. [Troubleshooting](#troubleshooting)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

### What Gets Provisioned Automatically?

When the SPFx solution package (.sppkg) is deployed and installed on a SharePoint site, the following assets are **automatically created**:

✅ **12 SharePoint Lists**
- Employees Master
- JML Processes
- JML Tasks
- Skills Catalog
- Employee Skills
- Asset Inventory
- Asset History
- Internal Job Postings
- Job Applications
- Workflow Templates
- Notifications Queue
- Audit Log

✅ **3 Document Libraries**
- Employee Documents
- Asset Documentation
- Templates

✅ **Custom Site Columns**
- 100+ custom columns grouped by module

✅ **Custom Content Types**
- Employee Content Type
- Asset Content Type
- JML Process Content Type

✅ **List Views**
- Default views for all lists
- Filtered views (Active Employees, Available Assets, etc.)

---

## Provisioning Architecture

### How SharePoint SPFx Provisioning Works

```
┌─────────────────────────────────────────────────────────────┐
│  1. Developer creates XML schema files                       │
│     - elements.xml (feature definition)                      │
│     - schema-*.xml (list schemas)                           │
│     - clientsideinstance.xml (web part instances)           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Configure package-solution.json                          │
│     - Define features                                        │
│     - Reference element manifests                            │
│     - Reference element files                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Build solution (gulp bundle && gulp package-solution)    │
│     - Creates .sppkg file with embedded XML                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Upload .sppkg to App Catalog                             │
│     - Site Collection App Catalog (for site-scoped)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Install app on target site                               │
│     - SharePoint activates features                          │
│     - Feature Framework provisions assets                    │
│     - Lists/libraries are created                            │
│     - Columns are added                                      │
│     - Views are created                                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Concepts

**Feature Framework:**
- SharePoint's native mechanism for provisioning
- Uses XML to define site artifacts
- Activated when SPFx app is installed
- **Limitation:** Only works with site-scoped deployment

**Site-Scoped vs Tenant-Scoped:**
- **Site-Scoped:** Can provision lists, libraries, fields, content types
- **Tenant-Scoped:** Cannot provision (only web parts available tenant-wide)
- **Our solution:** MUST use site-scoped deployment

---

## Complete Implementation

### Step 1: Create Folder Structure

```bash
# In your SPFx solution root
mkdir -p sharepoint/assets

# Folder structure
sharepoint/
└── assets/
    ├── elements.xml                    # Main feature manifest
    ├── schema-employees.xml            # Employee Master list
    ├── schema-jml-processes.xml        # JML Processes list
    ├── schema-jml-tasks.xml            # JML Tasks list
    ├── schema-skills-catalog.xml       # Skills Catalog list
    ├── schema-employee-skills.xml      # Employee Skills junction
    ├── schema-asset-inventory.xml      # Asset Inventory list
    ├── schema-asset-history.xml        # Asset History list
    ├── schema-job-postings.xml         # Internal Job Postings
    ├── schema-job-applications.xml     # Job Applications
    ├── schema-workflow-templates.xml   # Workflow Templates
    ├── schema-notifications.xml        # Notifications Queue
    ├── schema-audit-log.xml            # Audit Log
    ├── schema-content-types.xml        # Custom content types
    ├── schema-site-columns.xml         # Site columns definition
    └── clientsideinstance.xml          # Pre-configured web parts
```

### Step 2: Configure package-solution.json

**File:** `config/package-solution.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/spfx-build/package-solution.schema.json",
  "solution": {
    "name": "jml-talent-asset-solution",
    "id": "12345678-1234-1234-1234-123456789012",
    "version": "1.0.0.0",
    "includeClientSideAssets": true,
    "isDomainIsolated": false,
    "skipFeatureDeployment": false,
    "developer": {
      "name": "Your Company IT",
      "websiteUrl": "https://www.yourcompany.com",
      "privacyUrl": "https://www.yourcompany.com/privacy",
      "termsOfUseUrl": "https://www.yourcompany.com/terms",
      "mpnId": "Undefined-1.0.0.0"
    },
    "metadata": {
      "shortDescription": {
        "default": "JML, Talent Search, and Asset Tracking Solution"
      },
      "longDescription": {
        "default": "A comprehensive solution for managing employee lifecycle (Joiner-Mover-Leaver), talent search with skills database, and IT asset tracking."
      },
      "screenshotPaths": [],
      "videoUrl": "",
      "categories": ["HR", "IT Management", "Workflow", "Tracking"]
    },
    "features": [
      {
        "title": "JML Site Columns",
        "description": "Provisions custom site columns for JML solution",
        "id": "11111111-1111-1111-1111-111111111111",
        "version": "1.0.0.0",
        "assets": {
          "elementManifests": [
            "elements.xml"
          ],
          "elementFiles": [
            "schema-site-columns.xml"
          ]
        }
      },
      {
        "title": "JML Content Types",
        "description": "Provisions custom content types",
        "id": "22222222-2222-2222-2222-222222222222",
        "version": "1.0.0.0",
        "assets": {
          "elementManifests": [
            "elements.xml"
          ],
          "elementFiles": [
            "schema-content-types.xml"
          ]
        }
      },
      {
        "title": "JML Core Lists and Libraries",
        "description": "Provisions all required SharePoint lists and libraries",
        "id": "33333333-3333-3333-3333-333333333333",
        "version": "1.0.0.0",
        "assets": {
          "elementManifests": [
            "elements.xml"
          ],
          "elementFiles": [
            "schema-employees.xml",
            "schema-jml-processes.xml",
            "schema-jml-tasks.xml",
            "schema-skills-catalog.xml",
            "schema-employee-skills.xml",
            "schema-asset-inventory.xml",
            "schema-asset-history.xml",
            "schema-job-postings.xml",
            "schema-job-applications.xml",
            "schema-workflow-templates.xml",
            "schema-notifications.xml",
            "schema-audit-log.xml"
          ]
        }
      }
    ],
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
      }
    ]
  },
  "paths": {
    "zippedPackage": "solution/jml-talent-asset-solution.sppkg"
  }
}
```

**Critical Settings:**

```json
"skipFeatureDeployment": false  // MUST be false for provisioning
"isDomainIsolated": false       // Standard SPFx solution
```

---

## List Schema Definitions

### Site Columns Definition

**File:** `sharepoint/assets/schema-site-columns.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">

  <!-- Employee Fields -->
  <Field
    ID="{A1A1A1A1-1111-1111-1111-111111111111}"
    Name="JMLEmployeeID"
    DisplayName="Employee ID"
    Type="Text"
    Required="TRUE"
    MaxLength="20"
    Indexed="TRUE"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-2222-2222-2222-222222222222}"
    Name="JMLEmployeeType"
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

  <Field
    ID="{A1A1A1A1-3333-3333-3333-333333333333}"
    Name="JMLDepartment"
    DisplayName="Department"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-4444-4444-4444-444444444444}"
    Name="JMLJobTitle"
    DisplayName="Job Title"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-5555-5555-5555-555555555555}"
    Name="JMLManager"
    DisplayName="Manager"
    Type="User"
    List="UserInfo"
    ShowField="Name"
    Required="FALSE"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-6666-6666-6666-666666666666}"
    Name="JMLStartDate"
    DisplayName="Start Date"
    Type="DateTime"
    Format="DateOnly"
    Required="FALSE"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-7777-7777-7777-777777777777}"
    Name="JMLEndDate"
    DisplayName="End Date"
    Type="DateTime"
    Format="DateOnly"
    Required="FALSE"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-8888-8888-8888-888888888888}"
    Name="JMLOfficeLocation"
    DisplayName="Office Location"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Group="JML Custom Columns" />

  <Field
    ID="{A1A1A1A1-9999-9999-9999-999999999999}"
    Name="JMLEmployeeStatus"
    DisplayName="Employee Status"
    Type="Choice"
    Required="TRUE"
    Indexed="TRUE"
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

  <Field
    ID="{A1A1A1A1-AAAA-AAAA-AAAA-AAAAAAAAAAAA}"
    Name="JMLStatus"
    DisplayName="Current JML Status"
    Type="Choice"
    Required="TRUE"
    Indexed="TRUE"
    Group="JML Custom Columns">
    <CHOICES>
      <CHOICE>None</CHOICE>
      <CHOICE>Onboarding</CHOICE>
      <CHOICE>Transfer</CHOICE>
      <CHOICE>Offboarding</CHOICE>
    </CHOICES>
    <Default>None</Default>
  </Field>

  <!-- Asset Fields -->
  <Field
    ID="{B1B1B1B1-1111-1111-1111-111111111111}"
    Name="JMLAssetTag"
    DisplayName="Asset Tag"
    Type="Text"
    Required="TRUE"
    MaxLength="50"
    Indexed="TRUE"
    Group="JML Asset Columns" />

  <Field
    ID="{B1B1B1B1-2222-2222-2222-222222222222}"
    Name="JMLAssetCategory"
    DisplayName="Asset Category"
    Type="Choice"
    Required="TRUE"
    Group="JML Asset Columns">
    <CHOICES>
      <CHOICE>Laptop</CHOICE>
      <CHOICE>Desktop</CHOICE>
      <CHOICE>Phone</CHOICE>
      <CHOICE>Monitor</CHOICE>
      <CHOICE>Peripheral</CHOICE>
      <CHOICE>Software</CHOICE>
      <CHOICE>Other</CHOICE>
    </CHOICES>
  </Field>

  <Field
    ID="{B1B1B1B1-3333-3333-3333-333333333333}"
    Name="JMLSerialNumber"
    DisplayName="Serial Number"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Indexed="TRUE"
    Group="JML Asset Columns" />

  <Field
    ID="{B1B1B1B1-4444-4444-4444-444444444444}"
    Name="JMLAssetStatus"
    DisplayName="Asset Status"
    Type="Choice"
    Required="TRUE"
    Indexed="TRUE"
    Group="JML Asset Columns">
    <CHOICES>
      <CHOICE>In Stock</CHOICE>
      <CHOICE>Assigned</CHOICE>
      <CHOICE>In Use</CHOICE>
      <CHOICE>In Repair</CHOICE>
      <CHOICE>Retired</CHOICE>
      <CHOICE>Lost</CHOICE>
    </CHOICES>
    <Default>In Stock</Default>
  </Field>

  <Field
    ID="{B1B1B1B1-5555-5555-5555-555555555555}"
    Name="JMLAssetCondition"
    DisplayName="Condition"
    Type="Choice"
    Required="TRUE"
    Group="JML Asset Columns">
    <CHOICES>
      <CHOICE>New</CHOICE>
      <CHOICE>Good</CHOICE>
      <CHOICE>Fair</CHOICE>
      <CHOICE>Poor</CHOICE>
      <CHOICE>Damaged</CHOICE>
    </CHOICES>
    <Default>Good</Default>
  </Field>

  <Field
    ID="{B1B1B1B1-6666-6666-6666-666666666666}"
    Name="JMLPurchaseCost"
    DisplayName="Purchase Cost"
    Type="Currency"
    Required="FALSE"
    Decimals="2"
    LCID="1033"
    Group="JML Asset Columns" />

  <Field
    ID="{B1B1B1B1-7777-7777-7777-777777777777}"
    Name="JMLWarrantyEndDate"
    DisplayName="Warranty End Date"
    Type="DateTime"
    Format="DateOnly"
    Required="FALSE"
    Group="JML Asset Columns" />

  <!-- Skill Fields -->
  <Field
    ID="{C1C1C1C1-1111-1111-1111-111111111111}"
    Name="JMLSkillCategory"
    DisplayName="Skill Category"
    Type="Choice"
    Required="TRUE"
    Group="JML Skill Columns">
    <CHOICES>
      <CHOICE>Technical</CHOICE>
      <CHOICE>Business</CHOICE>
      <CHOICE>Leadership</CHOICE>
      <CHOICE>Language</CHOICE>
      <CHOICE>Tools</CHOICE>
      <CHOICE>Certification</CHOICE>
    </CHOICES>
  </Field>

  <Field
    ID="{C1C1C1C1-2222-2222-2222-222222222222}"
    Name="JMLProficiencyLevel"
    DisplayName="Proficiency Level"
    Type="Choice"
    Required="TRUE"
    Group="JML Skill Columns">
    <CHOICES>
      <CHOICE>Beginner</CHOICE>
      <CHOICE>Intermediate</CHOICE>
      <CHOICE>Advanced</CHOICE>
      <CHOICE>Expert</CHOICE>
    </CHOICES>
    <Default>Beginner</Default>
  </Field>

  <Field
    ID="{C1C1C1C1-3333-3333-3333-333333333333}"
    Name="JMLYearsExperience"
    DisplayName="Years Experience"
    Type="Number"
    Required="FALSE"
    Decimals="1"
    Min="0"
    Max="50"
    Group="JML Skill Columns" />

  <!-- JML Process Fields -->
  <Field
    ID="{D1D1D1D1-1111-1111-1111-111111111111}"
    Name="JMLProcessType"
    DisplayName="Process Type"
    Type="Choice"
    Required="TRUE"
    Indexed="TRUE"
    Group="JML Process Columns">
    <CHOICES>
      <CHOICE>Onboarding</CHOICE>
      <CHOICE>Transfer</CHOICE>
      <CHOICE>Offboarding</CHOICE>
    </CHOICES>
  </Field>

  <Field
    ID="{D1D1D1D1-2222-2222-2222-222222222222}"
    Name="JMLProcessStatus"
    DisplayName="Process Status"
    Type="Choice"
    Required="TRUE"
    Indexed="TRUE"
    Group="JML Process Columns">
    <CHOICES>
      <CHOICE>Pending</CHOICE>
      <CHOICE>In Progress</CHOICE>
      <CHOICE>Completed</CHOICE>
      <CHOICE>On Hold</CHOICE>
      <CHOICE>Cancelled</CHOICE>
    </CHOICES>
    <Default>Pending</Default>
  </Field>

  <Field
    ID="{D1D1D1D1-3333-3333-3333-333333333333}"
    Name="JMLTargetCompletion"
    DisplayName="Target Completion Date"
    Type="DateTime"
    Format="DateOnly"
    Required="FALSE"
    Group="JML Process Columns" />

  <Field
    ID="{D1D1D1D1-4444-4444-4444-444444444444}"
    Name="JMLOverallProgress"
    DisplayName="Overall Progress (%)"
    Type="Number"
    Required="FALSE"
    Decimals="0"
    Min="0"
    Max="100"
    Percentage="TRUE"
    Group="JML Process Columns" />

  <!-- Add more fields as needed -->

</Elements>
```

### Complete List Schema Example: Employees Master

**File:** `sharepoint/assets/schema-employees.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">

  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Employees Master"
    Description="Central employee directory with JML status tracking"
    TemplateType="100"
    Url="Lists/EmployeesMaster"
    OnQuickLaunch="TRUE"
    QuickLaunchGroupTitle="JML System"
    RootWebOnly="FALSE">
  </ListInstance>

  <ListInstance
    Title="Employees Master"
    OnQuickLaunch="TRUE"
    TemplateType="100"
    Url="Lists/EmployeesMaster"
    Description="Central employee directory with JML status tracking"
    RootWebOnly="FALSE">

    <Data>
      <Rows>
        <!-- Optional: Add default data here -->
        <Row>
          <Field Name="Title">System Administrator</Field>
          <Field Name="JMLEmployeeID">EMP000</Field>
          <Field Name="JMLEmployeeType">Full-time</Field>
          <Field Name="JMLDepartment">IT</Field>
          <Field Name="JMLEmployeeStatus">Active</Field>
          <Field Name="JMLStatus">None</Field>
        </Row>
      </Rows>
    </Data>
  </ListInstance>

  <!-- Add Fields to Employees Master List -->
  <Field
    ID="{E1E1E1E1-1111-1111-1111-111111111111}"
    Name="JMLWorkPhone"
    DisplayName="Work Phone"
    Type="Text"
    Required="FALSE"
    List="Lists/EmployeesMaster"
    Group="JML Custom Columns" />

  <Field
    ID="{E1E1E1E1-2222-2222-2222-222222222222}"
    Name="JMLCostCenter"
    DisplayName="Cost Center"
    Type="Text"
    Required="FALSE"
    List="Lists/EmployeesMaster"
    Group="JML Custom Columns" />

  <Field
    ID="{E1E1E1E1-3333-3333-3333-333333333333}"
    Name="JMLRehireEligible"
    DisplayName="Rehire Eligible"
    Type="Boolean"
    Required="FALSE"
    List="Lists/EmployeesMaster"
    Group="JML Custom Columns">
    <Default>TRUE</Default>
  </Field>

  <!-- Create Views -->
  <View
    BaseViewID="1"
    Type="HTML"
    WebPartZoneID="Main"
    DisplayName="All Employees"
    DefaultView="TRUE"
    MobileView="TRUE"
    MobileDefaultView="TRUE"
    SetupPath="pages\viewpage.aspx"
    ImageUrl="/_layouts/15/images/generic.png"
    Url="AllItems.aspx"
    List="Lists/EmployeesMaster">
    <Query>
      <OrderBy>
        <FieldRef Name="Title" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLEmployeeID" />
      <FieldRef Name="JMLDepartment" />
      <FieldRef Name="JMLJobTitle" />
      <FieldRef Name="JMLManager" />
      <FieldRef Name="JMLEmployeeStatus" />
      <FieldRef Name="JMLStatus" />
      <FieldRef Name="Modified" />
    </ViewFields>
    <RowLimit Paged="TRUE">30</RowLimit>
    <Aggregations Value="Off" />
  </View>

  <View
    BaseViewID="2"
    Type="HTML"
    WebPartZoneID="Main"
    DisplayName="Active Employees"
    MobileView="FALSE"
    SetupPath="pages\viewpage.aspx"
    ImageUrl="/_layouts/15/images/generic.png"
    Url="ActiveEmployees.aspx"
    List="Lists/EmployeesMaster">
    <Query>
      <Where>
        <Eq>
          <FieldRef Name="JMLEmployeeStatus" />
          <Value Type="Choice">Active</Value>
        </Eq>
      </Where>
      <OrderBy>
        <FieldRef Name="JMLDepartment" Ascending="TRUE" />
        <FieldRef Name="Title" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLEmployeeID" />
      <FieldRef Name="JMLDepartment" />
      <FieldRef Name="JMLJobTitle" />
      <FieldRef Name="JMLManager" />
    </ViewFields>
    <RowLimit Paged="TRUE">50</RowLimit>
  </View>

  <View
    BaseViewID="3"
    Type="HTML"
    WebPartZoneID="Main"
    DisplayName="New Hires (Last 30 Days)"
    MobileView="FALSE"
    SetupPath="pages\viewpage.aspx"
    ImageUrl="/_layouts/15/images/generic.png"
    Url="NewHires.aspx"
    List="Lists/EmployeesMaster">
    <Query>
      <Where>
        <And>
          <Eq>
            <FieldRef Name="JMLEmployeeStatus" />
            <Value Type="Choice">Active</Value>
          </Eq>
          <Geq>
            <FieldRef Name="JMLStartDate" />
            <Value Type="DateTime">
              <Today OffsetDays="-30" />
            </Value>
          </Geq>
        </And>
      </Where>
      <OrderBy>
        <FieldRef Name="JMLStartDate" Ascending="FALSE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLEmployeeID" />
      <FieldRef Name="JMLDepartment" />
      <FieldRef Name="JMLJobTitle" />
      <FieldRef Name="JMLStartDate" />
      <FieldRef Name="JMLManager" />
    </ViewFields>
    <RowLimit Paged="TRUE">30</RowLimit>
  </View>

  <View
    BaseViewID="4"
    Type="HTML"
    WebPartZoneID="Main"
    DisplayName="By Department"
    MobileView="FALSE"
    SetupPath="pages\viewpage.aspx"
    ImageUrl="/_layouts/15/images/generic.png"
    Url="ByDepartment.aspx"
    List="Lists/EmployeesMaster">
    <Query>
      <GroupBy Collapse="TRUE" GroupLimit="30">
        <FieldRef Name="JMLDepartment" />
      </GroupBy>
      <OrderBy>
        <FieldRef Name="JMLDepartment" Ascending="TRUE" />
        <FieldRef Name="Title" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLEmployeeID" />
      <FieldRef Name="JMLJobTitle" />
      <FieldRef Name="JMLEmployeeStatus" />
    </ViewFields>
    <RowLimit Paged="TRUE">100</RowLimit>
  </View>

</Elements>
```

### List Schema: JML Processes

**File:** `sharepoint/assets/schema-jml-processes.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">

  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="JML Processes"
    Description="Track all JML processes and their stages"
    TemplateType="100"
    Url="Lists/JMLProcesses"
    OnQuickLaunch="TRUE"
    QuickLaunchGroupTitle="JML System"
    RootWebOnly="FALSE">
  </ListInstance>

  <!-- Lookup to Employees Master -->
  <Field
    ID="{F1F1F1F1-1111-1111-1111-111111111111}"
    Name="JMLEmployeeLookup"
    DisplayName="Employee"
    Type="Lookup"
    Required="TRUE"
    List="Lists/EmployeesMaster"
    ShowField="Title"
    Group="JML Process Columns" />

  <Field
    ID="{F1F1F1F1-2222-2222-2222-222222222222}"
    Name="JMLInitiatedDate"
    DisplayName="Initiated Date"
    Type="DateTime"
    Format="DateTime"
    Required="TRUE"
    Group="JML Process Columns">
    <Default>[today]</Default>
  </Field>

  <Field
    ID="{F1F1F1F1-3333-3333-3333-333333333333}"
    Name="JMLInitiatedBy"
    DisplayName="Initiated By"
    Type="User"
    Required="TRUE"
    Group="JML Process Columns">
    <Default>[Me]</Default>
  </Field>

  <Field
    ID="{F1F1F1F1-4444-4444-4444-444444444444}"
    Name="JMLPriority"
    DisplayName="Priority"
    Type="Choice"
    Required="TRUE"
    Group="JML Process Columns">
    <CHOICES>
      <CHOICE>Low</CHOICE>
      <CHOICE>Medium</CHOICE>
      <CHOICE>High</CHOICE>
      <CHOICE>Urgent</CHOICE>
    </CHOICES>
    <Default>Medium</Default>
  </Field>

  <Field
    ID="{F1F1F1F1-5555-5555-5555-555555555555}"
    Name="JMLCurrentStage"
    DisplayName="Current Stage"
    Type="Text"
    Required="FALSE"
    Group="JML Process Columns" />

  <Field
    ID="{F1F1F1F1-6666-6666-6666-666666666666}"
    Name="JMLHRAssigned"
    DisplayName="HR Assigned"
    Type="User"
    Required="FALSE"
    Group="JML Process Columns" />

  <Field
    ID="{F1F1F1F1-7777-7777-7777-777777777777}"
    Name="JMLITAssigned"
    DisplayName="IT Assigned"
    Type="User"
    Required="FALSE"
    Group="JML Process Columns" />

  <Field
    ID="{F1F1F1F1-8888-8888-8888-888888888888}"
    Name="JMLNotes"
    DisplayName="Notes"
    Type="Note"
    Required="FALSE"
    RichText="TRUE"
    NumLines="6"
    Group="JML Process Columns" />

  <Field
    ID="{F1F1F1F1-9999-9999-9999-999999999999}"
    Name="JMLAccessRevoked"
    DisplayName="Access Revoked"
    Type="Boolean"
    Required="FALSE"
    Group="JML Process Columns">
    <Default>FALSE</Default>
  </Field>

  <Field
    ID="{F1F1F1F1-AAAA-AAAA-AAAA-AAAAAAAAAAAA}"
    Name="JMLAssetsReturned"
    DisplayName="Assets Returned"
    Type="Boolean"
    Required="FALSE"
    Group="JML Process Columns">
    <Default>FALSE</Default>
  </Field>

  <!-- Views -->
  <View
    BaseViewID="1"
    Type="HTML"
    WebPartZoneID="Main"
    DisplayName="Active Processes"
    DefaultView="TRUE"
    MobileView="TRUE"
    SetupPath="pages\viewpage.aspx"
    Url="AllItems.aspx"
    List="Lists/JMLProcesses">
    <Query>
      <Where>
        <In>
          <FieldRef Name="JMLProcessStatus" />
          <Values>
            <Value Type="Choice">Pending</Value>
            <Value Type="Choice">In Progress</Value>
          </Values>
        </In>
      </Where>
      <OrderBy>
        <FieldRef Name="JMLTargetCompletion" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLProcessType" />
      <FieldRef Name="JMLEmployeeLookup" />
      <FieldRef Name="JMLProcessStatus" />
      <FieldRef Name="JMLOverallProgress" />
      <FieldRef Name="JMLTargetCompletion" />
      <FieldRef Name="JMLPriority" />
    </ViewFields>
    <RowLimit Paged="TRUE">30</RowLimit>
  </View>

  <View
    BaseViewID="2"
    Type="HTML"
    DisplayName="Onboarding Processes"
    SetupPath="pages\viewpage.aspx"
    Url="Onboarding.aspx"
    List="Lists/JMLProcesses">
    <Query>
      <Where>
        <Eq>
          <FieldRef Name="JMLProcessType" />
          <Value Type="Choice">Onboarding</Value>
        </Eq>
      </Where>
      <OrderBy>
        <FieldRef Name="JMLInitiatedDate" Ascending="FALSE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLEmployeeLookup" />
      <FieldRef Name="JMLProcessStatus" />
      <FieldRef Name="JMLOverallProgress" />
      <FieldRef Name="JMLInitiatedDate" />
    </ViewFields>
    <RowLimit Paged="TRUE">30</RowLimit>
  </View>

</Elements>
```

### List Schema: Asset Inventory

**File:** `sharepoint/assets/schema-asset-inventory.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">

  <ListInstance
    FeatureId="00bfea71-de22-43b2-a848-c05709900100"
    Title="Asset Inventory"
    Description="Master inventory of all company assets"
    TemplateType="100"
    Url="Lists/AssetInventory"
    OnQuickLaunch="TRUE"
    QuickLaunchGroupTitle="Asset Management"
    RootWebOnly="FALSE">
  </ListInstance>

  <!-- Asset-specific fields -->
  <Field
    ID="{G1G1G1G1-1111-1111-1111-111111111111}"
    Name="JMLAssetName"
    DisplayName="Asset Name"
    Type="Text"
    Required="TRUE"
    MaxLength="255"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-2222-2222-2222-222222222222}"
    Name="JMLManufacturer"
    DisplayName="Manufacturer"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-3333-3333-3333-333333333333}"
    Name="JMLModel"
    DisplayName="Model"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-4444-4444-4444-444444444444}"
    Name="JMLPurchaseDate"
    DisplayName="Purchase Date"
    Type="DateTime"
    Format="DateOnly"
    Required="FALSE"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-5555-5555-5555-555555555555}"
    Name="JMLVendor"
    DisplayName="Vendor"
    Type="Text"
    Required="FALSE"
    MaxLength="100"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-6666-6666-6666-666666666666}"
    Name="JMLCurrentLocation"
    DisplayName="Current Location"
    Type="Text"
    Required="FALSE"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-7777-7777-7777-777777777777}"
    Name="JMLAssignedTo"
    DisplayName="Assigned To"
    Type="User"
    Required="FALSE"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-8888-8888-8888-888888888888}"
    Name="JMLAssignmentDate"
    DisplayName="Assignment Date"
    Type="DateTime"
    Format="DateTime"
    Required="FALSE"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-9999-9999-9999-999999999999}"
    Name="JMLQRCode"
    DisplayName="QR Code"
    Type="URL"
    Required="FALSE"
    Format="Image"
    Group="JML Asset Columns" />

  <Field
    ID="{G1G1G1G1-AAAA-AAAA-AAAA-AAAAAAAAAAAA}"
    Name="JMLSpecs"
    DisplayName="Specifications"
    Type="Note"
    Required="FALSE"
    NumLines="6"
    Group="JML Asset Columns" />

  <!-- Views -->
  <View
    BaseViewID="1"
    Type="HTML"
    DisplayName="All Assets"
    DefaultView="TRUE"
    SetupPath="pages\viewpage.aspx"
    Url="AllItems.aspx"
    List="Lists/AssetInventory">
    <Query>
      <OrderBy>
        <FieldRef Name="JMLAssetTag" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLAssetTag" />
      <FieldRef Name="JMLAssetName" />
      <FieldRef Name="JMLAssetCategory" />
      <FieldRef Name="JMLSerialNumber" />
      <FieldRef Name="JMLAssetStatus" />
      <FieldRef Name="JMLAssignedTo" />
      <FieldRef Name="JMLAssetCondition" />
    </ViewFields>
    <RowLimit Paged="TRUE">50</RowLimit>
  </View>

  <View
    BaseViewID="2"
    Type="HTML"
    DisplayName="Available Assets"
    SetupPath="pages\viewpage.aspx"
    Url="Available.aspx"
    List="Lists/AssetInventory">
    <Query>
      <Where>
        <Eq>
          <FieldRef Name="JMLAssetStatus" />
          <Value Type="Choice">In Stock</Value>
        </Eq>
      </Where>
      <OrderBy>
        <FieldRef Name="JMLAssetCategory" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLAssetTag" />
      <FieldRef Name="JMLAssetName" />
      <FieldRef Name="JMLAssetCategory" />
      <FieldRef Name="JMLModel" />
      <FieldRef Name="JMLAssetCondition" />
    </ViewFields>
    <RowLimit Paged="TRUE">50</RowLimit>
  </View>

  <View
    BaseViewID="3"
    Type="HTML"
    DisplayName="Assigned Assets"
    SetupPath="pages\viewpage.aspx"
    Url="Assigned.aspx"
    List="Lists/AssetInventory">
    <Query>
      <Where>
        <Eq>
          <FieldRef Name="JMLAssetStatus" />
          <Value Type="Choice">Assigned</Value>
        </Eq>
      </Where>
      <OrderBy>
        <FieldRef Name="JMLAssignedTo" Ascending="TRUE" />
      </OrderBy>
    </Query>
    <ViewFields>
      <FieldRef Name="LinkTitle" />
      <FieldRef Name="JMLAssetTag" />
      <FieldRef Name="JMLAssetName" />
      <FieldRef Name="JMLAssetCategory" />
      <FieldRef Name="JMLAssignedTo" />
      <FieldRef Name="JMLAssignmentDate" />
    </ViewFields>
    <RowLimit Paged="TRUE">50</RowLimit>
  </View>

</Elements>
```

### Main Elements.xml

**File:** `sharepoint/assets/elements.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">

  <!-- Import Site Columns -->
  <ElementFile Location="schema-site-columns.xml" />

  <!-- Import Content Types (if needed) -->
  <ElementFile Location="schema-content-types.xml" />

  <!-- Import List Schemas -->
  <ElementFile Location="schema-employees.xml" />
  <ElementFile Location="schema-jml-processes.xml" />
  <ElementFile Location="schema-jml-tasks.xml" />
  <ElementFile Location="schema-skills-catalog.xml" />
  <ElementFile Location="schema-employee-skills.xml" />
  <ElementFile Location="schema-asset-inventory.xml" />
  <ElementFile Location="schema-asset-history.xml" />
  <ElementFile Location="schema-job-postings.xml" />
  <ElementFile Location="schema-job-applications.xml" />
  <ElementFile Location="schema-workflow-templates.xml" />
  <ElementFile Location="schema-notifications.xml" />
  <ElementFile Location="schema-audit-log.xml" />

  <!-- Document Libraries -->
  <ListInstance
    FeatureId="00bfea71-e717-4e80-aa17-d0c71b360101"
    Title="Employee Documents"
    Description="Employee-related documents and files"
    TemplateType="101"
    Url="EmployeeDocuments"
    OnQuickLaunch="TRUE"
    QuickLaunchGroupTitle="JML System"
    RootWebOnly="FALSE">
  </ListInstance>

  <ListInstance
    FeatureId="00bfea71-e717-4e80-aa17-d0c71b360101"
    Title="Asset Documentation"
    Description="Asset-related documents, manuals, and warranty information"
    TemplateType="101"
    Url="AssetDocumentation"
    OnQuickLaunch="TRUE"
    QuickLaunchGroupTitle="Asset Management"
    RootWebOnly="FALSE">
  </ListInstance>

  <ListInstance
    FeatureId="00bfea71-e717-4e80-aa17-d0c71b360101"
    Title="Templates"
    Description="Document templates and forms"
    TemplateType="101"
    Url="Templates"
    OnQuickLaunch="TRUE"
    QuickLaunchGroupTitle="JML System"
    RootWebOnly="FALSE">
  </ListInstance>

</Elements>
```

---

## Testing Provisioning

### Local Testing (Workbench)

**Note:** Provisioning only happens on actual deployment, not in local workbench.

```bash
# Test locally (no provisioning)
gulp serve

# Build and package for testing
gulp bundle --ship
gulp package-solution --ship
```

### Test Deployment

**Step 1: Create Test Site**

```powershell
# Connect to your tenant
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/JML-Test" -Interactive

# Or create a new site
New-PnPSite -Type TeamSite -Title "JML Test Site" -Alias "JML-Test"
```

**Step 2: Enable Site Collection App Catalog**

```powershell
# Enable site collection app catalog
Add-PnPSiteCollectionAppCatalog
```

**Step 3: Deploy Package**

```powershell
# Deploy the .sppkg file
Add-PnPApp -Path "./sharepoint/solution/jml-talent-asset-solution.sppkg" -Scope Site -Overwrite

# Install the app
Install-PnPApp -Identity "jml-talent-asset-solution" -Scope Site
```

**Step 4: Verify Provisioning**

```powershell
# Check if lists were created
Get-PnPList | Where-Object {$_.Title -like "*Employee*" -or $_.Title -like "*Asset*" -or $_.Title -like "*JML*"}

# Expected output:
# - Employees Master
# - JML Processes
# - JML Tasks
# - Asset Inventory
# - Asset History
# - etc.
```

### Verification Checklist

```powershell
# PowerShell verification script

Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/JML-Test" -Interactive

$expectedLists = @(
    "Employees Master",
    "JML Processes",
    "JML Tasks",
    "Skills Catalog",
    "Employee Skills",
    "Asset Inventory",
    "Asset History",
    "Internal Job Postings",
    "Job Applications",
    "Workflow Templates",
    "Notifications Queue",
    "Audit Log",
    "Employee Documents",
    "Asset Documentation",
    "Templates"
)

Write-Host "Verifying provisioned assets..." -ForegroundColor Yellow

foreach ($listName in $expectedLists) {
    $list = Get-PnPList -Identity "Lists/$listName" -ErrorAction SilentlyContinue

    if ($null -eq $list) {
        $list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
    }

    if ($null -ne $list) {
        Write-Host "✅ $listName" -ForegroundColor Green

        # Check field count
        $fields = Get-PnPField -List $list | Where-Object {$_.Group -like "*JML*"}
        Write-Host "   Fields: $($fields.Count) custom fields" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ $listName - NOT FOUND" -ForegroundColor Red
    }
}

Write-Host "`nVerification complete!" -ForegroundColor Yellow
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Lists Not Created

**Symptom:** App installs but lists don't appear

**Causes:**
1. `skipFeatureDeployment: true` in package-solution.json
2. Deployed to tenant app catalog instead of site collection app catalog
3. Feature not activated
4. XML syntax errors

**Solution:**

```json
// Verify package-solution.json
{
  "solution": {
    "skipFeatureDeployment": false,  // MUST be false
    // ...
  }
}
```

```powershell
# Check feature activation
Get-PnPFeature -Scope Site

# Manually activate if needed
Enable-PnPFeature -Identity "<Feature-GUID>" -Scope Site
```

#### Issue 2: XML Parsing Errors

**Symptom:** Build fails or deployment fails

**Causes:**
- Invalid XML syntax
- Missing closing tags
- Invalid GUIDs
- Invalid field types

**Solution:**

```bash
# Validate XML before building
xmllint schema-employees.xml

# Check gulp build output for errors
gulp bundle --ship
```

#### Issue 3: Lookup Fields Fail

**Symptom:** Lookup fields don't work or show errors

**Cause:** Target list doesn't exist yet (dependency order)

**Solution:**

```xml
<!-- Ensure target list is created first in elements.xml -->
<ElementFile Location="schema-employees.xml" />  <!-- Create this first -->
<ElementFile Location="schema-jml-processes.xml" /> <!-- Then this (has lookup to employees) -->
```

#### Issue 4: Views Not Appearing

**Symptom:** List created but custom views missing

**Cause:** View XML syntax error or field references

**Solution:**

```xml
<!-- Verify all FieldRef names match actual field names -->
<ViewFields>
  <FieldRef Name="JMLEmployeeID" />  <!-- Must match Field Name exactly -->
</ViewFields>
```

#### Issue 5: Fields Have Wrong Type

**Symptom:** Field created but with wrong type

**Cause:** Cannot change field type after creation

**Solution:**

```powershell
# Remove the list and re-deploy
Remove-PnPList -Identity "Employees Master" -Force
Uninstall-PnPApp -Identity "jml-talent-asset-solution"
Install-PnPApp -Identity "jml-talent-asset-solution"
```

### Debugging Tips

**1. Enable Verbose Logging**

```powershell
$DebugPreference = "Continue"
$VerbosePreference = "Continue"

# Deploy with detailed output
Add-PnPApp -Path "./solution.sppkg" -Scope Site -Overwrite -Verbose
```

**2. Check ULS Logs**

```powershell
# Get recent errors from ULS
Get-PnPUnifiedAuditLog -StartDate (Get-Date).AddHours(-1)
```

**3. Inspect Feature XML**

```powershell
# Extract .sppkg to inspect XML
Rename-Item solution.sppkg solution.zip
Expand-Archive solution.zip -DestinationPath ./extracted
# Check XML files in extracted folder
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All XML files validated
- [ ] package-solution.json configured correctly (`skipFeatureDeployment: false`)
- [ ] Build succeeds without errors
- [ ] GUIDs are unique for all fields
- [ ] Field names follow naming conventions
- [ ] Lookup dependencies are in correct order
- [ ] Views reference existing fields
- [ ] Default values are valid

### Deployment

- [ ] Site collection app catalog enabled
- [ ] .sppkg file uploaded to app catalog
- [ ] App installed on target site
- [ ] All lists created successfully
- [ ] All fields present in lists
- [ ] All views accessible
- [ ] Sample data populated (if applicable)
- [ ] Permissions configured

### Post-Deployment

- [ ] Run verification script
- [ ] Test list operations (create, read, update, delete)
- [ ] Test lookups between lists
- [ ] Test views and filters
- [ ] Test web parts can access lists
- [ ] Document any manual configurations needed
- [ ] Create deployment documentation

---

## Advanced Provisioning Techniques

### Conditional Provisioning

**Provision assets only if they don't exist:**

Unfortunately, SharePoint Feature Framework doesn't support conditional provisioning natively. However, you can create an upgrade feature:

```xml
<UpgradeActions>
  <VersionRange BeginVersion="1.0.0.0" EndVersion="2.0.0.0">
    <ApplyElementManifests>
      <ElementManifest Location="schema-new-list.xml" />
    </ApplyElementManifests>
  </VersionRange>
</UpgradeActions>
```

### Programmatic Provisioning

For more complex scenarios, use PnP Provisioning Templates:

```typescript
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/fields";

export class ProvisioningService {
  public static async ensureListsExist(): Promise<void> {
    const lists = await sp.web.lists();

    // Check if Employees Master exists
    const empList = lists.find(l => l.Title === "Employees Master");

    if (!empList) {
      // Create programmatically
      await sp.web.lists.add("Employees Master", "", 100, false, {
        OnQuickLaunch: true
      });

      // Add fields
      await sp.web.lists.getByTitle("Employees Master").fields.addText("JMLEmployeeID", {
        Required: true,
        Indexed: true
      });

      // Add more fields...
    }
  }
}
```

Call this from a web part's `onInit()`:

```typescript
protected async onInit(): Promise<void> {
  await super.onInit();

  // Ensure lists exist
  await ProvisioningService.ensureListsExist();
}
```

### PnP Provisioning Template

**Export existing site as template:**

```powershell
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/JML-Test" -Interactive

# Export site structure
Get-PnPSiteTemplate -Out JML-Template.xml -Handlers Lists,Fields,ContentTypes

# Apply to new site
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com/sites/JML-Prod" -Interactive
Invoke-PnPSiteTemplate -Path JML-Template.xml
```

---

## Summary

### Key Takeaways

1. ✅ **Site-Scoped Deployment Required** for provisioning
2. ✅ **Feature Framework** provisions assets automatically
3. ✅ **XML Schema Files** define all lists and fields
4. ✅ **package-solution.json** must reference all XML files
5. ✅ **Testing** is critical before production deployment
6. ✅ **Verification Scripts** ensure complete provisioning

### Provisioning Flow

```
XML Schemas → package-solution.json → Build → .sppkg → Site App Catalog → Install → Features Activated → Assets Created
```

### Final Notes

- Always test provisioning in development environment first
- Keep XML files organized and well-commented
- Use unique GUIDs for all fields (never reuse)
- Document any manual post-deployment steps
- Maintain version control of XML schemas
- Plan for upgrades and schema changes

---

**Document End**

This guide ensures that all SharePoint lists, libraries, fields, and views are automatically created when the SPFx solution is deployed, providing a seamless deployment experience with zero manual configuration.
