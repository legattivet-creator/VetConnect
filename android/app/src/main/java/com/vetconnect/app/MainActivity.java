package com.vetconnect.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();

        // Permite o zoom na tela com os dedos (pinch-to-zoom)
        getBridge().getWebView().getSettings().setBuiltInZoomControls(true);
        getBridge().getWebView().getSettings().setDisplayZoomControls(false); // Opcional: oculta os botões de controle de zoom (+/-) que aparecem na tela
    }

    private void createNotificationChannel() {
        // Canais de notificação só são necessários para API 26+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Notificações Gerais";
            String description = "Canal para notificações gerais do aplicativo";
            // A importância ALTA garante que a notificação emita som.
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel("default_channel", name, importance);
            channel.setDescription(description);

            // Registra o canal no sistema
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
}
