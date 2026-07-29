import { Alert, Button, DatePicker, Segmented, Space, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import type { ReportType } from '@/types/reports'
import {
  isFuture,
  isFutureMonth,
  isFutureYear,
  REPORT_RANGE_LIMITS,
  type DateRange,
  type FilterMode,
  validateRange,
} from './reportRange'

interface Props {
  type: ReportType
  mode: FilterMode
  single: Dayjs
  range: DateRange
  appliedRange: DateRange
  error: string | null
  onModeChange: (mode: FilterMode) => void
  onSingleChange: (value: Dayjs) => void
  onRangeChange: (value: DateRange) => void
  onApply: () => void
  onReset: () => void
}

const RANGE_PRESETS: Record<ReportType, number[]> = {
  daily: [3, 7, 15, 30],
  monthly: [3, 6, 12],
  yearly: [3, 5],
}

export default function ReportFilter({
  type,
  mode,
  single,
  range,
  appliedRange,
  error,
  onModeChange,
  onSingleChange,
  onRangeChange,
  onApply,
  onReset,
}: Props) {
  const { t, i18n } = useTranslation()
  const picker = type === 'daily' ? undefined : type === 'monthly' ? 'month' : 'year'
  const format = type === 'daily' ? 'YYYY-MM-DD' : type === 'monthly' ? 'YYYY-MM' : 'YYYY'
  const disabledDate = type === 'daily' ? isFuture : type === 'monthly' ? isFutureMonth : isFutureYear
  const validation = validateRange(type, range)
  const unit = type === 'daily' ? 'day' : type === 'monthly' ? 'month' : 'year'
  const boundaryKeys =
    type === 'daily'
      ? ['startDate', 'endDate']
      : type === 'monthly'
        ? ['startMonth', 'endMonth']
        : ['startYear', 'endYear']
  const displayFormat =
    i18n.language === 'ru'
      ? type === 'daily'
        ? 'DD.MM.YYYY'
        : type === 'monthly'
          ? 'MM.YYYY'
          : 'YYYY'
      : format

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={mode}
          onChange={(value) => onModeChange(value as FilterMode)}
          options={[
            { label: t('reports.singlePeriod'), value: 'single' },
            { label: t('reports.customRange'), value: 'range' },
          ]}
        />
        {mode === 'single' ? (
          <DatePicker
            size="large"
            picker={picker}
            value={single}
            onChange={(value) => value && onSingleChange(value)}
            disabledDate={disabledDate}
            allowClear={false}
            placeholder={t(`reports.${type === 'daily' ? 'datePlaceholder' : type === 'monthly' ? 'monthPlaceholder' : 'yearPlaceholder'}`)}
          />
        ) : (
          <>
            <DatePicker.RangePicker
              size="large"
              picker={picker}
              value={range}
              onChange={(values) => onRangeChange(values as DateRange)}
              disabledDate={disabledDate}
              format={format}
              placeholder={[
                t(`reports.${boundaryKeys[0]}`),
                t(`reports.${boundaryKeys[1]}`),
              ]}
              allowEmpty={[false, false]}
              className="max-w-full"
              aria-label={t('reports.customRange')}
            />
            <Button type="primary" size="large" onClick={onApply} disabled={Boolean(validation)}>
              {t('reports.apply')}
            </Button>
          </>
        )}
        <Button size="large" onClick={onReset}>{t('reports.reset')}</Button>
      </div>

      {mode === 'range' && (
        <Space wrap size={[8, 8]}>
          {RANGE_PRESETS[type].map((count) => (
            <Button
              size="small"
              key={count}
              onClick={() => onRangeChange([
                dayjs().startOf(unit).subtract(count - 1, unit),
                dayjs().startOf(unit),
              ])}
            >
              {t(`reports.last${count}${type === 'daily' ? 'Days' : type === 'monthly' ? 'Months' : 'Years'}`)}
            </Button>
          ))}
        </Space>
      )}

      {(error || (mode === 'range' && range && validation)) && (
        <Alert
          type="error"
          showIcon
          title={
            error ??
            t(
              `reports.${validation === 'incomplete' ? 'incompleteRange' : validation === 'order' ? 'invalidRangeOrder' : validation === 'future' ? 'futureNotAllowed' : 'rangeLimitExceeded'}`,
              { limit: REPORT_RANGE_LIMITS[type] },
            )
          }
        />
      )}

      {mode === 'range' && appliedRange && (
        <Typography.Text strong>
          {t('reports.selectedPeriod', {
            to: appliedRange[1].format(displayFormat),
            from: appliedRange[0].format(displayFormat),
          })}
        </Typography.Text>
      )}
    </div>
  )
}
