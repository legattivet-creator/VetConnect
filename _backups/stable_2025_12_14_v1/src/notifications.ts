export async function requestNotificationPermission() {
  try {
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações.");
      return "denied";
    }

    const permission = await Notification.requestPermission();
    console.log("Permissão:", permission);

    return permission;
  } catch (error) {
    console.error("Erro ao solicitar permissão de notificações:", error);
    return "denied";
  }
}
