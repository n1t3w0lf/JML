/**
 * Employee entity representing a person in the organization
 */
export interface IEmployee {
  Id?: number;
  employeeId: string;
  fullName: string;
  email: string;
  employeeType: EmployeeType;
  department: string;
  jobTitle: string;
  manager?: IUserInfo;
  startDate: Date;
  endDate?: Date;
  officeLocation: string;
  workPhone?: string;
  employeeStatus: EmployeeStatus;
  jmlStatus: JMLStatus;
  costCenter?: string;
  division?: string;
  reportsTo?: number; // Employee ID
  rehireEligible?: boolean;
  userAccount?: IUserInfo;
  profilePhotoUrl?: string;
}

export interface IUserInfo {
  Id: number;
  Title: string;
  EMail: string;
}

export enum EmployeeType {
  FullTime = "Full-time",
  PartTime = "Part-time",
  Contractor = "Contractor",
  Intern = "Intern"
}

export enum EmployeeStatus {
  PreBoarding = "Pre-Boarding",
  Active = "Active",
  OnLeave = "On Leave",
  NoticePeriod = "Notice Period",
  Departed = "Departed"
}

export enum JMLStatus {
  None = "None",
  Onboarding = "Onboarding",
  Transfer = "Transfer",
  Offboarding = "Offboarding"
}
