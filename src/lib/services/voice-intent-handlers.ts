/**
 * Voice Intent Handlers
 * Executes actions based on detected voice intents for each role
 */

import { VoiceIntentResult } from "@/lib/services/sarvam-ai";
import type { FoodRequest, FoodListing, Delivery } from "@/lib/types";

// NGO Intent Handlers
export interface NgoIntentHandlers {
  onCreateRequest?: (params: { quantity?: number; urgency?: string }) => void;
  onFindFood?: () => void;
  onCheckStatus?: () => void;
}

export function handleNgoVoiceIntent(
  result: VoiceIntentResult,
  handlers: NgoIntentHandlers
) {
  switch (result.intent) {
    case "create_request":
      handlers.onCreateRequest?.(result.parameters);
      return "Creating food request...";

    case "find_food":
      handlers.onFindFood?.();
      return "Finding available food...";

    case "check_status":
      handlers.onCheckStatus?.();
      return "Checking request status...";

    default:
      return "Command not recognized";
  }
}

// Restaurant Intent Handlers
export interface RestaurantIntentHandlers {
  onApproveMatch?: (matchId?: string) => void;
  onDeclineMatch?: (matchId?: string) => void;
  onCheckStatus?: () => void;
  onToggleAutoApprove?: () => void;
}

export function handleRestaurantVoiceIntent(
  result: VoiceIntentResult,
  handlers: RestaurantIntentHandlers
) {
  switch (result.intent) {
    case "approve_match":
      handlers.onApproveMatch?.(result.parameters.matchId as string | undefined);
      return "Approving match...";

    case "decline_match":
      handlers.onDeclineMatch?.(result.parameters.matchId as string | undefined);
      return "Declining match...";

    case "toggle_auto_approve":
      handlers.onToggleAutoApprove?.();
      return "Toggling auto-approve...";

    case "check_status":
      handlers.onCheckStatus?.();
      return "Checking approval status...";

    default:
      return "Command not recognized";
  }
}

// Volunteer Intent Handlers
export interface VolunteerIntentHandlers {
  onAcceptDelivery?: (deliveryId?: string) => void;
  onMarkPickedUp?: (deliveryId?: string) => void;
  onMarkInTransit?: (deliveryId?: string) => void;
  onMarkDelivered?: (deliveryId?: string) => void;
  onStartPickups?: () => void;
  onCheckStatus?: () => void;
}

export function handleVolunteerVoiceIntent(
  result: VoiceIntentResult,
  handlers: VolunteerIntentHandlers
) {
  switch (result.intent) {
    case "accept_delivery":
      handlers.onAcceptDelivery?.(result.parameters.deliveryId as string | undefined);
      return "Accepting delivery...";

    case "mark_picked_up":
      handlers.onMarkPickedUp?.(result.parameters.deliveryId as string | undefined);
      return "Marking as picked up...";

    case "mark_in_transit":
      handlers.onMarkInTransit?.(result.parameters.deliveryId as string | undefined);
      return "Marking as in transit...";

    case "mark_delivered":
      handlers.onMarkDelivered?.(result.parameters.deliveryId as string | undefined);
      return "Marking as delivered...";

    case "start_pickups":
      handlers.onStartPickups?.();
      return "Starting delivery route...";

    case "check_status":
      handlers.onCheckStatus?.();
      return "Checking delivery status...";

    default:
      return "Command not recognized";
  }
}

// Admin Intent Handlers
export interface AdminIntentHandlers {
  onShowStats?: () => void;
  onListEscalations?: () => void;
  onResolveEscalation?: (escalationId?: string) => void;
  onCheckStatus?: () => void;
}

export function handleAdminVoiceIntent(
  result: VoiceIntentResult,
  handlers: AdminIntentHandlers
) {
  switch (result.intent) {
    case "show_stats":
      handlers.onShowStats?.();
      return "Fetching system statistics...";

    case "list_escalations":
      handlers.onListEscalations?.();
      return "Loading escalations...";

    case "resolve_escalation":
      handlers.onResolveEscalation?.(result.parameters.escalationId as string | undefined);
      return "Resolving escalation...";

    case "check_status":
      handlers.onCheckStatus?.();
      return "Checking system status...";

    default:
      return "Command not recognized";
  }
}
