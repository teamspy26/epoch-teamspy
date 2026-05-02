import { VoiceIntentResult } from "./sarvam-ai";

export function handleNgoVoiceIntent(
  result: VoiceIntentResult,
  handlers: {
    onCreateRequest?: (params: Record<string, unknown>) => void;
    onFindFood?: () => void;
    onCheckStatus?: () => void;
  }
): string {
  switch (result.intent) {
    case "create_request":
      handlers.onCreateRequest?.(result.parameters ?? {});
      break;
    case "find_food":
      handlers.onFindFood?.();
      break;
    case "check_status":
      handlers.onCheckStatus?.();
      break;
  }
  return result.answerText || "Command processed.";
}

export function handleRestaurantVoiceIntent(
  result: VoiceIntentResult,
  handlers: {
    onApproveMatch?: (matchId?: string) => void;
    onDeclineMatch?: (matchId?: string) => void;
    onToggleAutoApprove?: () => void;
    onCheckStatus?: () => void;
  }
): string {
  const id = result.parameters?.matchId as string | undefined;
  switch (result.intent) {
    case "approve_match":
      handlers.onApproveMatch?.(id);
      break;
    case "decline_match":
      handlers.onDeclineMatch?.(id);
      break;
    case "toggle_auto_approve":
      handlers.onToggleAutoApprove?.();
      break;
    case "check_status":
      handlers.onCheckStatus?.();
      break;
  }
  return result.answerText || "Command processed.";
}

export function handleVolunteerVoiceIntent(
  result: VoiceIntentResult,
  handlers: {
    onAcceptDelivery?: (deliveryId?: string) => void;
    onMarkPickedUp?: () => void;
    onMarkInTransit?: () => void;
    onMarkDelivered?: () => void;
    onStartPickups?: () => void;
    onCheckStatus?: () => void;
  }
): string {
  const id = result.parameters?.deliveryId as string | undefined;
  switch (result.intent) {
    case "accept_delivery":
      handlers.onAcceptDelivery?.(id);
      break;
    case "mark_picked_up":
      handlers.onMarkPickedUp?.();
      break;
    case "mark_in_transit":
      handlers.onMarkInTransit?.();
      break;
    case "mark_delivered":
      handlers.onMarkDelivered?.();
      break;
    case "start_pickups":
      handlers.onStartPickups?.();
      break;
    case "check_status":
      handlers.onCheckStatus?.();
      break;
  }
  return result.answerText || "Command processed.";
}

export function handleAdminVoiceIntent(
  result: VoiceIntentResult,
  handlers: {
    onShowStats?: () => void;
    onListEscalations?: () => void;
    onResolveEscalation?: (escalationId?: string) => void;
    onCheckStatus?: () => void;
  }
): string {
  const id = result.parameters?.escalationId as string | undefined;
  switch (result.intent) {
    case "show_stats":
      handlers.onShowStats?.();
      break;
    case "list_escalations":
      handlers.onListEscalations?.();
      break;
    case "resolve_escalation":
      handlers.onResolveEscalation?.(id);
      break;
    case "check_status":
      handlers.onCheckStatus?.();
      break;
  }
  return result.answerText || "Command processed.";
}
