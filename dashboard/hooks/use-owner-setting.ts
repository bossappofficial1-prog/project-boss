import { PasswordFormValues } from "@/components/owner/settings/PasswordForm";
import { uploadApi } from "@/lib/api";
import { apiClient } from "@/lib/apis/base";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export const useProfileSetting = () => {
    const qc = useQueryClient()

    const updateProfile = useMutation({
        mutationFn: async (data: { userId: string, values: FormData }) => {
            let avatarUrl: string | undefined = undefined
            try {
                const values = data.values;
                const userId = data.userId;
                const avatarFile = values.get(`avatar`) as File;
                let payload: any = {
                    name: values.get('name'),
                    phone: values.get('phone')
                }

                if (avatarFile instanceof File) {
                    const result = await uploadApi.uploadImage(avatarFile, { fieldName: `avatar`, scope: `user` });
                    payload.avatar = result.url;
                    avatarUrl = result.url
                }

                await apiClient.patch(`/auth/update-profile/${userId}`, payload);

            } catch (error) {
                if (avatarUrl) await uploadApi.deleteByUrl(avatarUrl);
                throw error
            }
        },
        onSuccess: () => {
            sessionStorage.removeItem('user-data-cache-v1')
            qc.invalidateQueries({ queryKey: ['auth-me'] })
            toast.success('Berhasil update profile');
        }
    })

    const updatePassword = useMutation({
        mutationFn: async (data: { userId: string, payload: PasswordFormValues }) => {
            await apiClient.patch(`/auth/update-password/${data.userId}`, data.payload);
        },
        onSuccess: () => {
            toast.success('Berhasil update password');
        }
    })

    return {
        isProfileUpdate: updateProfile.isPending,
        updateProfileMutation: updateProfile.mutateAsync,
        isPasswordUpdate: updatePassword.isPending,
        updatePasswordMutation: updatePassword.mutateAsync
    }
}