export const ACTION_LABEL_KEYS: Record<string, string> = {
  'organization.created': 'activityLog.actionOrganizationCreated',
  'organization.updated': 'activityLog.actionOrganizationUpdated',
  'organization.blocked': 'activityLog.actionOrganizationBlocked',
  'organization.unblocked': 'activityLog.actionOrganizationUnblocked',
  'operator.created': 'activityLog.actionOperatorCreated',
  'operator.updated': 'activityLog.actionOperatorUpdated',
  'operator.blocked': 'activityLog.actionOperatorBlocked',
  'operator.unblocked': 'activityLog.actionOperatorUnblocked',
  'operator.password_reset': 'activityLog.actionOperatorPasswordReset',
  'user.created': 'activityLog.actionUserCreated',
  'user.updated': 'activityLog.actionUserUpdated',
  'user.blocked': 'activityLog.actionUserBlocked',
  'user.unblocked': 'activityLog.actionUserUnblocked',
  'user.password_reset': 'activityLog.actionUserPasswordReset',
  'tariff.created': 'activityLog.actionTariffCreated',
  'tariff.updated': 'activityLog.actionTariffUpdated',
  'tariff.deleted': 'activityLog.actionTariffDeleted',
  'settings.updated': 'activityLog.actionSettingsUpdated',
  'agent_key.generated': 'activityLog.actionAgentKeyGenerated',
  'organization.integration_settings_updated':
    'activityLog.actionIntegrationSettingsUpdated',
  'organization.webhook_token_regenerated':
    'activityLog.actionWebhookTokenRegenerated',
  'session.force_closed': 'activityLog.actionSessionForceClosed',
}

const TARGET_TYPE_LABEL_KEYS: Record<string, string> = {
  organization: 'activityLog.targetOrganization',
  operator: 'activityLog.targetOperator',
  user: 'activityLog.targetUser',
  tariff: 'activityLog.targetTariff',
  settings: 'activityLog.targetSettings',
  agent_key: 'activityLog.targetAgentKey',
  session: 'activityLog.targetSession',
}

export function getActionLabel(
  t: (key: string) => string,
  action: string,
): string {
  const key = ACTION_LABEL_KEYS[action]
  return key ? t(key) : action
}

export function getTargetTypeLabel(
  t: (key: string) => string,
  targetType: string,
): string {
  const key = TARGET_TYPE_LABEL_KEYS[targetType]
  return key ? t(key) : targetType
}
