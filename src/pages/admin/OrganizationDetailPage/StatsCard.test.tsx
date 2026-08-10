import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsCard from './StatsCard'
import type { OrganizationStats } from '@/types/organization'

const stats: OrganizationStats = {
  organization_id: 1,
  today_entries: 12,
  today_exits: 9,
  today_revenue: 450000,
  current_period_start: '2026-08-01T08:00:00.000Z',
  currently_parked: 3,
  total_sessions: 120,
  total_revenue: 9000000,
  is_online: true,
  last_heartbeat_at: null,
}

describe('StatsCard', () => {
  it('daromad yorlig‘i "Joriy davr daromadi" bo‘lib ko‘rsatiladi', () => {
    render(<StatsCard isLoading={false} stats={stats} />)

    expect(screen.getByText('Joriy davr daromadi')).toBeInTheDocument()
    expect(screen.queryByText('Bugungi daromad')).not.toBeInTheDocument()
  })

  it('current_period_start bo‘lsa davr boshlanishini izoh sifatida ko‘rsatadi', () => {
    render(<StatsCard isLoading={false} stats={stats} />)

    expect(screen.getByText(/dan beri/)).toBeInTheDocument()
  })

  it('current_period_start bo‘lmasa izoh ko‘rsatilmaydi', () => {
    render(
      <StatsCard
        isLoading={false}
        stats={{ ...stats, current_period_start: null }}
      />,
    )

    expect(screen.getByText('Joriy davr daromadi')).toBeInTheDocument()
    expect(screen.queryByText(/dan beri/)).not.toBeInTheDocument()
  })
})
