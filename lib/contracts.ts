// ═══════════════════════════════════════════════════════
// MÓDULO DE CONTRATOS — GROUP 360 INICIATIVAS
// Definición de los tipos de contrato, sus campos variables
// y las plantillas editables (con marcadores {{campo}}).
// ═══════════════════════════════════════════════════════

export type CampoTipo = 'text' | 'date' | 'number' | 'textarea' | 'email'

export interface CampoDef {
  key: string
  label: string
  tipo: CampoTipo
  placeholder?: string
}

export interface ContratoTipoDef {
  id: string
  nombre: string
  descripcion: string
  emoji: string
  campos: CampoDef[]
  // Plantilla por defecto — editable por el admin. Usa {{key}} como marcadores.
  plantilla: string
}

// Campos comunes a todos los contratos (partes firmantes + destinatario del email)
const CAMPO_DESTINATARIO: CampoDef[] = [
  { key: 'nombre_destinatario', label: 'Nombre del destinatario', tipo: 'text', placeholder: 'Ej. Carlos Martínez' },
  { key: 'email_destinatario', label: 'Email del destinatario', tipo: 'email', placeholder: 'cliente@email.com' },
]

export const CONTRACT_TYPES: ContratoTipoDef[] = [
  // ── 1. LOI ─────────────────────────────────────────────
  {
    id: 'loi',
    nombre: 'Carta de Intención (LOI)',
    descripcion: 'Documento de intención de compra no vinculante que fija los términos base de una futura operación.',
    emoji: '📝',
    campos: [
      ...CAMPO_DESTINATARIO,
      { key: 'parte_compradora', label: 'Parte compradora', tipo: 'text', placeholder: 'Nombre / razón social del comprador' },
      { key: 'parte_vendedora', label: 'Parte vendedora', tipo: 'text', placeholder: 'Nombre / razón social del vendedor' },
      { key: 'propiedad', label: 'Propiedad / activo', tipo: 'text', placeholder: 'Villa en Marbella, ref. 001' },
      { key: 'importe', label: 'Importe ofertado (€)', tipo: 'number', placeholder: '650000' },
      { key: 'deposito', label: 'Depósito de reserva (€)', tipo: 'number', placeholder: '6000' },
      { key: 'plazo_exclusividad', label: 'Plazo de exclusividad', tipo: 'text', placeholder: '30 días naturales' },
      { key: 'fecha', label: 'Fecha del documento', tipo: 'date' },
    ],
    plantilla: `CARTA DE INTENCIÓN (LETTER OF INTENT)

En {{ciudad}}, a {{fecha}}.

REUNIDOS

De una parte, {{parte_compradora}} (en adelante, la "Parte Compradora").
De otra parte, {{parte_vendedora}} (en adelante, la "Parte Vendedora").

EXPONEN

Que la Parte Compradora ha manifestado su interés en la adquisición del siguiente activo inmobiliario: {{propiedad}}.

Que ambas partes desean dejar constancia de los términos esenciales que regirán la negociación de una futura operación de compraventa, sin que la presente carta constituya obligación vinculante de contratar, salvo en las cláusulas de exclusividad y confidencialidad.

CLÁUSULAS

PRIMERA. Objeto. La Parte Compradora manifiesta su intención de adquirir {{propiedad}} por un importe de {{importe}} euros.

SEGUNDA. Depósito de reserva. En señal de buena fe, la Parte Compradora entregará un depósito de {{deposito}} euros, imputable al precio final de compraventa.

TERCERA. Exclusividad. La Parte Vendedora se compromete a mantener la exclusividad de negociación con la Parte Compradora durante un plazo de {{plazo_exclusividad}}, absteniéndose de negociar con terceros.

CUARTA. Naturaleza no vinculante. Salvo las cláusulas de exclusividad y confidencialidad, la presente Carta de Intención no genera obligación de contratar. La operación quedará supeditada a la firma del contrato definitivo y a la due diligence correspondiente.

QUINTA. Confidencialidad. Las partes mantendrán la confidencialidad de la información intercambiada.

Y en prueba de conformidad, firman el presente documento por duplicado.


____________________________               ____________________________
La Parte Compradora                         La Parte Vendedora
{{parte_compradora}}                        {{parte_vendedora}}`,
  },

  // ── 2. Compraventa ─────────────────────────────────────
  {
    id: 'compraventa',
    nombre: 'Contrato de Compraventa',
    descripcion: 'Contrato de compraventa de bien inmueble con arras y condiciones de pago.',
    emoji: '🏠',
    campos: [
      ...CAMPO_DESTINATARIO,
      { key: 'vendedor', label: 'Vendedor', tipo: 'text', placeholder: 'Nombre / razón social y NIF' },
      { key: 'comprador', label: 'Comprador', tipo: 'text', placeholder: 'Nombre / razón social y NIF' },
      { key: 'propiedad', label: 'Descripción del inmueble', tipo: 'textarea', placeholder: 'Vivienda sita en... referencia catastral...' },
      { key: 'precio', label: 'Precio total (€)', tipo: 'number', placeholder: '650000' },
      { key: 'arras', label: 'Arras / señal (€)', tipo: 'number', placeholder: '65000' },
      { key: 'forma_pago', label: 'Forma de pago', tipo: 'text', placeholder: 'Transferencia bancaria en la firma notarial' },
      { key: 'fecha_escritura', label: 'Fecha límite de escritura', tipo: 'date' },
      { key: 'fecha', label: 'Fecha del contrato', tipo: 'date' },
    ],
    plantilla: `CONTRATO DE COMPRAVENTA DE INMUEBLE

En {{ciudad}}, a {{fecha}}.

REUNIDOS

De una parte, {{vendedor}} (en adelante, el "Vendedor").
De otra parte, {{comprador}} (en adelante, el "Comprador").

Ambas partes se reconocen mutuamente capacidad legal suficiente para contratar y

EXPONEN

Que el Vendedor es titular en pleno dominio del siguiente inmueble:
{{propiedad}}

Que el Comprador está interesado en adquirir dicho inmueble en las condiciones que a continuación se detallan.

CLÁUSULAS

PRIMERA. Objeto. El Vendedor vende y el Comprador compra el inmueble descrito, libre de cargas, gravámenes y arrendatarios, y al corriente de pago de tributos y gastos.

SEGUNDA. Precio. El precio total de la compraventa se fija en {{precio}} euros.

TERCERA. Arras. En este acto el Comprador entrega la cantidad de {{arras}} euros en concepto de arras, imputables al precio total.

CUARTA. Forma de pago. El resto del precio se abonará mediante {{forma_pago}}.

QUINTA. Escritura pública. Las partes se obligan a otorgar escritura pública de compraventa antes del {{fecha_escritura}}. Los gastos e impuestos se distribuirán conforme a la ley.

SEXTA. Entrega. La posesión del inmueble se entregará en el momento del otorgamiento de la escritura pública.

Y en prueba de conformidad, firman el presente contrato por duplicado.


____________________________               ____________________________
El Vendedor                                 El Comprador
{{vendedor}}                                {{comprador}}`,
  },

  // ── 3. Alquiler vacacional ─────────────────────────────
  {
    id: 'alquiler_vacacional',
    nombre: 'Contrato de Alquiler Vacacional',
    descripcion: 'Contrato de arrendamiento de temporada / uso turístico con fianza y fechas de estancia.',
    emoji: '🏖️',
    campos: [
      ...CAMPO_DESTINATARIO,
      { key: 'arrendador', label: 'Arrendador', tipo: 'text', placeholder: 'GRUPO 360 INICIATIVAS S.L.' },
      { key: 'arrendatario', label: 'Arrendatario / huésped', tipo: 'text', placeholder: 'Nombre y documento del huésped' },
      { key: 'propiedad', label: 'Vivienda / propiedad', tipo: 'text', placeholder: 'Villa en Costa del Sol' },
      { key: 'fecha_entrada', label: 'Fecha de entrada', tipo: 'date' },
      { key: 'fecha_salida', label: 'Fecha de salida', tipo: 'date' },
      { key: 'importe', label: 'Importe de la estancia (€)', tipo: 'number', placeholder: '2400' },
      { key: 'fianza', label: 'Fianza (€)', tipo: 'number', placeholder: '500' },
      { key: 'huespedes', label: 'Nº de huéspedes', tipo: 'number', placeholder: '4' },
      { key: 'fecha', label: 'Fecha del contrato', tipo: 'date' },
    ],
    plantilla: `CONTRATO DE ARRENDAMIENTO DE VIVIENDA DE USO TURÍSTICO

En {{ciudad}}, a {{fecha}}.

REUNIDOS

De una parte, {{arrendador}} (en adelante, el "Arrendador").
De otra parte, {{arrendatario}} (en adelante, el "Arrendatario").

CLÁUSULAS

PRIMERA. Objeto. El Arrendador cede en arrendamiento de temporada, para uso vacacional, la vivienda: {{propiedad}}.

SEGUNDA. Duración. La estancia comprende desde el {{fecha_entrada}} (entrada) hasta el {{fecha_salida}} (salida), sin que el presente contrato genere prórroga ni derecho de permanencia alguno.

TERCERA. Ocupación. La vivienda se destinará a un máximo de {{huespedes}} huéspedes. Queda prohibida la cesión o subarriendo.

CUARTA. Precio. El importe total de la estancia asciende a {{importe}} euros, que el Arrendatario abonará conforme a las condiciones de reserva.

QUINTA. Fianza. El Arrendatario entrega {{fianza}} euros en concepto de fianza, que le será reintegrada a la salida una vez verificado el buen estado de la vivienda.

SEXTA. Obligaciones del Arrendatario. Hacer un uso diligente de la vivienda, respetar las normas de convivencia y responder de los daños que se ocasionen durante la estancia.

SÉPTIMA. Normativa. El presente contrato se rige por la normativa de viviendas de uso turístico aplicable.

Y en prueba de conformidad, firman el presente contrato.


____________________________               ____________________________
El Arrendador                               El Arrendatario
{{arrendador}}                              {{arrendatario}}`,
  },

  // ── 4. NDA ─────────────────────────────────────────────
  {
    id: 'nda',
    nombre: 'Acuerdo de Confidencialidad (NDA)',
    descripcion: 'Acuerdo de no divulgación para proteger la información sensible compartida entre las partes.',
    emoji: '🔒',
    campos: [
      ...CAMPO_DESTINATARIO,
      { key: 'parte_reveladora', label: 'Parte reveladora', tipo: 'text', placeholder: 'GRUPO 360 INICIATIVAS S.L.' },
      { key: 'parte_receptora', label: 'Parte receptora', tipo: 'text', placeholder: 'Nombre / razón social' },
      { key: 'objeto', label: 'Objeto / información protegida', tipo: 'textarea', placeholder: 'Cartera de activos, condiciones de inversión...' },
      { key: 'duracion', label: 'Duración de la obligación', tipo: 'text', placeholder: '3 años desde la firma' },
      { key: 'jurisdiccion', label: 'Jurisdicción', tipo: 'text', placeholder: 'Juzgados de Tarragona' },
      { key: 'fecha', label: 'Fecha del acuerdo', tipo: 'date' },
    ],
    plantilla: `ACUERDO DE CONFIDENCIALIDAD (NON-DISCLOSURE AGREEMENT)

En {{ciudad}}, a {{fecha}}.

REUNIDOS

De una parte, {{parte_reveladora}} (en adelante, la "Parte Reveladora").
De otra parte, {{parte_receptora}} (en adelante, la "Parte Receptora").

EXPONEN

Que las partes desean iniciar conversaciones y para ello la Parte Reveladora facilitará a la Parte Receptora información confidencial relativa a: {{objeto}}.

CLÁUSULAS

PRIMERA. Información confidencial. Se considera confidencial toda información, técnica, comercial, financiera o de cualquier otra índole, revelada por escrito, verbalmente o por cualquier medio, en relación con el objeto arriba descrito.

SEGUNDA. Obligaciones. La Parte Receptora se compromete a: (i) mantener la información en estricta confidencialidad; (ii) no divulgarla a terceros sin autorización escrita; y (iii) utilizarla exclusivamente para la finalidad prevista.

TERCERA. Exclusiones. No tendrá carácter confidencial la información que sea de dominio público, que ya obrara legítimamente en poder de la Parte Receptora, o cuya divulgación sea exigida por ley o autoridad competente.

CUARTA. Duración. Las obligaciones de confidencialidad se mantendrán durante {{duracion}}.

QUINTA. Incumplimiento. El incumplimiento de este acuerdo dará derecho a la Parte Reveladora a reclamar los daños y perjuicios ocasionados.

SEXTA. Ley y jurisdicción. El presente acuerdo se rige por la legislación española, sometiéndose las partes a {{jurisdiccion}}.

Y en prueba de conformidad, firman el presente acuerdo.


____________________________               ____________________________
La Parte Reveladora                         La Parte Receptora
{{parte_reveladora}}                        {{parte_receptora}}`,
  },

  // ── 5. Inversión SPV ───────────────────────────────────
  {
    id: 'inversion_spv',
    nombre: 'Contrato de Inversión (SPV)',
    descripcion: 'Acuerdo de participación de un inversor en una sociedad vehículo (SPV) para un proyecto inmobiliario.',
    emoji: '📈',
    campos: [
      ...CAMPO_DESTINATARIO,
      { key: 'inversor', label: 'Inversor', tipo: 'text', placeholder: 'Nombre / razón social y NIF' },
      { key: 'sociedad_spv', label: 'Sociedad vehículo (SPV)', tipo: 'text', placeholder: 'GROUP 360 SPV I, S.L.' },
      { key: 'proyecto', label: 'Proyecto / activo', tipo: 'text', placeholder: 'Adquisición cartera distressed Madrid' },
      { key: 'importe_inversion', label: 'Importe de la inversión (€)', tipo: 'number', placeholder: '180000' },
      { key: 'participacion', label: 'Participación (%)', tipo: 'text', placeholder: '12%' },
      { key: 'roi_estimado', label: 'ROI estimado', tipo: 'text', placeholder: '5,2% anual' },
      { key: 'plazo', label: 'Plazo / horizonte', tipo: 'text', placeholder: '36 meses' },
      { key: 'fecha', label: 'Fecha del contrato', tipo: 'date' },
    ],
    plantilla: `CONTRATO DE INVERSIÓN EN SOCIEDAD VEHÍCULO (SPV)

En {{ciudad}}, a {{fecha}}.

REUNIDOS

De una parte, {{sociedad_spv}} (en adelante, la "Sociedad" o "SPV"), gestionada por GRUPO 360 INICIATIVAS S.L.
De otra parte, {{inversor}} (en adelante, el "Inversor").

EXPONEN

Que la Sociedad ha sido constituida como vehículo de inversión para el desarrollo del siguiente proyecto: {{proyecto}}.

Que el Inversor desea participar en dicho proyecto en los términos que se detallan a continuación.

CLÁUSULAS

PRIMERA. Objeto. El Inversor aporta a la Sociedad la cantidad de {{importe_inversion}} euros, destinada íntegramente a la ejecución del proyecto.

SEGUNDA. Participación. Como contraprestación, el Inversor adquiere una participación del {{participacion}} en los resultados de la Sociedad.

TERCERA. Rentabilidad estimada. La rentabilidad objetivo estimada del proyecto es de {{roi_estimado}}, con carácter no garantizado, dependiente de la evolución del mercado y del propio proyecto.

CUARTA. Horizonte temporal. El horizonte previsto de la inversión es de {{plazo}}, momento en el que se procederá a la desinversión y reparto de resultados.

QUINTA. Gestión. La gestión del proyecto corresponde a GRUPO 360 INICIATIVAS S.L., que reportará periódicamente al Inversor sobre la evolución del mismo.

SEXTA. Riesgo. El Inversor declara conocer que toda inversión conlleva riesgo, incluida la posible pérdida total o parcial del capital aportado.

SÉPTIMA. Confidencialidad. Las partes mantendrán la confidencialidad de la información relativa a la Sociedad y al proyecto.

Y en prueba de conformidad, firman el presente contrato.


____________________________               ____________________________
Por la Sociedad (SPV)                       El Inversor
GRUPO 360 INICIATIVAS S.L.                  {{inversor}}`,
  },

  // ── 6. Personal Shopper Inmobiliario (PSI) ─────────────
  {
    id: 'personal_shopper',
    nombre: 'Contrato de Personal Shopper',
    descripcion: 'Contrato privado de prestación de servicio de Personal Shopper Inmobiliario (PSI): búsqueda, análisis y negociación de activos para el cliente inversor.',
    emoji: '🕵️',
    campos: [
      ...CAMPO_DESTINATARIO,
      { key: 'cliente', label: 'Cliente comprador / inversor', tipo: 'text', placeholder: 'Nombre y apellidos' },
      { key: 'dni_cliente', label: 'DNI / NIE del cliente', tipo: 'text', placeholder: '00000000X' },
      { key: 'domicilio_cliente', label: 'Domicilio del cliente', tipo: 'text', placeholder: 'Domicilio completo del cliente' },
      { key: 'perfil_busqueda', label: 'Perfil de búsqueda / mandato', tipo: 'textarea', placeholder: 'Tipo de activo, zona, presupuesto máximo, rentabilidad objetivo...' },
      { key: 'honorarios', label: 'Honorarios del PSI', tipo: 'text', placeholder: 'Ej. 5% + IVA sobre el precio de compra' },
      { key: 'provision_fondos', label: 'Provisión de fondos (€)', tipo: 'number', placeholder: '3000' },
      { key: 'importe_escritura', label: 'Importe restante en escritura', tipo: 'text', placeholder: 'Resto de honorarios a la firma notarial' },
      { key: 'fecha', label: 'Fecha del contrato', tipo: 'date' },
    ],
    plantilla: `CONTRATO PRIVADO DE PRESTACIÓN DE SERVICIO DE PERSONAL SHOPPER INMOBILIARIO (PSI)

En {{ciudad}}, a {{fecha}}.

DE UNA PARTE

GROUP 360 INICIATIVAS, S.L., con CIF B13911979 y domicilio social en Reus, Tarragona, representada por D. José Luis Jiménez Cortés, mayor de edad, con NIE X7631709X y domicilio en Plaza Libertad 15 2-2 Reus, en calidad de Administrador; en adelante, EL PERSONAL SHOPPER INMOBILIARIO (PSI).

Y DE OTRA PARTE

D./Dña. {{cliente}}, mayor de edad, con DNI {{dni_cliente}} y domicilio en {{domicilio_cliente}}, actuando en su propio nombre y derecho; en adelante, el CLIENTE COMPRADOR/A-INVERSOR/A.

Ambas partes actúan en su propio nombre y derecho y se reconocen mutua y recíprocamente capacidad legal suficiente para el otorgamiento del presente contrato de PERSONAL SHOPPER INMOBILIARIO, y a tal fin:

EXPONEN

PRIMERO. Que el CLIENTE comprador (inversor) encarga mediante el presente contrato al PSI la búsqueda y gestión de la adquisición de uno o varios activos inmobiliarios para inversión, uso propio o desarrollo patrimonial, mediante compraventa de productos bancarios o de fondos (inversiones y fondos institucionales), conforme al siguiente perfil de búsqueda:
{{perfil_busqueda}}

MANDATOS DE INVERSIÓN

• NPL.
• Subasta.
• REO.
• Cesión de remate.
• Producto ocupado con procesos judiciales.
• Activos litigiosos.
• Suelo, hoteles, etc.

SEGUNDO. Que el PSI dispone de experiencia, conocimiento técnico, coordinación con abogados, arquitectos, notarios y entidades financieras, red de colaboradores, plataformas y herramientas de análisis, y acceso a oportunidades inmobiliarias tanto públicas como privadas (off market).

TERCERO. Que ambas partes desean regular su relación profesional mediante el presente contrato.

Por ello,

ACUERDAN

PRIMERA. OBJETO

El presente contrato tiene por objeto la prestación de un servicio integral de PERSONAL SHOPPER INMOBILIARIO destinado a localizar, analizar, negociar y acompañar al CLIENTE durante todo el proceso de adquisición de activos inmobiliarios.

El servicio podrá comprender, entre otros:

• Definición del perfil inversor.
• Diseño de la estrategia de inversión.
• Búsqueda activa de oportunidades.
• Acceso a inmuebles fuera de mercado (off market).
• Análisis de rentabilidad.
• Estudio financiero.
• Due diligence documental (identificación de riesgos).
• Estudio urbanístico.
• Valoración económica.
• Negociación con propietarios, entidades bancarias y fondos.
• Coordinación con abogados, arquitectos, notarios y entidades financieras.
• Acompañamiento hasta la firma de la escritura pública.

SEGUNDA. SERVICIOS INCLUIDOS

El PSI podrá prestar cualquiera de los siguientes servicios:

• Localización de activos.
• Análisis de mercado.
• Estudios de rentabilidad.
• Valoración del riesgo.
• Cálculo de ROI.
• Estudio de cash flow (flujo de caja).
• Estrategias de reforma.
• Estrategias de rentabilidad.
• Gestión de financiación.
• Negociación del precio.
• Coordinación documental.
• Seguimiento hasta la compra.

TERCERA. OBLIGACIONES DEL PSI

El PSI actuará con la máxima diligencia profesional. No garantiza la compra de un inmueble determinado ni una rentabilidad concreta; se compromete únicamente a emplear todos los medios profesionales razonables para alcanzar los objetivos del CLIENTE y el mayor ROI posible.

BÚSQUEDA. El PSI se compromete a buscar inmuebles con las características requeridas por el CLIENTE en el expositivo primero, filtrando todos los productos que reúnan los citados requisitos y elaborando un informe lo más completo posible que remitirá al CLIENTE. Incluye revisión procesal, fase judicial, estado ocupacional, cargas hipotecarias y responsabilidad hipotecaria.

ACOMPAÑAMIENTO. Durante todo el proceso de oferta bancaria, negociación y cierre. El PSI redacta y presenta la oferta de quita al banco o fondo acreedor en nombre del inversor, y coordina todos los plazos y trámites con la entidad financiera y los servicios implicados.

NEGOCIACIÓN. El PSI negociará con el fondo, la entidad bancaria o quien esté encargado de gestionar la venta, en nombre del CLIENTE, el precio y las condiciones de la transacción, intentando conseguir el menor precio posible mediante la correspondiente oferta.

ASESORAMIENTO. El PSI asesorará al CLIENTE en todos los trámites de la compra, venta y postventa del inmueble.

CUARTA. OBLIGACIONES DEL CLIENTE

El CLIENTE se obliga a:

• Facilitar información veraz.
• Acreditar solvencia cuando sea requerida.
• Comunicar cualquier negociación realizada por su cuenta.
• No ocultar operaciones relacionadas con inmuebles presentados por el PSI.
• Pasar el PBC (Prevención del Blanqueo de Capitales) y aportar toda la documentación necesaria para la compra.

El inversor se compromete con GROUP 360 a mantener el derecho de tanteo durante los dieciocho (18) meses siguientes, con honorarios del 5% más IVA sobre el precio de venta de mercado, garantizando el PSI la mayor rentabilidad y gestión, incluyendo todo el marketing promocional, fotografías y publicaciones en todas las plataformas de venta.

CAPACIDAD ECONÓMICA. El CLIENTE comprador declara disponer de capacidad económica suficiente para adquirir un inmueble en el precio señalado en el expositivo primero.

QUINTA. EXCLUSIVIDAD

Durante la vigencia del contrato, el CLIENTE encomienda en exclusiva al PSI la búsqueda del inmueble objeto del presente contrato.

El CLIENTE no podrá adquirir, directa o indirectamente, ningún inmueble presentado por el PSI sin su intervención, ni poner la información facilitada por el PSI a disposición de cualquiera de sus parientes en línea directa o colateral para que sean ellos quienes realicen la compraventa a espaldas del PSI.

El CLIENTE se obliga a pagar los honorarios del PSI aun en el supuesto de que haya expirado el plazo de vigencia del presente contrato, cuando adquiera cualquiera de las propiedades que le haya ofrecido el PSI o sobre las que le haya transmitido información. Esta obligación se extenderá durante los doce (12) meses siguientes a la finalización del contrato respecto de cualquier inmueble presentado o negociado por el PSI.

GROUP 360 gestiona una cartera exclusiva con base de datos de inmuebles procedentes de fondos de inversión y entidades bancarias en procesos judiciales activos, con acceso directo a plataformas y herramientas de análisis y a oportunidades inmobiliarias tanto públicas como privadas. GROUP 360 INICIATIVAS, S.L. actúa como mandatario y asesor estratégico en la localización, análisis y coordinación de operaciones.

SEXTA. ACEPTACIÓN DEL ENCARGO

El PSI acepta el encargo del CLIENTE de buscarle la vivienda o activo que reúna los requisitos enumerados en el expositivo primero, llevando a cabo las partes el presente contrato de Personal Shopper Inmobiliario de acuerdo con las cláusulas aquí recogidas.

SÉPTIMA. CONFLICTO DE INTERÉS

El PSI declara que se obliga a:

• Preservar cualquier información confidencial y no desvelar a los demás clientes la existencia de ofertas o acuerdos encaminados a la adquisición de la propiedad objeto del presente contrato.
• Trabajar con equidad en el supuesto de que varios de sus clientes compitan por la misma propiedad, dando siempre prioridad al primer inversor al que se le haya presentado el activo.

OCTAVA. HONORARIOS

Los honorarios del PSI serán de {{honorarios}} y se devengarán en las siguientes fases:

PROVISIÓN DE FONDOS. El CLIENTE ingresará al PSI la cantidad de {{provision_fondos}} euros en concepto de provisión de fondos para los gastos que el presente encargo le pueda suponer, a la firma del presente contrato. El número de cuenta para el ingreso de los honorarios es el siguiente: CAIXABANK ES68 2100 3381 5122 0037 3587 (Group 360 Iniciativas S.L.).

Esta cantidad es reembolsable en el caso de que la operación no fuera exitosa, devengándose únicamente el 10% del total de los honorarios por gastos de gestión, tiempo y servicio, y pudiendo servir la misma provisión de fondos para posteriores operaciones.

PARTE RESTANTE. En el momento de la escritura pública se abonará la cantidad de {{importe_escritura}}. Dicha cantidad del PSI se descontará del precio final pactado entre CLIENTE y PSI sobre el total del precio de compra.

Ambas partes aceptan libremente todos los términos del presente contrato, declarando expresamente que con él no se violan los términos de ningún otro contrato con una tercera parte.

Y para que así conste, suscriben el presente documento por duplicado ejemplar y a un solo efecto, en {{ciudad}}, a {{fecha}}.


____________________________               ____________________________
GROUP 360 INICIATIVAS S.L.                  El Cliente Comprador/Inversor
                                            {{cliente}}`,
  },
]

export const getContractType = (id: string): ContratoTipoDef | undefined =>
  CONTRACT_TYPES.find(t => t.id === id)

// Sustituye los marcadores {{key}} de una plantilla por los valores de `datos`.
// Los campos vacíos se dejan como una línea de subrayado para rellenar a mano.
export function renderPlantilla(plantilla: string, datos: Record<string, any>): string {
  return plantilla.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const val = datos?.[key]
    if (val === undefined || val === null || String(val).trim() === '') {
      return '________________'
    }
    return String(val)
  })
}

// Etiqueta legible del estado de un contrato.
export const ESTADO_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  generado: 'PDF generado',
  enviado: 'Enviado',
  firmado: 'Firmado',
  error: 'Error',
}
