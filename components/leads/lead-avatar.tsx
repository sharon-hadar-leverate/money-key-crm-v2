'use client'

import Image from 'next/image'
import profileImage from '@/app/assets/profile_image_no_bg.png'
import type { Lead } from '@/types/leads'

interface LeadAvatarProps {
  lead: Pick<Lead, 'name' | 'whatsapp_avatar_url'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: 36,
  md: 48,
  lg: 80,
} as const

export function LeadAvatar({ lead, size = 'md', className = '' }: LeadAvatarProps) {
  const dimension = sizeConfig[size]
  const hasWhatsAppAvatar = !!lead.whatsapp_avatar_url

  if (hasWhatsAppAvatar) {
    return (
      <Image
        src={lead.whatsapp_avatar_url!}
        alt={lead.name || 'Lead'}
        width={dimension}
        height={dimension}
        className={`rounded-lg object-cover ${className}`}
        unoptimized
      />
    )
  }

  return (
    <Image
      src={profileImage}
      alt={lead.name || 'Lead'}
      width={dimension}
      height={dimension}
      className={`rounded-lg ${className}`}
    />
  )
}
