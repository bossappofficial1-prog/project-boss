import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

export const ValidationAlert = ({ count, onRemoveInvalid, onDismiss, t }: any) => (
    <Card className="border-destructive bg-destructive/5 mb-4 mx-4 sm:mx-0">
        <CardContent className="p-4">
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <h4 className="font-medium text-destructive">
                        {t('alert.unavailableTitle', { count })}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('alert.unavailableDescription')}
                    </p>
                    <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="destructive" onClick={onRemoveInvalid}>
                            {t('buttons.removeUnavailable')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={onDismiss}>
                            {t('buttons.dismiss')}
                        </Button>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);