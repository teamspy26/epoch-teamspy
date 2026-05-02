import { FoodRequest } from "@/lib/types";
import { createNotification, getUser } from "@/lib/firebase/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export function rankPendingRequests(requests: FoodRequest[]): FoodRequest[] {
  return requests.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
}

export async function sendConfirmationToNGO(
  ngoId: string,
  requestId: string,
  message: string
): Promise<void> {
  // In-app notification (always)
  await createNotification({
    userId: ngoId,
    title: "Prasadam Update",
    body: message,
    type: "alert",
    read: false,
    metadata: { requestId },
  });

  // WhatsApp to the NGO's registered phone number
  const ngoUser = await getUser(ngoId);
  if (ngoUser?.phone) {
    await sendWhatsApp(ngoUser.phone, `🙏 Prasadam: ${message}`).catch(() => {});
  }
}
