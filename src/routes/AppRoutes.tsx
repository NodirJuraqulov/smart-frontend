import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BankOutlined,
  BarChartOutlined,
  CarOutlined,
  CrownOutlined,
  DashboardOutlined,
  HistoryOutlined,
  MedicineBoxOutlined,
  NumberOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

import LoginPage from '@/pages/auth/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ForbiddenPage from '@/pages/ForbiddenPage'
import AppLayout from '@/layouts/AppLayout'
import PageLoader from '@/components/PageLoader'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionRoute from '@/components/PermissionRoute'
import RoleRedirect from '@/components/RoleRedirect'
import { useAppSelector } from '@/hooks/redux'
import type { OperatorPermissions } from '@/types/permissions'

const OperatorDashboard = lazy(() => import('@/pages/operator/OperatorDashboard'))
const SessionsPage = lazy(() => import('@/pages/operator/SessionsPage'))
const ReportsPage = lazy(() => import('@/pages/operator/ReportsPage'))
const TariffsPage = lazy(() => import('@/pages/operator/TariffsPage'))
const SubscriptionsPage = lazy(
  () => import('@/pages/operator/SubscriptionsPage'),
)
const VipVehiclesPage = lazy(() => import('@/pages/operator/VipVehiclesPage'))
const ClinicDiscountPage = lazy(
  () => import('@/pages/operator/ClinicDiscountPage'),
)
const OperatorSettingsPage = lazy(() => import('@/pages/operator/SettingsPage'))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const OperatorsPage = lazy(() => import('@/pages/admin/OperatorsPage'))
const OrganizationsPage = lazy(() => import('@/pages/admin/OrganizationsPage'))
const OrganizationDetailPage = lazy(
  () => import('@/pages/admin/OrganizationDetailPage'),
)
const ActivityLogPage = lazy(() => import('@/pages/admin/ActivityLogPage'))
const PlateFormatsPage = lazy(() => import('@/pages/admin/PlateFormatsPage'))

const EntryDisplayPage = lazy(() => import('@/pages/public/EntryDisplayPage'))
const ExitDisplayPage = lazy(() => import('@/pages/public/ExitDisplayPage'))

interface OperatorMenuConfigItem {
  key: string
  icon: ReactNode
  label: string
  permission?: keyof OperatorPermissions
}

export default function AppRoutes() {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)

  const operatorRoleText =
    user?.role === 'owner'
      ? t('common.roleOwner')
      : user?.role === 'kassir'
        ? t('common.roleKassir')
        : t('common.roleOperator')
  const operatorDisplayName = user?.name?.trim() || operatorRoleText
  const operatorRoleLabel = user?.org_name
    ? `${user.org_name} (${operatorDisplayName})`
    : operatorDisplayName

  const adminMenuItems: MenuProps['items'] = [
    { key: '/admin', icon: <DashboardOutlined />, label: t('nav.dashboard') },
    {
      key: '/admin/organizations',
      icon: <BankOutlined />,
      label: t('nav.organizations'),
    },
    { key: '/admin/users', icon: <TeamOutlined />, label: t('nav.operators') },
    {
      key: '/admin/plate-formats',
      icon: <NumberOutlined />,
      label: t('nav.plateFormats'),
    },
    {
      key: '/admin/activity-logs',
      icon: <HistoryOutlined />,
      label: t('nav.activityLog'),
    },
  ]

  const operatorMenuConfig: OperatorMenuConfigItem[] = [
    {
      key: '/operator',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard'),
      permission: 'can_view_dashboard',
    },
    {
      key: '/operator/sessions',
      icon: <UnorderedListOutlined />,
      label: t('nav.sessions'),
      permission: 'can_view_sessions',
    },
    {
      key: '/operator/reports',
      icon: <BarChartOutlined />,
      label: t('nav.reports'),
      permission: 'can_view_reports',
    },
    {
      key: '/operator/tariffs',
      icon: <TagsOutlined />,
      label: t('nav.tariffs'),
      permission: 'can_view_tariffs',
    },
    {
      key: '/operator/subscriptions',
      icon: <CrownOutlined />,
      label: t('nav.subscriptions'),
      permission: 'can_view_subscriptions',
    },
    {
      key: '/operator/vip-vehicles',
      icon: <CarOutlined />,
      label: t('nav.vipVehicles'),
      permission: 'can_view_subscriptions',
    },
    {
      key: '/operator/clinic-discount',
      icon: <MedicineBoxOutlined />,
      label: t('nav.clinicDiscount'),
    },
    {
      key: '/operator/settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
      permission: 'can_view_settings',
    },
  ]

  const permissions = user?.permissions
  const bypassPermissions = user?.role === 'owner'
  const isKassir = user?.role === 'kassir'
  const operatorMenuItems: MenuProps['items'] = operatorMenuConfig
    .filter((item) => {
      if (isKassir) {
        return Boolean(item.permission && permissions?.[item.permission])
      }
      return (
        !item.permission ||
        bypassPermissions ||
        !permissions ||
        permissions[item.permission]
      )
    })
    .map(({ key, icon, label }) => ({ key, icon, label }))

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route
        path="/display/entry/:orgId"
        element={
          <Suspense fallback={<PageLoader />}>
            <EntryDisplayPage />
          </Suspense>
        }
      />
      <Route
        path="/display/exit/:orgId"
        element={
          <Suspense fallback={<PageLoader />}>
            <ExitDisplayPage />
          </Suspense>
        }
      />

      <Route
        element={
          <ProtectedRoute allowedRoles={['operator', 'owner', 'kassir']} />
        }
      >
        <Route
          path="/operator"
          element={
            <AppLayout
              menuItems={operatorMenuItems}
              roleLabel={operatorRoleLabel}
            />
          }
        >
          <Route element={<PermissionRoute permission="can_view_dashboard" />}>
            <Route index element={<OperatorDashboard />} />
          </Route>
          <Route element={<PermissionRoute permission="can_view_sessions" />}>
            <Route path="sessions" element={<SessionsPage />} />
          </Route>
          <Route element={<PermissionRoute permission="can_view_reports" />}>
            <Route path="reports" element={<ReportsPage />} />
          </Route>
          <Route element={<PermissionRoute permission="can_view_tariffs" />}>
            <Route path="tariffs" element={<TariffsPage />} />
          </Route>
          <Route
            element={<PermissionRoute permission="can_view_subscriptions" />}
          >
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="vip-vehicles" element={<VipVehiclesPage />} />
          </Route>
          <Route path="clinic-discount" element={<ClinicDiscountPage />} />
          <Route element={<PermissionRoute permission="can_view_settings" />}>
            <Route path="settings" element={<OperatorSettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route
          path="/admin"
          element={
            <AppLayout
              menuItems={adminMenuItems}
              roleLabel={t('common.roleSuperAdmin')}
            />
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<OperatorsPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route
            path="organizations/:id"
            element={<OrganizationDetailPage />}
          />
          <Route path="plate-formats" element={<PlateFormatsPage />} />
          <Route path="activity-logs" element={<ActivityLogPage />} />
        </Route>
      </Route>

      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
