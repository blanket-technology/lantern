import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

// Built-in copy so crisis information shows even if the API is unreachable.
export const FALLBACK_HELPLINES = {
  emergency_number: '112',
  international_directory: 'https://findahelpline.com',
  helplines: [
    {
      name: 'Tele-MANAS',
      phone: '14416',
      hours: '24 hours, every day',
      description: 'Free government mental health line. You can choose your language. Alternate number 1800-891-4416.',
      url: 'https://telemanas.mohfw.gov.in',
    },
    {
      name: 'Vandrevala Foundation',
      phone: '+91 99996 66555',
      hours: '24 hours, every day',
      description: 'Free counselling by phone or WhatsApp for distress, panic and suicidal thoughts.',
      url: 'https://www.vandrevalafoundation.com',
    },
    {
      name: 'iCALL (TISS)',
      phone: '+91 91529 87821',
      hours: 'Monday to Saturday, daytime hours',
      description: 'Free counselling from trained professionals. Better suited to ongoing stress than emergencies.',
      url: 'https://icallhelpline.org',
    },
  ],
}

let cache = null

export function telHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export default function useHelplines() {
  const [data, setData] = useState(cache || FALLBACK_HELPLINES)
  useEffect(() => {
    if (cache) return
    api
      .helplines()
      .then((d) => {
        cache = d
        setData(d)
      })
      .catch(() => {})
  }, [])
  return data
}
