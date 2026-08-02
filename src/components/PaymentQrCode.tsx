import { Typography } from 'antd'
import paymentQrUrl from '@/assets/ShohMed_QR.png'

interface PaymentQrCodeProps {
  label?: string
  alt: string
  size: 'compact' | 'display'
}

export default function PaymentQrCode({
  label,
  alt,
  size,
}: PaymentQrCodeProps) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-3 text-center">
      {label && (
        <Typography.Text
          strong
          style={{ fontSize: size === 'display' ? 32 : 15 }}
        >
          {label}
        </Typography.Text>
      )}
      <img
        src={paymentQrUrl}
        alt={alt}
        loading="lazy"
        className="h-auto max-w-full rounded-lg"
        style={{
          width: size === 'display' ? '76vw' : 180,
          maxWidth: size === 'display' ? 760 : '100%',
        }}
      />
    </div>
  )
}
