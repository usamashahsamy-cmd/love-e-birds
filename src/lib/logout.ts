"use client";

import { signOut } from "next-auth/react";

export async function handleLogout() {
  await signOut({ redirect: false });
  // Full page navigation on purpose: resets NextAuth client session state
  // and always lands on the correct origin, regardless of NEXTAUTH_URL.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign("/login");
}