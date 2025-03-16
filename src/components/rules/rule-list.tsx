import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";
import { ToggleRuleButton } from "./toggle-rule-button";
import { DeleteRuleButton } from "./delete-rule-button";

interface Rule {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  conditionCount: number;
  alertCount: number;
}

interface RuleListProps {
  rules: Rule[];
}

export function RuleList({ rules }: RuleListProps) {
  if (!rules.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <h3 className="text-xl font-medium mb-2">No rules found</h3>
        <p className="text-muted-foreground mb-4">
          Create your first rule to start tracking flight conditions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rules.map((rule) => (
        <Card key={rule.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{rule.name}</CardTitle>
              <Badge variant={rule.isActive ? "default" : "outline"}>
                {rule.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription>
              {rule.description || "No description provided"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Operator:</div>
              <div>{rule.operator}</div>
              <div className="font-medium">Conditions:</div>
              <div>{rule.conditionCount}</div>
              <div className="font-medium">Alerts:</div>
              <div>{rule.alertCount}</div>
              <div className="font-medium">Created:</div>
              <div>{formatDate(rule.createdAt.toString())}</div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/rules/${rule.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
              <ToggleRuleButton rule={rule} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/rules/${rule.id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <DeleteRuleButton ruleId={rule.id} ruleName={rule.name} />
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 