import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import {
  App as AntdApp,
  Button,
  Form,
  Result,
  Skeleton,
  Typography,
} from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import {
  createOrganizationOperator,
  getOrganizations,
  getOrgStats,
} from '@/api/organizations'
import { getOperators, resetPassword, toggleBlock } from '@/api/users'
import { getTariffs } from '@/api/tariffs'
import { getSettings, updateSettings } from '@/api/settings'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/utils/apiError'
import type { UpdateSettingsPayload } from '@/types/settings'
import type { Operator } from '@/types/user'
import ResetPasswordModal, {
  type ResetPasswordFormValues,
} from '@/pages/admin/OperatorsPage/ResetPasswordModal'
import BasicInfoCard from './BasicInfoCard'
import StatsCard from './StatsCard'
import OperatorsCard from './OperatorsCard'
import AddOperatorModal, {
  type AddOperatorFormValues,
} from './AddOperatorModal'
import PricingModeCard from './PricingModeCard'
import CapacityCard from './CapacityCard'
import PermissionsCard from './PermissionsCard'
import SettingsCard, { type SettingsFormValues } from './SettingsCard'
import IntegrationSettingsCard from './IntegrationSettingsCard'

export default function OrganizationDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const orgId = Number(id)
  const [addOperatorModalOpen, setAddOperatorModalOpen] = useState(false)
  const [resetPasswordOperator, setResetPasswordOperator] =
    useState<Operator | null>(null)
  const [addOperatorForm] = Form.useForm<AddOperatorFormValues>()
  const [resetPasswordForm] = Form.useForm<ResetPasswordFormValues>()
  const [settingsForm] = Form.useForm<SettingsFormValues>()
  const workHoursEnabled = Form.useWatch('work_hours_enabled', settingsForm)

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const organization = organizationsQuery.data?.find((org) => org.id === orgId)

  useDocumentTitle(organization?.name ?? t('orgDetail.notFound'))

  const statsQuery = useQuery({
    queryKey: ['organizations', orgId, 'stats'],
    queryFn: () => getOrgStats(orgId),
    enabled: !!orgId,
  })

  const operatorsQuery = useQuery({
    queryKey: ['operators'],
    queryFn: getOperators,
  })

  const orgOperators = useMemo(
    () => (operatorsQuery.data ?? []).filter((op) => op.org_id === orgId),
    [operatorsQuery.data, orgId],
  )

  const hasOperator = orgOperators.some((op) => op.role === 'operator')

  const invalidateOperators = () =>
    queryClient.invalidateQueries({ queryKey: ['operators'] })

  const addOperatorMutation = useMutation({
    mutationFn: (values: AddOperatorFormValues) =>
      createOrganizationOperator({ id: orgId, ...values }),
    onSuccess: () => {
      message.success(t('orgDetail.addOperatorSuccess'))
      invalidateOperators()
      setAddOperatorModalOpen(false)
      addOperatorForm.resetFields()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('orgDetail.addOperatorError')))
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetPasswordFormValues) =>
      resetPassword({ id: resetPasswordOperator!.id, ...values }),
    onSuccess: () => {
      message.success(t('operators.resetPasswordSuccess'))
      invalidateOperators()
      setResetPasswordOperator(null)
      resetPasswordForm.resetFields()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operators.resetPasswordError')))
    },
  })

  const toggleBlockMutation = useMutation({
    mutationFn: toggleBlock,
    onSuccess: () => {
      invalidateOperators()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operators.statusChangeError')))
    },
  })

  const tariffsQuery = useQuery({
    queryKey: ['tariffs', orgId],
    queryFn: () => getTariffs(orgId),
    enabled: !!orgId,
  })

  const settingsQuery = useQuery({
    queryKey: ['org-settings', orgId],
    queryFn: () => getSettings(orgId),
    enabled: !!orgId,
    retry: false,
  })

  useEffect(() => {
    const data = settingsQuery.data
    if (!data) return

    settingsForm.setFieldsValue({
      work_hours_enabled: data.work_hours_enabled,
      work_time_range:
        data.work_start && data.work_end
          ? [dayjs(data.work_start, 'HH:mm'), dayjs(data.work_end, 'HH:mm')]
          : undefined,
    })
  }, [settingsQuery.data, settingsForm])

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      updateSettings(orgId, payload),
    onSuccess: () => {
      message.success(t('orgDetail.settingsSaveSuccess'))
      queryClient.invalidateQueries({ queryKey: ['org-settings', orgId] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('orgDetail.settingsSaveError')))
    },
  })

  const handleSettingsSubmit = (values: SettingsFormValues) => {
    const payload: UpdateSettingsPayload = {
      work_hours_enabled: values.work_hours_enabled,
    }

    if (values.work_hours_enabled && values.work_time_range) {
      payload.work_start = values.work_time_range[0].format('HH:mm')
      payload.work_end = values.work_time_range[1].format('HH:mm')
    }

    updateSettingsMutation.mutate(payload)
  }

  if (organizationsQuery.isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6">
        <Result
          status="404"
          title={t('orgDetail.notFound')}
          extra={
            <Button
              type="primary"
              onClick={() => navigate('/admin/organizations')}
            >
              {t('common.back')}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/organizations')}
        >
          {t('common.back')}
        </Button>
        <Typography.Title level={3} className="m-0!">
          {organization.name}
        </Typography.Title>
      </div>

      <BasicInfoCard
        organization={organization}
        statsLoading={statsQuery.isLoading}
        isOnline={!!statsQuery.data?.is_online}
        lastHeartbeatAt={statsQuery.data?.last_heartbeat_at}
      />

      <StatsCard isLoading={statsQuery.isLoading} stats={statsQuery.data} />

      <OperatorsCard
        dataSource={orgOperators}
        loading={operatorsQuery.isLoading}
        showAddOperatorButton={!hasOperator}
        onAddOperator={() => setAddOperatorModalOpen(true)}
        onResetPassword={setResetPasswordOperator}
        onToggleBlock={(record) =>
          toggleBlockMutation.mutate({
            id: record.id,
            is_active: !record.is_active,
          })
        }
        isTogglePending={(record) =>
          toggleBlockMutation.isPending &&
          toggleBlockMutation.variables?.id === record.id
        }
      />

      <PricingModeCard
        orgId={orgId}
        pricingMode={organization.pricing_mode}
        tariff={tariffsQuery.data?.[0] ?? null}
        tariffLoading={tariffsQuery.isLoading}
      />

      <CapacityCard
        orgId={orgId}
        capacityTotal={organization.capacity_total}
      />

      <PermissionsCard orgId={orgId} />

      <SettingsCard
        isLoading={settingsQuery.isLoading}
        data={settingsQuery.data}
        form={settingsForm}
        workHoursEnabled={workHoursEnabled}
        onSubmit={handleSettingsSubmit}
        isSaving={updateSettingsMutation.isPending}
      />

      <IntegrationSettingsCard orgId={orgId} />

      <AddOperatorModal
        open={addOperatorModalOpen}
        form={addOperatorForm}
        isPending={addOperatorMutation.isPending}
        onCancel={() => {
          setAddOperatorModalOpen(false)
          addOperatorForm.resetFields()
        }}
        onSubmit={(values) => addOperatorMutation.mutate(values)}
      />

      <ResetPasswordModal
        open={!!resetPasswordOperator}
        form={resetPasswordForm}
        isPending={resetPasswordMutation.isPending}
        onCancel={() => {
          setResetPasswordOperator(null)
          resetPasswordForm.resetFields()
        }}
        onSubmit={(values) => resetPasswordMutation.mutate(values)}
      />
    </div>
  )
}
