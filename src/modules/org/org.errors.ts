export const OrgErrorCode = {
  ORG_INACTIVE: 'ORG_INACTIVE',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
} as const;

export type OrgErrorCode =
  typeof OrgErrorCode[keyof typeof OrgErrorCode];