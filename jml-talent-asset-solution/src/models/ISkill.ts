import { IUserInfo } from './IEmployee';

/**
 * Skill entity representing a skill in the organization's catalog
 */
export interface ISkill {
  Id?: number;
  skillName: string;
  skillCategory: SkillCategory;
  subCategory?: string;
  description?: string;
  requiresCertification: boolean;
  isActive: boolean;
  relatedSkills?: number[]; // Skill IDs
  industryStandard: boolean;
}

export enum SkillCategory {
  Technical = "Technical",
  Business = "Business",
  Leadership = "Leadership",
  Language = "Language",
  Tools = "Tools",
  Certification = "Certification"
}

/**
 * Employee Skill entity representing the link between an employee and a skill
 */
export interface IEmployeeSkill {
  Id?: number;
  employeeId: number;
  skillId: number;
  proficiencyLevel: ProficiencyLevel;
  yearsExperience?: number;
  lastUsed?: Date;
  acquiredDate?: Date;
  selfAssessed: boolean;
  managerValidated: boolean;
  validatedBy?: IUserInfo;
  validationDate?: Date;
  certificationUrl?: string;
  certificationExpiry?: Date;
  evidenceProjects?: string;
  endorsementCount: number;
  isPrimarySkill: boolean;
  willingToMentor: boolean;
  interestLevel?: InterestLevel;
}

export enum ProficiencyLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
  Expert = "Expert"
}

export enum InterestLevel {
  LearnMore = "Would like to learn more",
  Maintain = "Maintain",
  Expert = "Expert"
}

/**
 * Skills search criteria
 */
export interface ISkillSearchCriteria {
  requiredSkills: number[];
  preferredSkills?: number[];
  minimumProficiency: ProficiencyLevel;
  matchType: 'exact' | 'fuzzy' | 'related';
  includeRelatedSkills: boolean;
  department?: string;
  location?: string;
  minExperience?: number;
}

/**
 * Skills search result with match score
 */
export interface ISkillSearchResult {
  employeeId: number;
  employeeName: string;
  email: string;
  department: string;
  jobTitle: string;
  matchScore: number;
  matchedSkills: IEmployeeSkill[];
  missingSkills: ISkill[];
}
