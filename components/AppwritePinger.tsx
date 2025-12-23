"use client";

import { useEffect } from "react";

import { client } from "@/lib/appwrite";

export function AppwritePinger() {
  useEffect(() => {
    client.ping().catch((error) => {
      console.error("Failed to ping Appwrite", error);
    });
  }, []);

  return null;
}
