"use client";

import { useEffect } from "react";
import { client } from "@/lib/appwrite";

export function AppwritePinger() {
  useEffect(() => {
    // Only ping if Appwrite client is configured
    if (client) {
      client.ping().catch((error) => {
        console.error("Failed to ping Appwrite", error);
      });
    }
  }, []);

  return null;
}
