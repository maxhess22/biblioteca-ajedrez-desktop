#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        check_for_updates(handle).await;
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

async fn check_for_updates(app: tauri::AppHandle) {
  use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
  use tauri_plugin_updater::UpdaterExt;

  if let Ok(updater) = app.updater() {
    if let Ok(Some(update)) = updater.check().await {
      let version = update.version.clone();
      let question = format!(
        "Hay una nueva versión disponible de Biblioteca Ajedrez (v{}).\n\n¿Deseas descargarla e instalarla ahora?",
        version
      );

      let app_handle = app.clone();
      app.dialog()
        .message(question)
        .title("Actualización de Biblioteca Ajedrez")
        .kind(MessageDialogKind::Info)
        .buttons(MessageDialogButtons::OkCancelCustom(
          "Actualizar ahora".to_string(),
          "Más tarde".to_string(),
        ))
        .show(move |accepted| {
          if accepted {
            let app_inner = app_handle.clone();
            tauri::async_runtime::spawn(async move {
              if let Err(e) = update
                .download_and_install(
                  |_chunk_length, _content_length| {},
                  || {},
                )
                .await
              {
                eprintln!("Error al descargar actualización: {}", e);
              } else {
                let app_restart = app_inner.clone();
                app_inner.dialog()
                  .message("La actualización se instaló correctamente. La aplicación se reiniciará.")
                  .title("Actualización lista")
                  .kind(MessageDialogKind::Info)
                  .show(move |_| {
                    app_restart.restart();
                  });
              }
            });
          }
        });
    }
  }
}
