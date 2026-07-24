import type { ReactNode } from 'react'
import { Typography } from 'antd'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Typography.Title level={3} className="m-0!">
        {title}
      </Typography.Title>
      {action}
    </div>
  )
}
