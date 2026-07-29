import { describe, expect, it, vi } from 'vitest'

const { getMock, postMock, putMock, patchMock, deleteMock } = vi.hoisted(
  () => ({
    getMock: vi.fn(),
    postMock: vi.fn(),
    putMock: vi.fn(),
    patchMock: vi.fn(),
    deleteMock: vi.fn(),
  }),
)

vi.mock('./axiosInstance', () => ({
  axiosInstance: {
    get: getMock,
    post: postMock,
    put: putMock,
    patch: patchMock,
    delete: deleteMock,
  },
}))

import {
  createOrganization,
  createOrganizationOperator,
  createTariffInterval,
  createTariffIntervalAdmin,
  deleteTariffInterval,
  deleteTariffIntervalAdmin,
  getIntegrationSettings,
  getOrganizations,
  getPermissions,
  getTariffIntervals,
  getTariffIntervalsAdmin,
  updateCapacity,
  updateIntegrationSettings,
  updatePermissions,
  updatePricingMode,
  updateTariffInterval,
  updateTariffIntervalAdmin,
} from '@/api/organizations'

const organizationDto = {
  id: 1,
  name: 'Chorsu',
  address: null,
  is_active: 1,
  is_online: true,
  pricing_mode: 'interval',
  total_capacity: 50,
  created_at: '2026-07-01T00:00:00.000Z',
}

const integrationSettingsDto = {
  relayEntryIp: '192.168.1.10',
  relayExitIp: '192.168.1.11',
  printerIp: '192.168.1.20',
  cameraBrand: 'hikvision',
  webhookToken: 'token',
  webhookEntryUrl: '/entry',
  webhookExitUrl: '/exit',
  webhookDebugEntryUrl: '/debug-entry',
  webhookDebugExitUrl: '/debug-exit',
  gateLayout: 'shared' as const,
  crossCameraGuardSeconds: 90,
}

describe('integration settings lane protection', () => {
  it('GET camelCase qiymatlarini frontend modeliga map qiladi', async () => {
    getMock.mockResolvedValue({ data: integrationSettingsDto })

    const result = await getIntegrationSettings(7)

    expect(getMock).toHaveBeenCalledWith(
      '/api/admin/organizations/7/integration-settings',
    )
    expect(result).toMatchObject({
      gate_layout: 'shared',
      cross_camera_guard_seconds: 90,
    })
  })

  it('PUTga backend kutgan snake_case maydonlarni o‘zgartirmasdan yuboradi', async () => {
    putMock.mockResolvedValue({ data: integrationSettingsDto })

    await updateIntegrationSettings({
      orgId: 7,
      relay_entry_ip: '192.168.1.10',
      camera_brand: 'hikvision',
      gate_layout: 'shared',
      cross_camera_guard_seconds: 90,
    })

    expect(putMock).toHaveBeenCalledWith(
      '/api/admin/organizations/7/integration-settings',
      {
        relay_entry_ip: '192.168.1.10',
        camera_brand: 'hikvision',
        gate_layout: 'shared',
        cross_camera_guard_seconds: 90,
      },
    )
  })
})

describe('createOrganization', () => {
  it("javobda 'operator' bo'lmasa xatolik tashlamaydi (regression)", async () => {
    postMock.mockResolvedValue({
      data: { organization: organizationDto },
    })

    const result = await createOrganization({
      name: 'Chorsu',
      owner: { name: 'Aziz', login: 'aziz1', password: 'secret1' },
      tariff: { price_per_hour: 5000 },
    })

    expect(result.organization.id).toBe(1)
    expect(result.operator).toBeNull()
  })

  it("javobda 'operator' bo'lsa uni map qilib qaytaradi", async () => {
    postMock.mockResolvedValue({
      data: {
        organization: organizationDto,
        operator: {
          id: 5,
          org_id: 1,
          name: 'Bekzod',
          login: 'bekzod1',
          role: 'operator',
          is_active: 1,
          created_at: '2026-07-01T00:00:00.000Z',
        },
      },
    })

    const result = await createOrganization({
      name: 'Chorsu',
      owner: { name: 'Aziz', login: 'aziz1', password: 'secret1' },
      operator: { name: 'Bekzod', login: 'bekzod1', password: 'secret2' },
      tariff: { price_per_hour: 5000 },
    })

    expect(result.operator?.role).toBe('operator')
    expect(result.operator?.is_active).toBe(true)
  })
})

describe('getOrganizations', () => {
  it("backend javobidagi 'total_capacity' maydonini 'capacity_total' ga togri map qiladi (regression)", async () => {
    getMock.mockResolvedValue({
      data: { organizations: [organizationDto] },
    })

    const organizations = await getOrganizations()

    expect(organizations[0].capacity_total).toBe(50)
  })

  it("'total_capacity' null bolsa capacity_total ham null boladi (regression)", async () => {
    getMock.mockResolvedValue({
      data: { organizations: [{ ...organizationDto, total_capacity: null }] },
    })

    const organizations = await getOrganizations()

    expect(organizations[0].capacity_total).toBeNull()
  })
})

describe('updatePricingMode', () => {
  it("PUT metodi bilan to'g'ri endpoint va payload'ga yuboradi (regression)", async () => {
    putMock.mockResolvedValue({ data: { organization: organizationDto } })

    const org = await updatePricingMode({ id: 1, pricing_mode: 'interval' })

    expect(putMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/pricing-mode',
      { pricing_mode: 'interval' },
    )
    expect(patchMock).not.toHaveBeenCalled()
    expect(org.pricing_mode).toBe('interval')
  })
})

describe('updateCapacity', () => {
  it("PUT sorovi 'total_capacity' kaliti bilan yuboriladi, capacity_total EMAS (regression)", async () => {
    putMock.mockResolvedValue({
      data: { organization: { ...organizationDto, total_capacity: 40 } },
    })

    const org = await updateCapacity({ id: 1, capacity_total: 40 })

    expect(putMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/capacity',
      { total_capacity: 40 },
    )
    expect(org.capacity_total).toBe(40)
    expect(putMock.mock.calls.at(-1)?.[1]).not.toHaveProperty(
      'capacity_total',
    )
  })

  it("'total_capacity' null bo'lsa ham to'g'ri yuboradi (regression)", async () => {
    putMock.mockResolvedValue({
      data: { organization: { ...organizationDto, total_capacity: null } },
    })

    const org = await updateCapacity({ id: 1, capacity_total: null })

    expect(putMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/capacity',
      { total_capacity: null },
    )
    expect(patchMock).not.toHaveBeenCalled()
    expect(org.capacity_total).toBeNull()
  })

  it("capacity_total STRING sifatida kelsa ham 'total_capacity' RAQAM sifatida yuboradi (regression)", async () => {
    putMock.mockResolvedValue({ data: { organization: organizationDto } })

    await updateCapacity({
      id: 1,
      capacity_total: '10' as unknown as number,
    })

    expect(putMock).toHaveBeenLastCalledWith(
      '/api/admin/organizations/1/capacity',
      { total_capacity: 10 },
    )
    expect(
      typeof putMock.mock.calls.at(-1)?.[1].total_capacity,
    ).toBe('number')
  })

  it("capacity_total kasr son bolsa ham 'total_capacity' BUTUN songa (integer) aylantirib yuboradi (regression)", async () => {
    putMock.mockResolvedValue({ data: { organization: organizationDto } })

    await updateCapacity({ id: 1, capacity_total: 50.7 })

    expect(putMock).toHaveBeenLastCalledWith(
      '/api/admin/organizations/1/capacity',
      { total_capacity: 50 },
    )
    expect(
      Number.isInteger(putMock.mock.calls.at(-1)?.[1].total_capacity),
    ).toBe(true)
  })
})

describe('getPermissions / updatePermissions', () => {
  const permissions = {
    can_view_dashboard: true,
    can_view_sessions: true,
    can_view_reports: false,
    can_view_tariffs: true,
    can_view_subscriptions: false,
    can_view_settings: true,
    can_view_activity_log: false,
  }

  const permissionItems = [
    { section_key: 'dashboard', can_view: true },
    { section_key: 'sessions', can_view: true },
    { section_key: 'reports', can_view: false },
    { section_key: 'tariffs', can_view: true },
    { section_key: 'subscriptions', can_view: false },
    { section_key: 'settings', can_view: true },
    { section_key: 'activity_log', can_view: false },
  ]

  it("getPermissions backend'dan kelgan MASSIVNI OperatorPermissions obyektiga aylantiradi (regression)", async () => {
    getMock.mockResolvedValue({ data: { permissions: permissionItems } })

    const result = await getPermissions(1)

    expect(getMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/permissions',
    )
    expect(result).toEqual(permissions)
  })

  it("getPermissions massiv tartibidan qatiy nazar togri section_key'ga bogliydi", async () => {
    getMock.mockResolvedValue({
      data: {
        permissions: [...permissionItems].reverse(),
      },
    })

    const result = await getPermissions(1)

    expect(result).toEqual(permissions)
  })

  it("updatePermissions OperatorPermissions obyektini backend kutgan MASSIVGA aylantirib PUT qiladi (regression)", async () => {
    putMock.mockResolvedValue({ data: { permissions: permissionItems } })

    const result = await updatePermissions({ id: 1, permissions })

    expect(putMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/permissions',
      { permissions: permissionItems },
    )
    expect(result).toEqual(permissions)
  })
})

describe("tariff intervals — FLAT yol (operator/owner, 'self')", () => {
  const intervalDto = {
    id: 1,
    org_id: 1,
    from_minutes: 0,
    to_minutes: 60,
    price: '5000.00',
    created_at: '2026-07-01T00:00:00.000Z',
  }

  it("getTariffIntervals org id'siz FLAT yolga chaqiradi va price stringni number ga aylantiradi (regression)", async () => {
    getMock.mockResolvedValue({ data: { intervals: [intervalDto] } })

    const intervals = await getTariffIntervals()

    expect(getMock).toHaveBeenCalledWith('/api/tariff-intervals')
    expect(intervals[0].price).toBe(5000)
    expect(typeof intervals[0].price).toBe('number')
  })

  it("getTariffIntervals javobdagi 'from_minutes' (KOPLIK) maydonini togri oqiydi (regression)", async () => {
    getMock.mockResolvedValue({ data: { intervals: [intervalDto] } })

    const intervals = await getTariffIntervals()

    expect(intervals[0].from_minutes).toBe(0)
    expect(intervals[0].to_minutes).toBe(60)
  })

  it("createTariffInterval org id'siz FLAT yolga POST qiladi (regression)", async () => {
    postMock.mockResolvedValue({
      data: { interval: { ...intervalDto, to_minutes: null } },
    })

    const interval = await createTariffInterval({
      from_minutes: 0,
      to_minutes: null,
      price: 5000,
    })

    expect(postMock).toHaveBeenCalledWith('/api/tariff-intervals', {
      from_minutes: 0,
      to_minutes: null,
      price: 5000,
    })
    expect(interval.to_minutes).toBeNull()
  })

  it("updateTariffInterval org id'siz FLAT yolga id bilan PUT qiladi (regression)", async () => {
    putMock.mockResolvedValue({ data: { interval: intervalDto } })

    await updateTariffInterval({ id: 1, price: 6000 })

    expect(putMock).toHaveBeenCalledWith('/api/tariff-intervals/1', {
      price: 6000,
    })
  })

  it("deleteTariffInterval org id'siz FLAT yolga id bilan DELETE qiladi (regression)", async () => {
    deleteMock.mockResolvedValue({})
    await deleteTariffInterval(1)
    expect(deleteMock).toHaveBeenCalledWith('/api/tariff-intervals/1')
  })
})

describe("tariff intervals — NESTED yol (Super Admin)", () => {
  const intervalDto = {
    id: 1,
    org_id: 1,
    from_minutes: 0,
    to_minutes: 60,
    price: '5000.00',
    created_at: '2026-07-01T00:00:00.000Z',
  }

  it("getTariffIntervalsAdmin NESTED org id yoli orqali chaqiradi (regression)", async () => {
    getMock.mockResolvedValue({ data: { intervals: [intervalDto] } })

    const intervals = await getTariffIntervalsAdmin(1)

    expect(getMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/tariff-intervals',
    )
    expect(intervals[0].price).toBe(5000)
  })

  it("getTariffIntervalsAdmin javobdagi 'from_minutes' (KOPLIK) maydonini togri oqiydi (regression)", async () => {
    getMock.mockResolvedValue({ data: { intervals: [intervalDto] } })

    const intervals = await getTariffIntervalsAdmin(1)

    expect(intervals[0].from_minutes).toBe(0)
    expect(intervals[0].to_minutes).toBe(60)
  })

  it("createTariffIntervalAdmin NESTED org id yoliga POST qiladi (regression)", async () => {
    postMock.mockResolvedValue({ data: { interval: intervalDto } })

    await createTariffIntervalAdmin({
      orgId: 1,
      from_minutes: 0,
      to_minutes: 60,
      price: 5000,
    })

    expect(postMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/tariff-intervals',
      { from_minutes: 0, to_minutes: 60, price: 5000 },
    )
  })

  it("updateTariffIntervalAdmin NESTED org id VA interval id yoliga PUT qiladi (regression)", async () => {
    putMock.mockResolvedValue({ data: { interval: intervalDto } })

    await updateTariffIntervalAdmin({ orgId: 1, id: 1, price: 6000 })

    expect(putMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/tariff-intervals/1',
      { price: 6000 },
    )
  })

  it("deleteTariffIntervalAdmin NESTED org id VA interval id yoliga DELETE qiladi (regression)", async () => {
    deleteMock.mockResolvedValue({})

    await deleteTariffIntervalAdmin({ orgId: 1, id: 1 })

    expect(deleteMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/tariff-intervals/1',
    )
  })
})

describe('createOrganizationOperator', () => {
  it("to'g'ri org endpoint va payload bilan yuboradi (regression)", async () => {
    postMock.mockResolvedValue({
      data: {
        operator: {
          id: 5,
          org_id: 1,
          name: 'Bekzod',
          login: 'bekzod1',
          role: 'operator',
          is_active: 1,
          created_at: '2026-07-01T00:00:00.000Z',
        },
      },
    })

    const operator = await createOrganizationOperator({
      id: 1,
      name: 'Bekzod',
      login: 'bekzod1',
      password: 'secret1',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/api/admin/organizations/1/operator',
      { name: 'Bekzod', login: 'bekzod1', password: 'secret1' },
    )
    expect(operator.role).toBe('operator')
  })
})
