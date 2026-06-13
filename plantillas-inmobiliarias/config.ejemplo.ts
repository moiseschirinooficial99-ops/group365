// ═══════════════════════════════════════════════════════
// EJEMPLO DE CONFIG PARA NUEVA AGENCIA INMOBILIARIA
// Copia este archivo a lib/config.ts y personaliza
// ═══════════════════════════════════════════════════════

export const config = {
  empresa: {
    nombre: 'NOVA REALTY',                        // ← Nombre corto (aparece en logo)
    nombreCompleto: 'Nova Realty Inversiones S.L.', // ← Nombre legal completo
    slogan: 'Inversiones',                          // ← Subtítulo bajo el logo
    nif: 'B12345678',                               // ← NIF/CIF de la empresa
    descripcion: 'Tu agencia inmobiliaria de confianza. Propiedades exclusivas en toda España.',
    fundada: '2015',
    experiencia: '10+',
  },

  contacto: {
    email: 'hola@novarealty.es',
    whatsapp: '34666777888',                   // ← Sin + ni espacios (formato internacional)
    whatsappDisplay: '+34 666 777 888',        // ← Cómo se muestra al usuario
    direccion: 'Calle Gran Vía 45, 3ºA',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    pais: 'España',
    web: 'https://novarealty.es',
  },

  redes: {
    instagram: 'https://www.instagram.com/novarealtyinversiones',
    tiktok: '',                                // ← Dejar vacío si no tienes
    facebook: 'https://www.facebook.com/novarealty',
    linkedin: '',
    youtube: '',
  },

  colores: {
    primario: '#1B7F6F',    // ← Verde principal (botones, acentos)
    secundario: '#C9A84C',  // ← Dorado (degradados)
    fondo: '#0F1419',       // ← Fondo oscuro general
    fondoCard: '#161D26',   // ← Fondo de tarjetas
    texto: '#8B96A5',       // ← Texto secundario
  },

  hero: {
    tagline: 'Tu Agencia de Confianza en Madrid',
    titulo: 'Propiedades Exclusivas',
    tituloDestacado: 'En Madrid',
    subtitulo: 'Más de 10 años conectando familias con su hogar ideal. Asesoramiento experto, proceso transparente.',
    ctaPrimario: 'Ver Propiedades',
    ctaSecundario: 'Hablar con Agente',
  },

  stats: {
    propiedadesVendidas: 150,   // ← Número real de ventas
    clientesSatisfechos: 95,
    anosExperiencia: 10,
    roiPromedio: '4.8',         // ← Sin símbolo %
  },

  servicios: [
    {
      num: '01',
      titulo: 'Compra de Vivienda',
      desc: 'Te acompañamos desde la primera visita hasta la firma en notaría. Gestión completa y transparente.',
      href: '/compras',
    },
    {
      num: '02',
      titulo: 'Venta de Propiedades',
      desc: 'Valoramos tu propiedad al precio justo y la vendemos rápido con nuestra red de compradores.',
      href: '/vender',
    },
    {
      num: '03',
      titulo: 'Alquiler',
      desc: 'Propiedades en alquiler en las mejores zonas. Gestión completa para propietarios e inquilinos.',
      href: '/alquileres',
    },
    {
      num: '04',
      titulo: 'Inversión',
      desc: 'Oportunidades de inversión seleccionadas con ROI garantizado y asesoría personalizada.',
      href: '/inversores',
    },
  ],

  testimonios: [
    {
      nombre: 'María P.',
      ubicacion: 'Chamberí, Madrid',
      texto: 'Encontré mi piso en menos de 3 semanas. El proceso fue muy sencillo y el equipo siempre estuvo disponible.',
      roi: '4.5%',
    },
    {
      nombre: 'Juan L.',
      ubicacion: 'Salamanca, Madrid',
      texto: 'Vendí mi propiedad por encima del precio esperado. Profesionales de verdad.',
      roi: '5.2%',
    },
    {
      nombre: 'Sofía R.',
      ubicacion: 'Retiro, Madrid',
      texto: 'El mejor servicio inmobiliario que he encontrado. Rápidos, honestos y con gran conocimiento del mercado.',
      roi: '4.8%',
    },
  ],

  zonas: ['Chamberí', 'Salamanca', 'Retiro', 'Centro', 'Arganzuela', 'Carabanchel', 'Latina', 'Moncloa'],

  inversion: {
    reserva: '€5.000',
    descuentoMercado: '10-20%',
    honorarios: '€15.000',
    roiMin: '4%',
    roiMax: '6%',
    respuestaBanco: '7 días hábiles',
    firmaNotarial: '30-60 días',
  },

  inversores: {
    titulo: 'Invierte con Seguridad',
    subtitulo: 'Oportunidades seleccionadas por nuestros expertos. Dashboard privado, alertas personalizadas y gestor dedicado.',
  },

  seo: {
    titulo: 'Nova Realty — Agencia Inmobiliaria Premium Madrid',
    descripcion: 'Compra, vende o invierte en inmuebles en Madrid con Nova Realty. Más de 10 años de experiencia y resultados garantizados.',
    keywords: 'inmobiliaria madrid, comprar piso madrid, vender casa madrid, inversión inmobiliaria',
    ogImage: '/logo.png',
  },
} as const

export const waLink = (msg?: string) =>
  `https://wa.me/${config.contacto.whatsapp}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`

export const direccionCompleta = () =>
  `${config.contacto.direccion}, ${config.contacto.ciudad}, ${config.contacto.provincia}`
