
# ⚽ FutManager Pro v6.5

Sistema integral de gestión para escuelas de fútbol potenciado por **Inteligencia Artificial**. Diseñado para la administración eficiente de alumnos, staff técnico, finanzas y entrenamientos.

## ✨ Características Principales

- **🤖 Inteligencia Artificial (Gemini):** Generación automática de planes de entrenamiento y reportes ejecutivos financieros.
- **🔄 Sincronización Multi-Usuario:** Trabajo en tiempo real gracias a la integración con **Supabase**.
- **🛒 Punto de Venta (POS):** Gestión de inventario de uniformes e implementos deportivos con control de caja.
- **📊 Gestión Deportiva:** Expedientes de alumnos con métricas de salud (IMC), control de mensualidades y convocatorias de partidos.
- **🛡️ Seguridad:** Sistema de backup local y control de accesos por roles (Admin, Entrenador, Secretaria).

## 🚀 Guía de Configuración

Para desplegar este sistema en **Vercel** o en tu servidor local, necesitas configurar las siguientes variables de entorno:

### 1. Inteligencia Artificial (Google Gemini)
1. Ve a [Google AI Studio](https://aistudio.google.com/).
2. Genera una nueva **API Key**.
3. Agrégala como variable de entorno con el nombre: `API_KEY`.

### 2. Base de Datos & Tiempo Real (Supabase)
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En el **SQL Editor**, ejecuta lo siguiente:
   ```sql
   create table school_data (
     id text primary key,
     data jsonb not null
   );
   
   -- Inserta el registro inicial si es necesario
   insert into school_data (id, data) values ('default_school', '{}');
   ```
3. Activa **Realtime** para la tabla `school_data` en el panel de Replication.
4. Obtén la `SUPABASE_URL` y la `SUPABASE_ANON_KEY` de la sección de API Settings.

### 3. Variables de Entorno (Vercel)
Asegúrate de que estas tres llaves estén configuradas en tu proyecto:
- `API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 🛠️ Tecnologías Usadas
- **React 19**
- **Tailwind CSS** (Diseño Premium)
- **Lucide React** (Iconografía)
- **Supabase** (Backend as a Service)
- **Google Gemini SDK** (IA)

---
*Desarrollado para la excelencia en la formación deportiva.*
