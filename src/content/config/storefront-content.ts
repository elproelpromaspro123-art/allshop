export const storefrontContent = {
  hero: {
    badge: "Compra contra entrega en Colombia",
    title: "Productos utiles, entrega visible y soporte real para comprar con mas criterio.",
    titleAccent: "con mas criterio",
    subtitle:
      "Mostramos precio, ahorro, cobertura y tiempos estimados antes de pedir para que decidir sea simple.",
    editorialKicker: "Compra real",
    editorialTitle: "Menos ruido, mas contexto util antes de confirmar.",
    editorialDescription:
      "La compra se siente mas seria cuando ves como pagas, cuanto puede tardar y que canal te responde si aparece una duda.",
    editorialNote:
      "Tambien puedes revisar cobertura, seguimiento y soporte sin salir del recorrido principal.",
    signals: {
      payment: "Pagas al recibir con confirmacion del pedido",
      support: "Soporte por WhatsApp y correo cuando lo necesites",
    },
    metrics: {
      paymentLabel: "Pago",
      coverageLabel: "Cobertura",
      deliveryLabel: "Entrega",
      paymentValue: "Pago al recibir",
      coverageValue: "Toda Colombia",
    },
  },
  statsBar: {
    eyebrow: "Senales de compra",
    title: "Lo importante aparece antes de confirmar.",
    description:
      "Pago, tiempo estimado, cobertura y soporte visibles desde el inicio.",
  },
  trust: {
    eyebrow: "Compra con respaldo real",
    title: "La informacion clave aparece antes del checkout.",
    description:
      "Pago al recibir, cobertura, garantia, seguimiento y soporte en el mismo flujo para que la compra no dependa de promesas vagas.",
    items: [
      {
        id: "guarantee",
        title: "Garantia visible",
        description: "Condiciones claras por producto y soporte cuando haga falta.",
      },
      {
        id: "payment",
        title: "Pagas al recibir",
        description: "No necesitas anticipos para confirmar tu pedido.",
      },
      {
        id: "returns",
        title: "Cambios y devoluciones",
        description: "El proceso se explica sin esconder pasos importantes.",
      },
      {
        id: "security",
        title: "Datos protegidos",
        description: "Formulario y confirmacion con controles visibles.",
      },
      {
        id: "support",
        title: "Soporte real",
        description: "Canales directos para resolver dudas antes y despues de comprar.",
      },
    ],
  },
  checkout: {
    eyebrow: "Pedido listo para confirmar",
    title: "Confirma tu compra sin pasos innecesarios.",
    description:
      "Pagas al recibir. Revisamos direccion, cobertura y contacto antes del despacho para que el pedido salga claro desde el principio.",
    sideKicker: "Antes de cerrar",
    sideTitle: "Lo importante queda visible en la misma pantalla.",
    sideDescription:
      "Revisas contacto, entrega, resumen y confirmaciones sin saltar entre pantallas ni buscar datos clave.",
    sideBullets: [
      "Direccion y contacto con errores visibles al instante.",
      "Cobertura y tiempo estimado segun la ciudad.",
      "Resumen final con total y envio antes de confirmar.",
    ],
    cards: [
      {
        title: "Datos de entrega",
        detail: "Formulario compacto, lectura clara y validacion visible.",
      },
      {
        title: "Contacto confirmado",
        detail: "Revisamos nombre, telefono y direccion antes del despacho.",
      },
      {
        title: "Contra entrega",
        detail: "Confirmas hoy y pagas cuando recibes el pedido.",
      },
    ],
    summaryKicker: "Resumen listo",
    summaryDescription:
      "El total, la modalidad de pago y las piezas del pedido quedan visibles antes de confirmar.",
    summaryMobileNote:
      "Revisa el total y confirma desde la barra fija inferior cuando termines.",
    summaryTrustItems: [
      "Pago al recibir con validacion de pedido",
      "Seguimiento incluido despues de confirmar",
      "Soporte para cambios y novedades del envio",
    ],
  },
  support: {
    title: "Te respondemos con contexto real de tu compra.",
    subtitle:
      "Soporte y seguimiento estan pensados para resolver dudas de producto, entrega, confirmacion y novedades sin respuestas genericas.",
    responseTimes:
      "Respondemos por correo y canales directos con contexto del pedido y del catalogo actual.",
    checklist: [
      "Producto o referencia que quieres revisar.",
      "Ciudad o departamento para validar cobertura.",
      "Numero de pedido o correo usado al comprar, si ya confirmaste.",
    ],
    tracking: [
      "Busca tu pedido con el correo usado al comprar.",
      "Revisa confirmacion, estado y referencias sin depender del chat.",
      "Si hay una novedad, soporte recibe el contexto del pedido mas rapido.",
    ],
  },
  closing: {
    eyebrow: "Prueba social y soporte",
    title: "Confianza visible y ayuda real antes de cerrar tu compra.",
    description:
      "Opiniones recientes, senales de confianza y un acceso directo a soporte para resolver dudas sin salir del recorrido.",
    supportTitle: "Necesitas ayuda antes de comprar?",
    supportDescription:
      "Abre soporte en segundos si quieres validar un producto, cobertura o tiempos de entrega.",
    footerNote:
      "Opiniones recientes, soporte directo y contraentrega visibles sin recargar el resto de la experiencia.",
  },
  footer: {
    description:
      "Tienda online con contra entrega, cobertura nacional y una compra mas clara desde la ficha hasta la confirmacion.",
    tagline:
      "Vortixy combina catalogo util, seguimiento visible y soporte real para que comprar no se sienta improvisado.",
    operations: [
      "Confirmacion de pedido antes del despacho",
      "Cobertura nacional segun ciudad y transportadora",
      "Soporte por correo y canales directos",
    ],
    newsletterTitle: "Recibe novedades utiles",
  },
  technicalBudget: {
    title: "Presupuesto Hobby-like",
    note:
      "Las cuotas Hobby-like sirven como techo de uso y control tecnico, no como recomendacion comercial para una tienda activa.",
    quotas: [
      "100 GB por mes de Fast Data Transfer",
      "1 M de Edge Requests por mes",
      "1 M de invocaciones a Functions por mes",
      "4 horas de Active CPU por mes",
      "5.000 transformaciones de imagen por mes",
      "10.000 eventos de Speed Insights por mes",
    ],
  },
} as const;
