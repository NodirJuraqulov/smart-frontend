# AutoStoyanka — Frontend

Ko'p avtoturargohni bitta tizimdan boshqarish uchun SaaS platforma. Ikki panel: **Super Admin** (barcha tashkilotlarni boshqaradi) va **Operator** (o'z avtoturargohini boshqaradi).

## Texnologiyalar

- React 19 + TypeScript + Vite
- Ant Design
- Redux Toolkit
- TanStack Query
- Socket.IO Client
- i18next (4 til: `uz-Latn`, `uz-Cyrl`, `ru`, `en`)
- Tailwind CSS

## O'rnatish

```bash
npm install
```

## Sozlash

`.env.example`ni nusxalab `.env` yarating:

```bash
cp .env.example .env
```

| O'zgaruvchi     | Tavsif                          | Misol                     |
| --------------- | -------------------------------- | -------------------------- |
| `VITE_API_URL`  | Backend API manzili (base URL)   | `http://localhost:5000`    |

## Ishga tushirish

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Papka strukturasi

```
src/
├── api/          # Backend bilan ishlaydigan funksiyalar (axios)
├── components/    # Umumiy, qayta ishlatiladigan UI komponentlar
├── contexts/      # React context'lar (tema va h.k.)
├── hooks/         # Umumiy custom hook'lar
├── i18n/          # i18next sozlamalari
├── layouts/       # Sahifa shablonlari (AppLayout va h.k.)
├── locales/       # Tarjima fayllari (4 til)
├── pages/
│   ├── admin/     # Super Admin sahifalari
│   ├── operator/  # Operator sahifalari
│   └── auth/      # Login sahifasi
├── routes/        # Route'lar konfiguratsiyasi
├── services/      # Socket.IO va shunga o'xshash servislar
├── store/         # Redux store
├── theme/         # Ant Design tema/palette sozlamalari
├── types/         # TypeScript tiplar
└── utils/         # Yordamchi funksiyalar
```

## Production deploy

Deploy bo'yicha to'liq qo'llanma `s-backend` repozitoriyasidagi `DEPLOYMENT.md` faylida.
