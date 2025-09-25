
'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegisterSuccess() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <h1 className="mb-4 text-3xl font-bold text-green-600 dark:text-green-500">
          {t('Registration Successful!')}
        </h1>
        <p className="mb-6 text-gray-700 dark:text-gray-300">
          {t('Your restaurant has been successfully registered. An email with your access details has been sent. Please check your inbox (and spam folder).')}
        </p>
        <Link href="/login" passHref>
          <Button>{t('Go to Login')}</Button>
        </Link>
      </div>
    </div>
  )
}
