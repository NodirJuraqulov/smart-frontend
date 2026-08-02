import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/utils/apiError'
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
import SettingsCard from './SettingsCard'
import IntegrationSettingsCard from './IntegrationSettingsCard'
import CameraRelaySettingsCard from './CameraRelaySettingsCard'

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

      <SettingsCard orgId={orgId} />

      <IntegrationSettingsCard orgId={orgId} />

      <CameraRelaySettingsCard orgId={orgId} />

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
