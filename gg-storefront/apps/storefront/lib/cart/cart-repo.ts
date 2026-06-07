import "server-only";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { redis } from "./redis";
import {
  applyCartMutation,
  mergeCarts,
  type CartItem,
  type CartMutation,
} from "./types";

const GUEST_COOKIE = "gg-cart-id";
const GUEST_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days (exit criterion 2)
const USER_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days — "persists across sessions"

const guestKey = (id: string) => `cart:guest:${id}`;
const userKey = (id: string) => `cart:user:${id}`;

async function readCart(key: string | null): Promise<CartItem[]> {
  if (!key) return [];
  const raw = await redis.get(key);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as { items: CartItem[] }).items ?? [];
  } catch {
    return [];
  }
}

async function writeCart(
  key: string,
  items: CartItem[],
  isGuest: boolean,
): Promise<void> {
  const ttl = isGuest ? GUEST_TTL_SECONDS : USER_TTL_SECONDS;
  await redis.set(key, JSON.stringify({ items }), "EX", ttl);
}

/** Read-only resolution (Server Components): never mints a guest cookie. */
async function resolveReadKey(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return userKey(session.user.id);
  const id = (await cookies()).get(GUEST_COOKIE)?.value;
  return id ? guestKey(id) : null;
}

/** Write resolution (Server Actions): mints a guest cookie on first write. */
async function resolveWriteKey(): Promise<{ key: string; isGuest: boolean }> {
  const session = await auth();
  if (session?.user?.id) return { key: userKey(session.user.id), isGuest: false };

  const store = await cookies();
  let id = store.get(GUEST_COOKIE)?.value;
  if (!id) {
    id = crypto.randomUUID();
    store.set(GUEST_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: GUEST_TTL_SECONDS,
    });
  }
  return { key: guestKey(id), isGuest: true };
}

/** Current cart for the active identity (user session or guest cookie). */
export async function getCart(): Promise<CartItem[]> {
  return readCart(await resolveReadKey());
}

/** Apply a mutation to the active cart and return the new contents. */
export async function mutateCart(m: CartMutation): Promise<CartItem[]> {
  const { key, isGuest } = await resolveWriteKey();
  const next = applyCartMutation(await readCart(key), m);
  await writeCart(key, next, isGuest);
  return next;
}

/**
 * On login, fold the guest cart into the user's cart (exit criterion 4: logging
 * in must not lose cart contents). Idempotent — clears the guest key afterward.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const store = await cookies();
  const id = store.get(GUEST_COOKIE)?.value;
  if (!id) return;

  const gKey = guestKey(id);
  const guestItems = await readCart(gKey);
  if (guestItems.length > 0) {
    const merged = mergeCarts(await readCart(userKey(userId)), guestItems);
    await writeCart(userKey(userId), merged, false);
  }
  await redis.del(gKey);
  // Best-effort: drop the guest cookie now that it's been absorbed.
  try {
    store.delete(GUEST_COOKIE);
  } catch {
    // cookie mutation may be unavailable in this context; the Redis key is gone
  }
}
