
import type { UserProfile } from './types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  legalName: '',
  email: '',
  phone: '',
  address: {
    line1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  },
  linkedin: '',
  githubUrl: '',
  portfolioUrl: '',
  workAuthorization: 'Not Specified',
  sponsorshipNow: false,
  sponsorshipFuture: true,
  startDate: '',
  willingToRelocate: 'No',
};

export const WORK_AUTHORIZATION_OPTIONS = [
  'Not Specified',
  'US Citizen',
  'Green Card',
  'H1-B',
  'OPT',
  'Other',
];

export const RELOCATION_OPTIONS = ['No', 'Yes, Anywhere', 'Yes, to specific cities'];