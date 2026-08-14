import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App as AntdApp } from 'antd'
import i18n from '@/i18n'
import { formatDate, formatDuration } from '@/utils/format'
import type { ParkingSession } from '@/types/parking'
import ActiveSessionsTable from './ActiveSessionsTable'

const enteredAt = '2026-08-14T08:00:00.000Z'
const now = new Date(enteredAt).getTime() + 90 * 60000

const session: ParkingSession = {
  id: 7,
  org_id: 3,
  plate_number: '01A777BA',
  entered_at: enteredAt,
  exited_at: null,
  duration_minutes: null,
  amount: null,
  status: 'active',
  entry_method: 'auto',
  exit_method: null,
  entryOverviewImageUrl: '/api/parking/sessions/7/entry-overview',
  operator_id: null,
  created_at: enteredAt,
}

function renderTable() {
  render(
    <AntdApp>
      <ActiveSessionsTable dataSource={[session]} loading={false} now={now} />
    </AntdApp>,
  )
}

describe('ActiveSessionsTable', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('uz-Latn')
  })

  it("shlagbaumni ochish tugmasi va amallar ustunini ko'rsatmaydi", () => {
    renderTable()

    expect(
      screen.queryByRole('button', { name: 'Shlagbaumni ochish' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('columnheader', { name: 'Amallar' }),
    ).not.toBeInTheDocument()
  })

  it('qolgan ustunlar va qatordagi ma’lumotlarni o‘zgartirmaydi', () => {
    renderTable()

    expect(
      screen.getByRole('columnheader', { name: 'Nomer' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Kirdi' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: "Necha vaqt bo'ldi" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Rasmlar' }),
    ).toBeInTheDocument()
    expect(screen.getByText(session.plate_number)).toBeInTheDocument()
    expect(
      screen.getByText(formatDate(session.entered_at)),
    ).toBeInTheDocument()
    expect(screen.getByText(formatDuration(90))).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: "Rasmlarni ko'rish" }),
    ).toBeInTheDocument()
  })
})
