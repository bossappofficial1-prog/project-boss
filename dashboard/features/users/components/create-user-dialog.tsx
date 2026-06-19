"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { gooeyToast } from "goey-toast";
import { UserRole } from '@/types/user';
import { useUserOperations } from '@/hooks/use-users';

const createUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CreateUserForm = z.infer<typeof createUserSchema>;

export default function CreateUserDialog({ children, onSuccess }: { children?: React.ReactNode; onSuccess?: () => void }) {
    const userOperations = useUserOperations();
    const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            role: UserRole.OWNER,
        }
    });

    const onSubmit = async (values: CreateUserForm) => {
        try {
            await userOperations.createUser.mutateAsync(values as any);
            gooeyToast.success('User created successfully');
            reset();
            onSuccess?.();
        } catch (err: any) {
            gooeyToast.error(err?.message || 'Failed to create user');
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children ?? <Button variant="default">Create User</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create user</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
                    <div>
                        <Label>Name</Label>
                        <Input {...register('name')} />
                        {errors.name && <p className="text-destructive text-sm mt-1">{String(errors.name.message)}</p>}
                    </div>

                    <div>
                        <Label>Email</Label>
                        <Input {...register('email')} />
                        {errors.email && <p className="text-destructive text-sm mt-1">{String(errors.email.message)}</p>}
                    </div>

                    <div>
                        <Label>Phone</Label>
                        <Input {...register('phone')} />
                    </div>

                    <div>
                        <Label>Role</Label>
                        <Controller
                            control={control}
                            name="role"
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={(val) => field.onChange(val as UserRole)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={UserRole.ADMIN}>{UserRole.ADMIN}</SelectItem>
                                        <SelectItem value={UserRole.OWNER}>{UserRole.OWNER}</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div>
                        <Label>Password</Label>
                        <Input type="password" {...register('password')} />
                        {errors.password && <p className="text-destructive text-sm mt-1">{String(errors.password.message)}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create user'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
