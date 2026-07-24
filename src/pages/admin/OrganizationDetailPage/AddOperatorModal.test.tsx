import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Form } from 'antd'
import AddOperatorModal, {
  type AddOperatorFormValues,
} from './AddOperatorModal'

function Harness({ onSubmit }: { onSubmit: (values: AddOperatorFormValues) => void }) {
  const [form] = Form.useForm<AddOperatorFormValues>()
  return (
    <AddOperatorModal
      open
      form={form}
      isPending={false}
      onCancel={() => {}}
      onSubmit={onSubmit}
    />
  )
}

describe('AddOperatorModal', () => {
  it("to'liq maydonlar bilan onSubmit chaqiriladi (regression)", async () => {
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)

    fireEvent.change(screen.getByPlaceholderText('Ism familiya'), {
      target: { value: 'Bekzod Yusupov' },
    })
    fireEvent.change(screen.getByPlaceholderText('Login'), {
      target: { value: 'bekzod1' },
    })
    fireEvent.change(screen.getByPlaceholderText('Parol'), {
      target: { value: 'password2' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Bekzod Yusupov',
        login: 'bekzod1',
        password: 'password2',
      }),
    )
  })
})
