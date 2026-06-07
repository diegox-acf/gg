"use client";

import { signOut } from "next-auth/react";
import { Button } from "@gg/ui";

export function SignOutButton() {
  return (
    <Button variant="secondary" onClick={() => signOut({ redirectTo: "/" })}>
      Sign out
    </Button>
  );
}
