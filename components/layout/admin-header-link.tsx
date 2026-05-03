"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminHeaderLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminSession() {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
        });
        const payload = (await response.json()) as { authenticated?: boolean };

        if (isMounted) {
          setIsAdmin(Boolean(payload.authenticated));
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
    }

    void checkAdminSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <Button asChild variant="ghost" size="icon">
      <Link href="/admin" aria-label="Admin dashboard">
        <Settings />
      </Link>
    </Button>
  );
}
