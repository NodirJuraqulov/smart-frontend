import { Spin } from 'antd'

export default function PageLoader() {
  return (
    <div className="flex min-h-100 w-full items-center justify-center p-6">
      <Spin size="large" />
    </div>
  )
}
