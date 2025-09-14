'use client'

import { useTranslations } from "@/hooks/useI18n";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import useToast from "../ui/toast";
import { STORAGE_PROFILE_KEY } from "@/constants";

type ResetModalProps = {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export function ResetModal({
    isOpen = false,
    onOpenChange
}: ResetModalProps) {
    const t = useTranslations("profilePage")
    const toast = useToast()
    return (
        <Dialog
            open={isOpen}
            onOpenChange={onOpenChange}
            defaultOpen={isOpen}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("resetModal.title")}</DialogTitle>
                    <DialogDescription>
                        {t("resetModal.description")}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t("resetModal.cancelButton")}</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                localStorage.removeItem(STORAGE_PROFILE_KEY);
                                localStorage.removeItem("hasSeenOnboarding")
                                toast.push({ title: 'Pengaturan dihapus' });
                            }}
                        >
                            {t("resetModal.confirmButton")}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}