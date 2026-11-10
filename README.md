# Biblioteca Ajedrez — App de Escritorio (Desktop)

Aplicación nativa de escritorio para macOS (y multiplataforma) construida con [Tauri v2](https://v2.tauri.app/) y Rust.

## Estructura del Proyecto

- `src-tauri/`: Código nativo en Rust, configuración de ventana y permisos de Tauri.
- `dist/`: Frontend estático compilado y empaquetado para la app de escritorio.
- `.github/workflows/desktop-release.yml`: Flujo de GitHub Actions para generar el instalador `.dmg` con 1 clic.

## Comandos

```bash
# Instalar dependencias de Tauri CLI
npm install

# Iniciar en modo desarrollo con ventana nativa
npm run dev

# Compilar binario / instalador localmente
npm run build

# Sincronizar frontend actualizado desde el repo web
npm run sync:frontend
```

## Descargable (.dmg) en GitHub Actions

1. Ve a la pestaña **Actions** en este repositorio de GitHub.
2. Selecciona **Compilar App de Escritorio (Desktop)**.
3. Haz clic en **Run workflow**.
4. Al terminar (toma ~3-4 minutos en los servidores de GitHub), descarga el archivo `.dmg` listo para instalar en macOS en la sección **Artifacts**.
