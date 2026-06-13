// ═══════════════════════════════════════════════════════
// CONFIGURACIÓN CENTRAL — GROUP 360 INICIATIVAS
// Edita este archivo para personalizar toda la web
// ═══════════════════════════════════════════════════════

export const config = {
  // ── EMPRESA ──────────────────────────────────────────
  empresa: {
    nombre: 'GROUP 360',
    nombreCompleto: 'GRUPO 360 INICIATIVAS S.L.',
    slogan: 'Iniciativas',
    nif: 'B13911979',
    descripcion: 'Visión 360° del mercado inmobiliario. Propiedades premium, inversiones y alquileres en España.',
    fundada: '2010',
    experiencia: '15+',
  },

  // ── CONTACTO ─────────────────────────────────────────
  contacto: {
    email: 'info@group360.es',
    whatsapp: '34611251818',
    whatsappDisplay: '+34 611 25 18 18',
    direccion: 'Passeig de Les Palmeres 16',
    ciudad: 'Reus',
    provincia: 'Tarragona',
    pais: 'España',
    web: 'https://group365.vercel.app',
  },

  // ── REDES SOCIALES ───────────────────────────────────
  redes: {
    instagram: 'https://www.instagram.com/group360iniciativas',
    tiktok: 'https://www.tiktok.com/@group360iniciativas',
    facebook: '',
    linkedin: '',
    youtube: '',
  },

  // ── COLORES ──────────────────────────────────────────
  colores: {
    primario: '#1B7F6F',
    secundario: '#C9A84C',
    fondo: '#0F1419',
    fondoCard: '#161D26',
    texto: '#8B96A5',
  },

  // ── TEXTOS LANDING (HERO) ────────────────────────────
  hero: {
    tagline: 'Visión 360° del Mercado Inmobiliario',
    titulo: 'Propiedades Premium',
    tituloDestacado: 'En España',
    subtitulo: 'Propiedades premium en las mejores ubicaciones de España. Asesoría experta, resultados garantizados.',
    ctaPrimario: 'Explorar Propiedades',
    ctaSecundario: 'Hablar con un Experto',
  },

  // ── ESTADÍSTICAS ─────────────────────────────────────
  stats: {
    propiedadesVendidas: 320,
    clientesSatisfechos: 180,
    anosExperiencia: 15,
    roiPromedio: '5.2',
  },

  // ── SERVICIOS ────────────────────────────────────────
  servicios: [
    {
      num: '01',
      titulo: 'Compra de Propiedades',
      desc: 'Te guiamos en cada paso de la compra, desde la búsqueda hasta la firma en notaría con total seguridad jurídica.',
      href: '/compras',
    },
    {
      num: '02',
      titulo: 'Alquileres Turísticos',
      desc: 'Villas exclusivas en las mejores ubicaciones de España. Alta ocupación y retorno vacacional garantizado.',
      href: '/alquileres',
    },
    {
      num: '03',
      titulo: 'Inversión Inmobiliaria',
      desc: 'Asesoría estratégica con ROI del 4-6% anual. Oportunidades seleccionadas que no llegan al mercado abierto.',
      href: '/inversores',
    },
    {
      num: '04',
      titulo: 'Deuda Bancaria',
      desc: 'Propiedades 15-25% bajo precio de mercado. Proceso legal completo con negociación directa al banco.',
      href: '/inversores',
    },
  ],

  // ── TESTIMONIOS ──────────────────────────────────────
  testimonios: [
    {
      nombre: 'Carlos M.',
      ubicacion: 'Madrid',
      texto: 'Invertí €180.000 en Madrid y obtengo €750 al mes. El proceso fue completamente transparente y el equipo siempre estuvo disponible.',
      roi: '5%',
    },
    {
      nombre: 'Ana García',
      ubicacion: 'Valencia',
      texto: 'Encontré mi villa ideal en la Costa del Sol. Atención excepcional desde el primer contacto y una gestión verdaderamente impecable.',
      roi: '6%',
    },
    {
      nombre: 'Roberto L.',
      ubicacion: 'Barcelona',
      texto: 'La propiedad bancaria que compramos estaba un 20% por debajo del precio de mercado. Un servicio verdaderamente exclusivo.',
      roi: '5.7%',
    },
  ],

  // ── ZONAS DE OPERACIÓN ───────────────────────────────
  zonas: ['Madrid', 'Barcelona', 'Costa del Sol', 'Valencia', 'Alicante', 'Marbella', 'Sevilla', 'Bilbao', 'Tarragona', 'Reus'],

  // ── INVERSIÓN — PROCESO ──────────────────────────────
  inversion: {
    reserva: '€6.000',
    descuentoMercado: '15-25%',
    honorarios: '€20.000',
    roiMin: '4%',
    roiMax: '6%',
    respuestaBanco: '7 días hábiles',
    firmaNotarial: '30-90 días',
  },

  // ── PORTAL INVERSORES ────────────────────────────────
  inversores: {
    titulo: 'Inversión Inmobiliaria Inteligente',
    subtitulo: 'Accede a oportunidades que no llegan al mercado. Dashboard personalizado, alertas exclusivas y gestor dedicado.',
  },

  // ── SEO ──────────────────────────────────────────────
  seo: {
    titulo: 'GROUP 360 INICIATIVAS — Inmobiliaria Premium España',
    descripcion: 'Propiedades premium, inversión en deuda bancaria y alquileres turísticos en España. GROUP 360 INICIATIVAS — Visión 360° del mercado inmobiliario.',
    keywords: 'inmobiliaria españa, propiedades premium, inversión inmobiliaria, alquiler turístico, deuda bancaria',
    ogImage: '/logo.png',
  },
} as const

// Helpers
export const waLink = (msg?: string) =>
  `https://wa.me/${config.contacto.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`

export const direccionCompleta = () =>
  `${config.contacto.direccion}, ${config.contacto.ciudad}, ${config.contacto.provincia}`
