import { AsyncLocalStorage } from "async_hooks";
import type { User } from "../types/Users";

export interface RequestContext {
  user: User;
  requestId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getTelegramId() {
  const store = requestContext.getStore()!;

  return store.user.telegramId;
}

export function getRequestId() {
  const store = requestContext.getStore()!;

  return store.requestId;
}

export function getUserId() {
  const store = requestContext.getStore()!;
  return store.user.id;
}
