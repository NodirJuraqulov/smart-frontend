import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp, Form } from 'antd'
import CreateOperatorModal, {
  type CreateOperatorFormValues,
} from './CreateOperatorModal'

function renderModal() {
  const onSubmit = vi.fn()

  function Host() {
    const [form] = Form.useForm<CreateOperatorFormValues>()
    return (
      <AntdApp>
        <CreateOperatorModal
          open
          form={form}
          orgOptions={[{ label: 'Test parking', value: 1 }]}
          orgsLoading={false}
          isPending={false}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />
      </AntdApp>
    )
  }

  render(<Host />)
  return { onSubmit }
}

function getRoleSelect(): HTMLElement {
  const input = document.querySelector('#role')
  const select = input?.closest('.ant-select')
  if (!select) throw new Error('Role select not found')
  return select as HTMLElement
}

describe('CreateOperatorModal', () => {
  it('rol tanlovida Kassir varianti mavjud', async () => {
    renderModal()

    fireEvent.mouseDown(getRoleSelect())

    await waitFor(() => {
      expect(screen.getAllByTitle('Kassir').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByTitle('Operator').length).toBeGreaterThan(0)
  })

  it('sukut bo‘yicha operator roli tanlanadi', () => {
    renderModal()

    expect(getRoleSelect()).toHaveTextContent('Operator')
  })

  it('kassir tanlangach forma role qiymatini yuboradi', async () => {
    const { onSubmit } = renderModal()

    fireEvent.change(document.querySelector('#name') as HTMLElement, {
      target: { value: 'Kassir Aliyev' },
    })
    fireEvent.change(document.querySelector('#login') as HTMLElement, {
      target: { value: 'kassir01' },
    })
    fireEvent.change(document.querySelector('#password') as HTMLElement, {
      target: { value: 'secret123' },
    })

    fireEvent.mouseDown(
      (document.querySelector('#org_id') as HTMLElement).closest(
        '.ant-select',
      ) as HTMLElement,
    )
    await waitFor(() => screen.getByTitle('Test parking'))
    fireEvent.click(screen.getByTitle('Test parking'))

    fireEvent.mouseDown(getRoleSelect())
    await waitFor(() => screen.getAllByTitle('Kassir'))
    fireEvent.click(screen.getAllByTitle('Kassir')[0])

    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'kassir', org_id: 1 }),
    )
  })
})
