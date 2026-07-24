import { useTranslation } from 'react-i18next'
import { Button, Dropdown, type MenuProps } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n'

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  'uz-Latn': 'UZ',
  'uz-Cyrl': 'ЎЗ',
  ru: 'RU',
  en: 'EN',
}

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = (
    SUPPORTED_LANGUAGES as readonly string[]
  ).includes(i18n.language)
    ? (i18n.language as SupportedLanguage)
    : 'uz-Latn'

  const items: MenuProps['items'] = SUPPORTED_LANGUAGES.map((lng) => ({
    key: lng,
    label: LANGUAGE_LABELS[lng],
  }))

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: [current],
        onClick: ({ key }) => i18n.changeLanguage(key),
      }}
      trigger={['click']}
    >
      <Button
        type="text"
        size="large"
        icon={<GlobalOutlined style={{ fontSize: 20 }} />}
        className="text-base"
      >
        {LANGUAGE_LABELS[current]}
      </Button>
    </Dropdown>
  )
}
