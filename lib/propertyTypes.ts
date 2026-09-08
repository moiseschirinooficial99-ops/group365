// ═══════════════════════════════════════════════════════
// TIPOS DE PROPIEDAD — para el filtro del buscador
//
// La tabla `properties` solo guarda 5 categorías (villa, house,
// apartment, office, land) — es el mismo mapeo que usa el importador de
// Inmovilla (scripts/import-inmovilla.mjs, objeto TIPOS). Aquí se agrupan
// los nombres reales del feed bajo cada categoría, para que el buscador
// hable el idioma del cliente ("Piso", "Chalet", "Local comercial"...)
// aunque por debajo filtre por la categoría guardada.
// ═══════════════════════════════════════════════════════

export type PropertyTypeBucket = 'apartment' | 'house' | 'villa' | 'office' | 'land'

export const PROPERTY_TYPE_GROUPS: { bucket: PropertyTypeBucket; label: string; types: string[] }[] = [
  {
    bucket: 'apartment',
    label: 'Piso y apartamento',
    types: ['Piso', 'Apartamento', 'Departamento', 'Ático', 'Dúplex', 'Estudio', 'Planta baja'],
  },
  {
    bucket: 'house',
    label: 'Casa',
    types: ['Casa', 'Adosado', 'Pareado', 'Emparejado', 'Casa Tipo Dúplex', 'Caserón', 'Cortijo', 'Hogar'],
  },
  {
    bucket: 'villa',
    label: 'Villa y chalet',
    types: ['Chalet', 'Villa de Lujo'],
  },
  {
    bucket: 'office',
    label: 'Local, oficina y garaje',
    types: ['Local comercial', 'Oficina', 'Nave industrial', 'Negocio', 'Edificio', 'Hotel', 'Almacén', 'Garaje', 'Garage incluido', 'Aparcamiento', 'Trastero'],
  },
  {
    bucket: 'land',
    label: 'Terreno y finca',
    types: ['Terreno urbano', 'Suelo urbano', 'Terreno urbanizable', 'Terreno Rústico', 'Terreno rural', 'Parcela', 'Finca Rústica', 'Finca Cinegética'],
  },
]
