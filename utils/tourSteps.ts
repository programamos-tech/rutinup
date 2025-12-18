import { TourStep } from '@/components/onboarding/Tour';

export const getTourSteps = (pathname: string): TourStep[] => {
  // Tour general para la primera vez
  if (pathname === '/memberships' || pathname.startsWith('/memberships')) {
    return [
      {
        id: 'memberships-header',
        target: '[data-tour="memberships-header"]',
        title: 'Bienvenido a Membresías',
        content: 'Aquí puedes crear y gestionar los planes de membresía que ofreces a tus miembros. Puedes usar las plantillas predefinidas o crear planes personalizados.',
        position: 'bottom',
      },
      {
        id: 'memberships-add',
        target: '[data-tour="memberships-add"]',
        title: 'Crear un Plan',
        content: 'Haz clic aquí para crear un nuevo plan de membresía. Puedes definir precio, duración, servicios incluidos y restricciones.',
        position: 'bottom',
      },
      {
        id: 'memberships-templates',
        target: '[data-tour="memberships-templates"]',
        title: 'Plantillas Predefinidas',
        content: 'Usa estas plantillas como punto de partida. Son planes comunes en gimnasios que puedes personalizar según tus necesidades.',
        position: 'bottom',
      },
    ];
  }

  if (pathname === '/clients' || pathname.startsWith('/clients')) {
    return [
      {
        id: 'clients-header',
        target: '[data-tour="clients-header"]',
        title: 'Gestión de Miembros',
        content: 'Aquí puedes ver y gestionar todos tus miembros. Puedes buscar, filtrar y ver el estado de sus membresías.',
        position: 'bottom',
      },
      {
        id: 'clients-add',
        target: '[data-tour="clients-add"]',
        title: 'Agregar Miembro',
        content: 'Haz clic aquí para registrar un nuevo miembro. Puedes agregar información personal, contacto, peso inicial y notas médicas.',
        position: 'bottom',
      },
      {
        id: 'clients-search',
        target: '[data-tour="clients-search"]',
        title: 'Buscar Miembros',
        content: 'Usa este campo para buscar miembros por nombre, email o teléfono. También puedes filtrar por estado (Activos, Inactivos, Vencidos).',
        position: 'bottom',
      },
      {
        id: 'clients-table',
        target: '[data-tour="clients-table"]',
        title: 'Lista de Miembros',
        content: 'Aquí verás todos tus miembros con su información de membresía, fecha de vencimiento y estado. Haz clic en el ícono del ojo para ver más detalles.',
        position: 'top',
      },
    ];
  }

  if (pathname === '/classes' || pathname.startsWith('/classes')) {
    return [
      {
        id: 'classes-header',
        target: '[data-tour="classes-header"]',
        title: 'Gestión de Clases',
        content: 'Organiza y gestiona todas tus clases grupales. Puedes verlas en calendario, lista o reportes.',
        position: 'bottom',
      },
      {
        id: 'classes-add',
        target: '[data-tour="classes-add"]',
        title: 'Crear Clase',
        content: 'Haz clic aquí para crear una nueva clase. Define el nombre, horario, días de la semana y asigna un entrenador.',
        position: 'bottom',
      },
      {
        id: 'classes-views',
        target: '[data-tour="classes-views"]',
        title: 'Vistas Disponibles',
        content: 'Cambia entre vista de calendario (para ver la semana), lista (para ver todas las clases) o reportes (para estadísticas).',
        position: 'bottom',
      },
    ];
  }

  if (pathname === '/payments' || pathname.startsWith('/payments')) {
    return [
      {
        id: 'payments-header',
        target: '[data-tour="payments-header"]',
        title: 'Módulo de Pagos',
        content: 'Aquí puedes registrar pagos de tus miembros, ver los pagos del día y gestionar pagos pendientes.',
        position: 'bottom',
      },
      {
        id: 'payments-add',
        target: '[data-tour="payments-add"]',
        title: 'Registrar Pago',
        content: 'Haz clic aquí para registrar un nuevo pago. Puedes seleccionar el miembro, el método de pago y generar un comprobante.',
        position: 'bottom',
      },
      {
        id: 'payments-metrics',
        target: '[data-tour="payments-metrics"]',
        title: 'Métricas del Día',
        content: 'Aquí verás un resumen de los ingresos del día, desglosados por método de pago y pagos pendientes.',
        position: 'top',
      },
    ];
  }

  if (pathname === '/reports' || pathname.startsWith('/reports')) {
    return [
      {
        id: 'reports-header',
        target: '[data-tour="reports-header"]',
        title: 'Reportes y Finanzas',
        content: 'Aquí puedes ver reportes detallados de ingresos, análisis por membresía, método de pago y morosidad.',
        position: 'bottom',
      },
      {
        id: 'reports-period',
        target: '[data-tour="reports-period"]',
        title: 'Seleccionar Período',
        content: 'Cambia el período de tiempo para ver reportes de hoy, esta semana, este mes, este año o un período personalizado.',
        position: 'bottom',
      },
    ];
  }

  // Tour inicial general (cuando no hay una página específica)
  return [
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      title: 'Menú Principal',
      content: 'Desde aquí puedes navegar a todas las secciones de la plataforma: Membresías, Miembros, Clases, Entrenadores, Pagos y Reportes.',
      position: 'right',
    },
    {
      id: 'memberships-nav',
      target: 'a[href="/memberships"]',
      title: 'Primer Paso: Membresías',
      content: 'Comienza creando los planes de membresía que ofreces. Puedes usar plantillas predefinidas o crear planes personalizados.',
      position: 'right',
    },
  ];
};

