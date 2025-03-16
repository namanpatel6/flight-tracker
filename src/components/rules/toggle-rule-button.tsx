"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Power } from "lucide-react";
import { toast } from "sonner";

interface Rule {
  id: string;
  name: string;
  isActive: boolean;
}

interface ToggleRuleButtonProps {
  rule: Rule;
}

export function ToggleRuleButton({ rule }: ToggleRuleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rules/${rule.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !rule.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to toggle rule status");
      }

      toast.success(
        `Rule ${rule.name} ${rule.isActive ? "deactivated" : "activated"}`
      );
      router.refresh();
    } catch (error) {
      console.error("Error toggling rule:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to toggle rule status"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Power className={`h-4 w-4 mr-1 ${rule.isActive ? "text-green-500" : "text-gray-400"}`} />
      {rule.isActive ? "Disable" : "Enable"}
    </Button>
  );
} 