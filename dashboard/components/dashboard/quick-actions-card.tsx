import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, PieChart, Settings } from "lucide-react";

interface QuickAction {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick?: () => void;
}

interface QuickActionsCardProps {
    actions?: QuickAction[];
}

export function QuickActionsCard({ actions }: QuickActionsCardProps) {
    const defaultActions: QuickAction[] = [
        {
            icon: Users,
            label: "Manage Users",
            onClick: () => console.log("Manage Users clicked")
        },
        {
            icon: Building2,
            label: "Business Review",
            onClick: () => console.log("Business Review clicked")
        },
        {
            icon: PieChart,
            label: "View Reports",
            onClick: () => console.log("View Reports clicked")
        },
        {
            icon: Settings,
            label: "System Settings",
            onClick: () => console.log("System Settings clicked")
        }
    ];

    const actionList = actions || defaultActions;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {actionList.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={index}
                                variant="outline"
                                className="h-20 flex flex-col items-center space-y-2"
                                onClick={action.onClick}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-sm">{action.label}</span>
                            </Button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}