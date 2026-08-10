import { Col, Row } from 'antd'
import RolePermissionsCard from './RolePermissionsCard'

interface PermissionsCardProps {
  orgId: number
}

export default function PermissionsCard({ orgId }: PermissionsCardProps) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <RolePermissionsCard orgId={orgId} role="operator" />
      </Col>
      <Col xs={24} lg={12}>
        <RolePermissionsCard orgId={orgId} role="kassir" />
      </Col>
    </Row>
  )
}
