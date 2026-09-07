# ONLY Driver PWA — Gestión y Ruta de Entregas 🚚

Aplicación Progresiva Web (PWA) de alto rendimiento para los conductores del ecosistema **Only Home**. Facilita la navegación de rutas de entrega, optimización de paradas, geolocalización continua en tiempo real, contacto directo con clientes y registro de pruebas de entrega (POD).

---

## 🌟 Características Principales

* 🗺️ **Rastreo GPS & Google Maps en Vivo:**
  * Monitoreo continuo de alta precisión (`watchPosition`) y visualización de paradas numeradas en orden de entrega (`#1`, `#2`, `#3`...).
  * Polilínea de ruta y cálculo de distancia/ETA en tiempo real.
  * Deep-links para iniciar navegación guiada directamente en **Google Maps** o **Waze**.
* 💬 **Comunicación Directa con 1 Toque:**
  * Botón directo de **WhatsApp** con plantilla de mensaje contextualizado con el nombre del cliente, dirección y número de pedido.
  * Disparador nativo de **Llamada telefónica** (`tel:`).
* 📸 **Prueba de Entrega (POD) con Compresión Móvil:**
  * Captura de foto de factura firmada o paquete con compresión automática en el navegador (Canvas) para optimizar el consumo de datos celulares.
  * Registro de nombre de quien recibe y notas de entrega.
  * Gestión y reporte de novedades de entrega (*"Cliente no se encuentra"*, *"Dirección errónea"*, etc.).
* 🔋 **Wake Lock API & PWA Offline:**
  * Mantiene la pantalla del dispositivo encendida durante la conducción.
  * Service Workers con soporte offline para consultar la información de la ruta en zonas sin cobertura.
* 🎨 **Diseño Claro Radical 2026 (Only Design System):**
  * Paleta corporativa Only Deep Navy (`#001F36` / `#003B66`), canvas claro (`#F7F9FC`) y tipografía *Plus Jakarta Sans*.

---

## 🛠️ Stack Tecnológico

* **Core:** React 19 + TypeScript + Vite 6
* **Estilos:** Tailwind CSS 3.4 + Radix UI + Lucide React + Tailwind Animate
* **PWA:** `vite-plugin-pwa` (Workbox)
* **Mapas:** Leaflet / Google Maps API loader
* **Feedback:** Sonner (Toast notifications) + Canvas Confetti

---

## 🚀 Instalación y Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```
