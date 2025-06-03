/* eslint-disable no-unused-vars */
import { Model, Types } from "mongoose";
import { USER_ROLE } from "./user.constant";
import e from "express";

export interface BrowserInfo {
  name?: string;
  version?: string;
}

export interface OSInfo {
  name?: string;
  version?: string;
}

export interface DeviceInfo {
  model?: string;
  type?: string;
  vendor?: string;
}

export interface CPUInfo {
  architecture?: string;
}

export interface UserAgentInfo {
  browser?: BrowserInfo;
  os?: OSInfo;
  device?: DeviceInfo;
  cpu?: CPUInfo;
  ipAddress: string;
  macAddress: string;
  timestamp?: Date;
}





export interface TUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "student" | "applicant";
  status: "block" | "active"; // assuming UserStatus enum includes these
  isDeleted: boolean;
  authorized: boolean;
  address?: string;
  image?: string;
  phone?: string;
  googleUid?: string;
  otp?: string;
  refreshToken?: string;
  otpExpiry: Date;
  isUsed: boolean;
  isValided: boolean;
  isCompleted: boolean;
  userAgentInfo: UserAgentInfo[];

  // Personal Details (flattened)
  title?: string;
  firstName?: string;
  lastName?: string;
  otherName?: string;
  initial: string;
  gender?: string;
  dateOfBirth?: Date;
  nationality?: string;
  ethnicity?: string;
  customEthnicity?: string;
  countryOfBirth?: string;
  maritalStatus?: string;
  studentType?: string;
  requireVisa?: string;
  countryOfDomicile?: string;
  isBritishCitizen?: string;
  shareCode?: string;
  nationalInsuranceNumber: string;
  countryOfResidence: string;
  

  // Address Data (flattened)
  residentialAddressLine1?: string;
  residentialAddressLine2?: string;
  residentialCity?: string;
  residentialPostCode?: string;
  residentialCountry?: string;
  sameAsResidential?: boolean;
  postalAddressLine1?: string;
  postalAddressLine2?: string;
  postalCity?: string;
  postalPostCode?: string;
  postalCountry?: string;

  // Emergency Contact
  emergencyContactNumber?: string;
  emergencyEmail?: string;
  emergencyFullName?: string;
  emergencyRelationship?: string;
  emergencyAddress?: string;

  // Compliance
  startDateInUK?: Date;
  niNumber?: string;
  immigrationStatus?: string;
  ltrCode?: string;
  disability?: string;
  disabilityDetails?: string;
  benefits?: string;
  criminalConviction?: string;
  convictionDetails?: string;
  studentFinance?: string;

  // Documents
  hasPassport?: boolean;
  passportNumber?: string;
  passportExpiry?: string;
  idDocument?: string[]; // was any, updated to string[]
  hasCertificates?: boolean;
  certificatesDetails?: string;
  qualificationCertificates?: string[];
  cvResume?: string[];
  hasProofOfAddress?: boolean;
  proofOfAddressType?: string;
  proofOfAddressDate?: string;
  proofOfAddress?: string[];
  otherDocuments?: string[];
  otherDocumentsDescription?: string;

  // Employment
  isEmployed: string;
  currentEmployment?: {
    employer?: string;
    jobTitle?: string;
    startDate?: string;
    employmentType?: string;
    responsibilities?: string;
    supervisor?: string;
    contactPermission?: string;
  };
  previousEmployments?: {
    employer: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    reasonForLeaving: string;
    responsibilities: string;
    contactPermission: string;
  }[];
  hasEmploymentGaps: string;
  employmentGapsExplanation?: string;
  declaration: boolean;

  // Terms
  acceptTerms: boolean;
  acceptDataProcessing: boolean;

  // Education
  educationData: {
    institution: string;
    qualification: string;
    awardDate: Date;
    certificate?: string | null;
    transcript?: string | null;
  }[];

  // Application Data
  availableFromDate?: Date;
  source?: string;
  applicationLocation?: string;

  // Weekly Availability
  availability?: {
    [day: string]: boolean; // e.g. { Monday: true, Tuesday: false }
  };

  // Student and Pension Age
  isStudent?: boolean;
  isUnderStatePensionAge?: boolean;

  // Referral Info
  referralEmployee?: string;

  // Career Section Flags
  declarationCorrectUpload?: boolean;
  declarationContactReferee?: boolean;
  appliedBefore?: boolean;

  // Disability and Adjustment Info
  hasDisability?: boolean;
  needsReasonableAdjustment?: boolean;
  reasonableAdjustmentDetails?: string;

  // Referee Info (optional block)
  referee?: {
    name: string;
    organisation: string;
    address: string;
    relationship: string;
    otherRelationship?: string;
    email: string;
    phone: string;
  };
  documents?: {
    type: DocumentType;
    fileUrl: string; // or filePath
    customTitle?: string;
  }[];

  // TODO: Add missing `englishQualification` once structure is fully visible

  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserModel extends Model<TUser> {
  //instance methods for checking if the user exist
  isUserExists(email: string): Promise<TUser>;
  //instance methods for checking if passwords are matched
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof USER_ROLE;
