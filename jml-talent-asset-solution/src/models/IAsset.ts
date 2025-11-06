import { IUserInfo } from './IEmployee';

/**
 * Asset entity representing a physical or software asset
 */
export interface IAsset {
  Id?: number;
  assetTag: string;
  assetName: string;
  assetCategory: AssetCategory;
  assetType?: string;
  manufacturer?: string;
  model?: string;
  serialNumber: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  vendor?: string;
  warrantyEndDate?: Date;
  assetStatus: AssetStatus;
  condition: AssetCondition;
  currentLocation?: string;
  assignedTo?: IUserInfo;
  assignmentDate?: Date;
  expectedReturnDate?: Date;
  assetValue?: number;
  depreciationRate?: number;
  eolDate?: Date;
  replacementDue?: Date;
  assetImageUrl?: string;
  qrCodeUrl?: string;
  barcode?: string;
  rfidTag?: string;
  notes?: string;
  specifications?: string; // JSON string
  operatingSystem?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  licenseKey?: string; // Should be encrypted
  maintenanceSchedule?: MaintenanceSchedule;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
}

export enum AssetCategory {
  Laptop = "Laptop",
  Desktop = "Desktop",
  Phone = "Phone",
  Monitor = "Monitor",
  Peripheral = "Peripheral",
  Software = "Software",
  Other = "Other"
}

export enum AssetStatus {
  InStock = "In Stock",
  Assigned = "Assigned",
  InUse = "In Use",
  InRepair = "In Repair",
  Retired = "Retired",
  Lost = "Lost"
}

export enum AssetCondition {
  New = "New",
  Good = "Good",
  Fair = "Fair",
  Poor = "Poor",
  Damaged = "Damaged"
}

export enum MaintenanceSchedule {
  Monthly = "Monthly",
  Quarterly = "Quarterly",
  Annual = "Annual",
  AsNeeded = "As Needed"
}

/**
 * Asset History entity for tracking asset lifecycle events
 */
export interface IAssetHistory {
  Id?: number;
  assetId: number;
  actionType: AssetActionType;
  actionDate: Date;
  performedBy: IUserInfo;
  fromEmployee?: IUserInfo;
  toEmployee?: IUserInfo;
  fromLocation?: string;
  toLocation?: string;
  conditionBefore?: AssetCondition;
  conditionAfter?: AssetCondition;
  cost?: number;
  notes?: string;
  jmlProcessId?: number;
  digitalSignatureUrl?: string;
}

export enum AssetActionType {
  Purchased = "Purchased",
  Assigned = "Assigned",
  Returned = "Returned",
  Transferred = "Transferred",
  Repaired = "Repaired",
  Retired = "Retired",
  Lost = "Lost",
  Found = "Found"
}
