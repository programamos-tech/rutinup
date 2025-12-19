# Rutinup - Métricas del Dashboard Inicial

## 🎯 Objetivo del Dashboard

El dashboard debe dar al administrador del gimnasio una vista rápida y clara del estado de su negocio, permitiéndole tomar decisiones operativas inmediatas sin necesidad de navegar por múltiples secciones.

**Principios**:
- Información accionable
- Visualización clara y simple
- Métricas relevantes para operación diaria
- Sin sobrecarga de información

---

## 📊 Métricas Principales (Cards Superiores)

### 1. Clientes Activos
- **Qué muestra**: Número total de clientes con membresía activa
- **Cálculo**: Count de clientes donde existe al menos una membresía con estado "Activa"
- **Visualización**: 
  - Número grande (ej: 45)
  - Icono de personas
  - Color: Verde
  - Subtítulo: "Con membresía vigente"
- **Acción rápida**: Click → Ir a lista de clientes activos
- **Actualización**: Tiempo real (sin caché)

### 2. Membresías Vencidas
- **Qué muestra**: Número de clientes con membresías vencidas
- **Cálculo**: Count de clientes donde todas sus membresías están vencidas
- **Visualización**:
  - Número grande (ej: 3)
  - Icono de alerta/reloj
  - Color: 
    - Verde si = 0
    - Naranja si 1-5
    - Rojo si > 5
  - Subtítulo: "Requieren renovación"
- **Acción rápida**: Click → Ir a lista de membresías vencidas
- **Actualización**: Tiempo real

### 3. Ingresos del Mes
- **Qué muestra**: Total de ingresos del mes actual
- **Cálculo**: Suma de todos los pagos registrados en el mes actual con estado "Completado"
- **Visualización**:
  - Monto formateado (ej: "$12,450 MXN")
  - Icono de dinero
  - Color: Azul
  - Comparación: 
    - % vs mes anterior (ej: "+15% vs mes pasado")
    - Flecha arriba/abajo según tendencia
  - Subtítulo: "Mes actual"
- **Acción rápida**: Click → Ir a reporte de ingresos
- **Actualización**: Caché de 5 minutos

### 4. Clases Esta Semana
- **Qué muestra**: Número de clases programadas para la semana actual
- **Cálculo**: Count de clases únicas con al menos un día de la semana en la semana actual
- **Visualización**:
  - Número grande (ej: 12)
  - Icono de calendario/clase
  - Color: Morado
  - Subtítulo: "Semana actual"
- **Acción rápida**: Click → Ir a vista de clases
- **Actualización**: Tiempo real

---

## 📈 Gráficos y Visualizaciones

### 1. Ingresos Últimos 30 Días (Gráfico de Línea o Barras)
- **Qué muestra**: Evolución diaria de ingresos
- **Datos**: 
  - Eje X: Días del mes (1-30)
  - Eje Y: Monto en moneda local
  - Puntos/Barras: Ingresos por día
- **Características**:
  - Tooltip al hover mostrando fecha y monto exacto
  - Línea de tendencia opcional (simple)
  - Color: Azul
- **Filtro**: Cambiar período (7 días, 30 días, 3 meses)
- **Acción**: Click en barra → Ver detalle de pagos de ese día

### 2. Top 5 Clases con Más Estudiantes
- **Qué muestra**: Clases más populares
- **Datos**:
  - Nombre de clase
  - Número de estudiantes asignados
  - Barra horizontal mostrando cantidad
- **Cálculo**: 
  - Agrupar por clase
  - Contar estudiantes únicos asignados
  - Ordenar descendente
  - Tomar top 5
- **Visualización**: 
  - Lista vertical con barras horizontales
  - Color: Verde (gradiente según cantidad)
- **Período**: Últimos 30 días o "Todas las clases"
- **Acción**: Click en clase → Ver detalle de clase

---

## 🔔 Alertas y Recordatorios

### Sección "Acciones Requeridas"
Panel que muestra tareas pendientes que requieren atención:

#### 1. Membresías Próximas a Vencer
- **Qué muestra**: Lista de clientes con membresías que vencen en los próximos 7 días
- **Datos por item**:
  - Nombre del cliente
  - Tipo de membresía
  - Fecha de vencimiento
  - Días restantes
- **Visualización**: 
  - Lista compacta (máximo 5 items)
  - Badge con días restantes
  - Color: Naranja
- **Acción**: 
  - Click en cliente → Ir a perfil
  - Botón "Ver todas" → Lista completa
- **Límite**: Mostrar máximo 5, con opción "Ver todas (X más)"

#### 2. Clases del Día
- **Qué muestra**: Clases programadas para hoy
- **Datos por item**:
  - Nombre de clase
  - Hora
  - Entrenador
  - Estudiantes inscritos (X/Y)
- **Visualización**: 
  - Lista compacta
  - Badge de hora
  - Indicador si está en curso (hora actual)
- **Acción**: Click → Ver detalle de clase y registrar asistencia
- **Límite**: Máximo 5 clases, con opción "Ver todas"

#### 3. Pagos Pendientes (Opcional para MVP)
- **Qué muestra**: Clientes con membresías vencidas sin pago reciente
- **Datos**: Similar a membresías vencidas pero enfocado en acción de cobro
- **Visualización**: Lista compacta con botón "Registrar Pago"
- **Nota**: Puede combinarse con "Membresías Próximas a Vencer" si hay espacio limitado

---

## 🎨 Layout del Dashboard

### Estructura Visual

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Dashboard" + Fecha actual                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │  45  │  │   3  │  │$12K  │  │  12  │              │
│  │Activos│  │Venc. │  │Ingres│  │Clases│              │
│  └──────┘  └──────┘  └──────┘  └──────┘              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Acciones Rápidas                                       │
│  [Agregar Cliente] [Crear Clase] [Registrar Pago]     │
├─────────────────────────────────────────────────────────┤
│  Ingresos Últimos 30 Días                               │
│  [Gráfico de línea/barras]                             │
│  [Filtro: 7d | 30d | 3m]                               │
├─────────────────────────────────────────────────────────┤
│  Top 5 Clases con Más Estudiantes                       │
│  [Lista con barras horizontales]                        │
├─────────────────────────────────────────────────────────┤
│  Acciones Requeridas                                    │
│  ┌─────────────────────────────────────┐               │
│  │ Membresías Próximas a Vencer        │               │
│  │ • Juan Pérez - Mensual (3 días)     │               │
│  │ • María García - Trimestral (5 días)│               │
│  │ [Ver todas (3 más)]                 │               │
│  └─────────────────────────────────────┘               │
│  ┌─────────────────────────────────────┐               │
│  │ Clases de Hoy                       │               │
│  │ • Yoga - 9:00 AM (8/10)            │               │
│  │ • CrossFit - 6:00 PM (12/15)       │               │
│  │ [Ver todas]                         │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (> 1024px)
- 4 cards de métricas en una fila
- Gráficos a ancho completo
- Sidebar siempre visible

### Tablet (768px - 1024px)
- 2x2 grid para cards de métricas
- Gráficos a ancho completo
- Sidebar colapsable

### Mobile (< 768px)
- 1 columna para cards (apiladas)
- Gráficos simplificados o ocultos
- Sidebar como menú hamburguesa

---

## 🔄 Actualización de Datos

### Tiempo Real (Sin Caché)
- Clientes activos
- Membresías vencidas
- Clases esta semana
- Alertas y recordatorios

### Con Caché (5 minutos)
- Ingresos del mes
- Gráfico de ingresos
- Top clases

### Razón del Caché
- Mejora performance
- Reduce carga en base de datos
- Datos financieros no cambian constantemente
- Balance entre actualidad y performance

### Invalidación de Caché
Limpiar caché cuando:
- Se registra un nuevo pago
- Se asigna/renueva una membresía
- Se crea/elimina una clase
- Se modifica información relevante

---

## 🎯 Métricas Adicionales (Opcionales para MVP)

### Si hay espacio, considerar:

1. **Nuevos Clientes del Mes**
   - Count de clientes creados en el mes actual
   - Comparación con mes anterior

2. **Asistencia Promedio**
   - Porcentaje de asistencia en clases
   - Últimos 30 días

3. **Membresías Más Populares**
   - Top 3 tipos de membresía más vendidas
   - Gráfico de pastel simple

4. **Ingresos por Método de Pago**
   - Desglose: Efectivo vs Transferencia
   - Gráfico de pastel

**Nota**: Estas métricas pueden agregarse después de validar uso del dashboard básico.

---

## 📊 Definición de Cálculos Técnicos

### Clientes Activos
```sql
SELECT COUNT(DISTINCT cliente_id) 
FROM clientes c
INNER JOIN membresias m ON c.id = m.cliente_id
WHERE m.fecha_inicio <= CURRENT_DATE 
  AND m.fecha_vencimiento >= CURRENT_DATE
  AND m.estado != 'deshabilitada'
```

### Membresías Vencidas
```sql
SELECT COUNT(DISTINCT cliente_id)
FROM clientes c
WHERE NOT EXISTS (
  SELECT 1 FROM membresias m
  WHERE m.cliente_id = c.id
    AND m.fecha_vencimiento >= CURRENT_DATE
    AND m.estado != 'deshabilitada'
)
AND EXISTS (
  SELECT 1 FROM membresias m
  WHERE m.cliente_id = c.id
)
```

### Ingresos del Mes
```sql
SELECT SUM(monto)
FROM pagos
WHERE DATE_TRUNC('month', fecha_pago) = DATE_TRUNC('month', CURRENT_DATE)
  AND estado = 'completado'
```

### Clases Esta Semana
```sql
SELECT COUNT(DISTINCT clase_id)
FROM clases c
INNER JOIN clase_dias cd ON c.id = cd.clase_id
WHERE cd.dia_semana IN (
  -- Días de la semana actual
)
AND fecha_inicio <= CURRENT_DATE
AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
```

---

## 🎨 Paleta de Colores Sugerida

- **Verde**: Éxito, activo, positivo (#10B981)
- **Rojo**: Alerta, vencido, negativo (#EF4444)
- **Naranja**: Advertencia, próximo a vencer (#F59E0B)
- **Azul**: Información, ingresos (#3B82F6)
- **Morado**: Clases, eventos (#8B5CF6)
- **Gris**: Neutral, texto secundario (#6B7280)

---

## ✅ Checklist de Implementación

- [ ] Cards de métricas principales (4)
- [ ] Gráfico de ingresos (línea o barras)
- [ ] Top 5 clases con más estudiantes
- [ ] Sección de alertas (membresías próximas a vencer)
- [ ] Sección de clases del día
- [ ] Botones de acciones rápidas
- [ ] Filtros de período
- [ ] Responsive design básico
- [ ] Sistema de caché para métricas pesadas
- [ ] Invalidación de caché en eventos relevantes
- [ ] Tooltips en gráficos
- [ ] Navegación desde métricas a detalles



