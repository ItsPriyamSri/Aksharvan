"use client";

// useRouteGuard — checks auth status and redirects as needed.
// Call at the top of any page that requires authentication.
// Also provides a "require-unauth" mode for the login page
// (redirect away if already logged in).

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type GuardMode = "require-auth" | "require-unauth";

type UseRouteGuardOptions = {
  /**
   * "require-auth"   → redirect to /login if not authenticated
   * "require-unauth" → redirect to /menu  if already authenticated
   */
  mode?: GuardMode;
  /** Override the redirect target */
  redirectTo?: string;
};

type UseRouteGuardReturn = {
  /** True while the auth status is still being determined */
  isChecking: boolean;
  /** True once auth check is done and the user is allowed on this page */
  isAllowed: boolean;
};

export function useRouteGuard(
  options: UseRouteGuardOptions = {}
): UseRouteGuardReturn {
  const { mode = "require-auth", redirectTo } = options;
  const { status } = useAuth();
  const router = useRouter();

  const isChecking = status === "loading";

  useEffect(() => {
    if (status === "loading") return;

    if (mode === "require-auth" && status === "unauthenticated") {
      router.replace(redirectTo ?? "/login");
    }

    if (mode === "require-unauth" && status === "authenticated") {
      router.replace(redirectTo ?? "/menu");
    }
  }, [status, mode, redirectTo, router]);

  const isAllowed =
    !isChecking &&
    ((mode === "require-auth"   && status === "authenticated") ||
     (mode === "require-unauth" && status === "unauthenticated"));

  return { isChecking, isAllowed };
}
