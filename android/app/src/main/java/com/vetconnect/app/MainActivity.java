package com.vetconnect.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.vetconnect.app.R;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.d("VetConnectLog", "MainActivity.java: onCreate foi chamado. Tentando criar o canal.");
        createNotificationChannel();

        // Permite o zoom na tela com os dedos (pinch-to-zoom)
        getBridge().getWebView().getSettings().setBuiltInZoomControls(true);
        getBridge().getWebView().getSettings().setDisplayZoomControls(false); // Opcional: oculta os botões de controle
                                                                              // de zoom (+/-)
    }

    private void createNotificationChannel() {
        // Canais de notificação só são necessários para API 26+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "VetConnect Alerts";
            String description = "Alertas de agendamentos";
            int importance = NotificationManager.IMPORTANCE_HIGH; // High importance for heads-up
            NotificationChannel channel = new NotificationChannel("vetconnect_alerts", name, importance);
            channel.setDescription(description);

            // Som padrão do sistema (sem personalização 'dog_bark')
            // Deixar configurado para usar o padrão do sistema

            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                // Remove o canal antigo se existir para garantir atualização das configs
                notificationManager.deleteNotificationChannel("silent_alerts");
                notificationManager.createNotificationChannel(channel);
                Log.d("VetConnectLog", "MainActivity.java: Canal 'vetconnect_alerts' criado (sem som customizado).");
            }
        } else {
            Log.d("VetConnectLog", "MainActivity.java: Versão do Android é anterior à 8.0, não precisa criar canal.");
        }
    }
}
