import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import OperatorsCard from './OperatorsCard'
import type { Operator } from '@/types/user'

const owner: Operator = {
  id: 1,
  org_id: 1,
  name: 'Aziz Egamov',
  login: 'aziz123',
  role: 'owner',
  is_active: true,
  created_at: '2026-07-01T00:00:00.000Z',
}

const operator: Operator = {
  id: 2,
  org_id: 1,
  name: 'Bekzod Yusupov',
  login: 'bekzod1',
  role: 'operator',
  is_active: true,
  created_at: '2026-07-01T00:00:00.000Z',
}

function renderCard(
  dataSource: Operator[],
  showAddOperatorButton: boolean,
  onAddOperator = vi.fn(),
  onResetPassword = vi.fn(),
  onToggleBlock = vi.fn(),
  isTogglePending = () => false,
) {
  render(
    <ThemeProvider>
      <OperatorsCard
        dataSource={dataSource}
        loading={false}
        showAddOperatorButton={showAddOperatorButton}
        onAddOperator={onAddOperator}
        onResetPassword={onResetPassword}
        onToggleBlock={onToggleBlock}
        isTogglePending={isTogglePending}
      />
    </ThemeProvider>,
  )
}

describe('OperatorsCard', () => {
  it("owner va operator qatorlarini Rol ustuni bilan korsatadi (regression)", () => {
    renderCard([owner, operator], false)

    expect(screen.getByText('Aziz Egamov')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Bekzod Yusupov')).toBeInTheDocument()
    expect(screen.getByText('Operator')).toBeInTheDocument()
  })

  it("operator mavjud bolmasa 'Operator qoshish' tugmasi korinadi", () => {
    renderCard([owner], true)
    expect(
      screen.getByRole('button', { name: /Operator qo'shish/ }),
    ).toBeInTheDocument()
  })

  it("operator allaqachon mavjud bolsa 'Operator qoshish' tugmasi korinmaydi (regression)", () => {
    renderCard([owner, operator], false)
    expect(
      screen.queryByRole('button', { name: /Operator qo'shish/ }),
    ).not.toBeInTheDocument()
  })

  it("'Parolni tiklash' bosilganda tanlangan qatorni uzatadi", () => {
    const onResetPassword = vi.fn()
    renderCard([owner, operator], false, vi.fn(), onResetPassword)

    const resetButtons = screen.getAllByRole('button', {
      name: /Parolni tiklash/,
    })
    fireEvent.click(resetButtons[0])

    expect(onResetPassword).toHaveBeenCalledWith(owner)
  })

  it("Bloklash tugmasi Owner qatorida ham ishlaydi", async () => {
    const onToggleBlock = vi.fn()
    renderCard([owner, operator], false, vi.fn(), vi.fn(), onToggleBlock)

    const blockButtons = screen.getAllByRole('button', { name: /Bloklash/ })
    fireEvent.click(blockButtons[0])

    const confirmButton = await screen.findByRole('button', { name: 'OK' })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(onToggleBlock).toHaveBeenCalledWith(owner))
  })

  it("Bloklash tugmasi Operator qatorida ham ishlaydi", async () => {
    const onToggleBlock = vi.fn()
    renderCard([owner, operator], false, vi.fn(), vi.fn(), onToggleBlock)

    const blockButtons = screen.getAllByRole('button', { name: /Bloklash/ })
    fireEvent.click(blockButtons[1])

    const confirmButton = await screen.findByRole('button', { name: 'OK' })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(onToggleBlock).toHaveBeenCalledWith(operator))
  })

  it("blokdan chiqarilgan qator uchun 'Ochish' tugmasi korinadi", () => {
    renderCard([{ ...operator, is_active: false }], false)

    expect(
      screen.getByRole('button', { name: /Ochish/ }),
    ).toBeInTheDocument()
  })
})
