import type { ProductCuratedMeta } from '../types';

export const CURATED_PRODUCT_METADATA: Record<string, ProductCuratedMeta> = {
  'prod-101': {
    category: 'Audio & Acoustics',
    tagline: 'Pure silence. Acoustic precision.',
    description:
      'Engineered with 40mm custom beryllium drivers and advanced hybrid active noise cancellation. AuraFlow isolates distracting ambient noise while reproducing studio-master fidelity across every frequency.',
    highlights: [
      'Hybrid ANC with 4 beamforming ambient microphones',
      '38-Hour uninterrupted battery longevity with quick USB-C top-up',
      'Memory-foam protein leather cushions for all-day comfort',
      'Lossless Bluetooth 5.3 with multipoint device switching'
    ],
    specs: [
      { label: 'Driver Size', value: '40mm Beryllium' },
      { label: 'Frequency Response', value: '10Hz – 40,000Hz' },
      { label: 'Battery Life', value: 'Up to 38 hours' },
      { label: 'Weight', value: '255g' },
      { label: 'Connectivity', value: 'Bluetooth 5.3 / 3.5mm AUX' }
    ],
    primaryImage:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=85',
    accentColor: '#0055FF',
    badge: 'Staff Pick'
  },
  'prod-102': {
    category: 'Input & Peripherals',
    tagline: 'Tactile perfection in aircraft aluminum.',
    description:
      'A compact 75% mechanical keyboard housed in a CNC-machined anodized aluminum body. Featuring factory-lubricated linear switches, hot-swappable 5-pin sockets, and dual-layer silicone acoustic dampening.',
    highlights: [
      'Hot-swappable PCB supporting 3-pin and 5-pin MX switches',
      'CNC anodized 6063 aluminum chassis with brass weight plate',
      'Double-shot PBT keycaps resistant to shine and wear',
      'South-facing per-key RGB illumination with customizable layers'
    ],
    specs: [
      { label: 'Layout', value: '75% Compact (82 Keys)' },
      { label: 'Switch Type', value: 'Factory-Lubed Linear (45g force)' },
      { label: 'Keycaps', value: 'Double-Shot PBT Cherry Profile' },
      { label: 'Polling Rate', value: '1000Hz / 1ms' },
      { label: 'Interface', value: 'Braided Detachable USB-C' }
    ],
    primaryImage:
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1000&q=85',
    accentColor: '#6366F1',
    badge: 'Popular'
  },
  'prod-103': {
    category: 'Workspace & Ergonomics',
    tagline: 'Zero-fatigue posture engineering.',
    description:
      'Designed for sustained focus and spine health. ErgoPro combines dynamic lumbar tracking with breathable Korean elastomeric mesh and synchronized 135° recline to deliver total postural alignment.',
    highlights: [
      'Self-adjusting adaptive lumbar support responds to body movements',
      'Breathable dual-weave mesh dissipates body heat efficiently',
      '4D multidirectional armrests with smooth soft-touch pads',
      'BIFMA-certified Class 4 heavy-duty pneumatic gas cylinder'
    ],
    specs: [
      { label: 'Frame Material', value: 'Reinforced Aluminum Alloy' },
      { label: 'Upholstery', value: 'High-Tensile Elastomeric Mesh' },
      { label: 'Max Load Capacity', value: '150 kg (330 lbs)' },
      { label: 'Recline Angle', value: '90° – 135° Synchronized' },
      { label: 'Certification', value: 'ANSI / BIFMA X5.1' }
    ],
    primaryImage:
      'https://images.unsplash.com/photo-1580481077197-28d8b6ec4efb?auto=format&fit=crop&w=1000&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=1000&q=85',
    accentColor: '#10B981',
    badge: 'Ergonomic'
  },
  'prod-104': {
    category: 'Displays & Visuals',
    tagline: 'True-to-life 4K color fidelity.',
    description:
      'A reference-grade 27-inch 4K UHD IPS display built for designers, developers, and visual creators. Offering 99% DCI-P3 wide color gamut, factory calibration under Delta E < 2, and single-cable 90W USB-C connectivity.',
    highlights: [
      '3840 x 2160 Ultra HD resolution with 178° viewing angles',
      'Factory color-calibrated report included (Delta E < 2.0)',
      '90W Power Delivery over USB-C for single-cable laptop docking',
      'Height, tilt, swivel, and 90° pivot adjustable ergonomic stand'
    ],
    specs: [
      { label: 'Panel Type', value: '27-inch IPS (Anti-Glare 3H)' },
      { label: 'Resolution', value: '3840 x 2160 @ 60Hz' },
      { label: 'Color Gamut', value: '99% DCI-P3, 100% sRGB' },
      { label: 'Brightness', value: '400 nits (HDR400)' },
      { label: 'Ports', value: 'USB-C (90W), 2x HDMI 2.1, DisplayPort 1.4' }
    ],
    primaryImage:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1547119957-637f8679db1e?auto=format&fit=crop&w=1000&q=85',
    accentColor: '#F59E0B',
    badge: 'Pro Display'
  },
  'prod-105': {
    category: 'Power & Charging',
    tagline: 'Compact high-density Gallium Nitride power.',
    description:
      'Pocket-sized powerhouse powered by GaN III semiconductor architecture. Intelligently negotiates up to 100W PD across two USB-C ports and one USB-A port to charge laptops, tablets, and phones simultaneously.',
    highlights: [
      'Advanced GaN III technology operates cooler with 95% efficiency',
      'Single-port 100W output charges a 16" MacBook Pro to 50% in 30 mins',
      'Foldable wall prongs for effortless travel and portability',
      'MultiProtect 11-point safety system guards against over-voltage'
    ],
    specs: [
      { label: 'Total Output', value: '100W Max' },
      { label: 'Ports', value: '2x USB-C PD 3.0, 1x USB-A QC 4.0' },
      { label: 'Technology', value: 'Gallium Nitride (GaN III)' },
      { label: 'Dimensions', value: '65 x 65 x 32 mm' },
      { label: 'Weight', value: '198g' }
    ],
    primaryImage:
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=85',
    secondaryImage:
      'https://images.unsplash.com/photo-1622445262464-84b14e0745b1?auto=format&fit=crop&w=1000&q=85',
    accentColor: '#EF4444',
    badge: 'Compact'
  }
};

/**
 * Fallback metadata generator for any newly added products from the API.
 */
export function getProductMetadata(productId: string, productName: string): ProductCuratedMeta {
  if (CURATED_PRODUCT_METADATA[productId]) {
    return CURATED_PRODUCT_METADATA[productId];
  }

  // Infer category from product name keywords
  const lower = productName.toLowerCase();
  let category = 'Hardware & Gear';
  if (lower.includes('headphone') || lower.includes('audio') || lower.includes('earbud')) {
    category = 'Audio & Acoustics';
  } else if (lower.includes('keyboard') || lower.includes('mouse') || lower.includes('key')) {
    category = 'Input & Peripherals';
  } else if (lower.includes('chair') || lower.includes('desk') || lower.includes('stand')) {
    category = 'Workspace & Ergonomics';
  } else if (lower.includes('monitor') || lower.includes('display') || lower.includes('screen')) {
    category = 'Displays & Visuals';
  } else if (lower.includes('charge') || lower.includes('power') || lower.includes('cable')) {
    category = 'Power & Charging';
  }

  return {
    category,
    tagline: 'Engineered for modern performance.',
    description: `Original manufacturer-grade ${productName}. Built for demanding creators, developers, and everyday professionals.`,
    highlights: [
      'Precision manufacturing standards',
      'Optimal efficiency and thermal characteristics',
      'Designed for sustained daily use'
    ],
    specs: [
      { label: 'Model', value: productId.toUpperCase() },
      { label: 'Warranty', value: '1 Year Limited' }
    ],
    primaryImage:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=85',
    accentColor: '#0055FF'
  };
}
