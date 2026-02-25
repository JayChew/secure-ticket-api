export const OrgErrorCode = {
  ORG_INACTIVE: 'ORG_INACTIVE',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type OrgErrorCode =
  typeof OrgErrorCode[keyof typeof OrgErrorCode];