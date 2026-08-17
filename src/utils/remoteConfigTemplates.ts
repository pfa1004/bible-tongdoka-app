export interface CloudCardTemplate {
  id: string;
  name: string;
  category: 'seasonal' | 'grace' | 'nature' | 'custom';
  backgroundStyle: string; // CSS Gradient string or url('https://firebasestorage.googleapis.com/...')
  textColor: string;
  overlayOpacity: number;
  isCloudTemplate?: boolean;
}

// Default bundled card background templates
export const DEFAULT_CARD_TEMPLATES: CloudCardTemplate[] = [
  {
    id: 'spring',
    name: '🌸 봄 (새생명)',
    category: 'seasonal',
    backgroundStyle: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #a7f3d0 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.25,
  },
  {
    id: 'summer',
    name: '🌿 여름 (청량)',
    category: 'seasonal',
    backgroundStyle: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.2,
  },
  {
    id: 'autumn',
    name: '🍁 가을 (풍성)',
    category: 'seasonal',
    backgroundStyle: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fef3c7 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.25,
  },
  {
    id: 'winter',
    name: '❄️ 겨울 (평안)',
    category: 'seasonal',
    backgroundStyle: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #e2e8f0 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.3,
  },
  {
    id: 'comfort',
    name: '💜 위로의 빛',
    category: 'grace',
    backgroundStyle: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 50%, #ddd6fe 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.3,
  },
  {
    id: 'gratitude',
    name: '💖 은혜와 감사',
    category: 'grace',
    backgroundStyle: 'linear-gradient(135deg, #831843 0%, #f43f5e 50%, #fecdd3 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.25,
  },
  {
    id: 'peace',
    name: '💚 샬롬의 평강',
    category: 'grace',
    backgroundStyle: 'linear-gradient(135deg, #14532d 0%, #22c55e 50%, #bbf7d0 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.25,
  },
  {
    id: 'hope',
    name: '💛 소망의 아침',
    category: 'grace',
    backgroundStyle: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fef3c7 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.2,
  },
  {
    id: 'nature',
    name: '🌌 거룩한 밤하늘',
    category: 'nature',
    backgroundStyle: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    textColor: '#fef08a',
    overlayOpacity: 0.4,
  },
  {
    id: 'gold_majesty',
    name: '✨ 영광의 황금빛',
    category: 'grace',
    backgroundStyle: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #fef08a 100%)',
    textColor: '#ffffff',
    overlayOpacity: 0.3,
  },
];

/**
 * Fetch dynamic card templates from Firebase Remote Config (Fallback to local default)
 */
export async function getCardTemplates(): Promise<CloudCardTemplate[]> {
  try {
    const savedCloudTemplates = localStorage.getItem('firebase_remote_card_templates');
    if (savedCloudTemplates) {
      const parsed: CloudCardTemplate[] = JSON.parse(savedCloudTemplates);
      return [...DEFAULT_CARD_TEMPLATES, ...parsed];
    }
  } catch (e) {
    console.warn('Failed to load cached Remote Config templates:', e);
  }
  return DEFAULT_CARD_TEMPLATES;
}
