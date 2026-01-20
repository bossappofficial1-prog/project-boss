"use client";

import {
    useForm,
    Control,
    FieldValues,
    Path,
    DefaultValues,
    ControllerRenderProps,
    useWatch,
    UseFormReturn
} from "react-hook-form";
import { useEffect, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SelectOption } from "../shared/SelectOption";
import { PasswordInput } from "./password-input";
import InputCurrency from "./input-currency";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { DatePicker } from "./date-picker";
import ImageUploader from "./ImageUploader";
import { DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";

function objectToFormData(obj: any, form?: FormData, namespace?: string): FormData {
    const fd = form || new FormData();
    let formKey: any;

    for (const property in obj) {
        if (!obj.hasOwnProperty(property)) continue;

        if (namespace) {
            formKey = namespace + "[" + property + "]";
        } else {
            formKey = property;
        }

        const value = obj[property];

        if (value instanceof Date) {
            fd.append(formKey, value.toISOString());
        } else if (value instanceof File) {
            fd.append(formKey, value);
        } else if (Array.isArray(value)) {
            // Handle array uploads
            value.forEach((element) => {
                fd.append(`${formKey}[]`, element);
            });
        } else if (typeof value === "object" && value !== null && !(value instanceof File)) {
            objectToFormData(value, fd, formKey);
        } else {
            if (value !== null && value !== undefined) {
                fd.append(formKey, value.toString());
            }
        }
    }
    return fd;
}

function applyApiErrors<T extends FieldValues>(
    error: any,
    form: ReturnType<typeof useForm<T>>
) {
    const apiErrors = error?.response?.data?.errors;

    if (!Array.isArray(apiErrors)) return false;

    apiErrors.forEach((err) => {
        if (!err.path) return;

        form.setError(err.path as Path<T>, {
            type: "server",
            message: err.message,
        });
    });

    return true;
}

type CustomRenderInput<T extends FieldValues> = (props: {
    field: ControllerRenderProps<T, Path<T>>;
}) => ReactNode;

export type FieldType = "text" | "email" | "password" | "file" | "date" | "number" | "select" | "textarea" | "currency" | "custom" | 'tel';

export interface FormFieldConfig<T extends FieldValues> {
    name: Path<T>;
    label: string;
    type?: FieldType;
    placeholder?: string;
    description?: string;
    options?: { label: string; value: string }[];
    disabled?: boolean;
    className?: string;
    renderCustom?: CustomRenderInput<T>;
    accept?: DropzoneOptions['accept'];
    maxSizes?: number;
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
    condition?: (values: Partial<T>) => boolean;
}

interface ReusableFormProps<T extends FieldValues> {
    form?: UseFormReturn<T>;
    schema: ZodType<T, any, any>;
    defaultValues?: DefaultValues<T>;
    onSubmit: (values: T | FormData) => void;
    fields: FormFieldConfig<T>[];
    submitText?: string;
    isLoading?: boolean;
    submitDisabled?: boolean;
    gridCols?: number;
    useFormData?: boolean;
    children?: ReactNode;
    renderFooter?: ReactNode;

    // Dialog Props
    withDialog?: boolean;
    isDialogOpen?: boolean;
    onDialogOpenChange?: (open: boolean) => void;
    dialogTitle?: ReactNode;
    dialogDescription?: ReactNode;
    showDialogCloseButton?: boolean;
    cancelText?: string;
    resetFormOnClose?: boolean;
    className?: string
    preventClose?: boolean;
    confirmClose?: boolean;
    confirmCloseMessage?: string;
}

export function ReusableForm<T extends FieldValues>({
    form: externalForm,
    schema,
    defaultValues,
    onSubmit,
    fields,
    submitText = "Submit",
    isLoading = false,
    submitDisabled = false,
    withDialog = false,
    isDialogOpen,
    onDialogOpenChange,
    dialogDescription,
    dialogTitle,
    showDialogCloseButton,
    cancelText = "Batal",
    resetFormOnClose = true,
    className,
    preventClose = false,
    confirmClose = true,
    confirmCloseMessage = "Perubahan belum disimpan. Tutup form?",
    gridCols = 1,
    useFormData = false,
    children,
    renderFooter
}: ReusableFormProps<T>) {

    const internalForm = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const form = externalForm ?? internalForm;

    useEffect(() => {
        if (!withDialog) {
            form.reset(defaultValues as DefaultValues<T> | undefined);
            return;
        }
        if (isDialogOpen) {
            form.reset(defaultValues as DefaultValues<T> | undefined);
            return;
        }
        if (!isDialogOpen && resetFormOnClose) {
            form.reset(defaultValues as DefaultValues<T> | undefined);
        }
    }, [defaultValues, isDialogOpen, resetFormOnClose, withDialog, form]);

    const canClose = () => {
        if (preventClose) return false;
        if (confirmClose && form.formState.isDirty) {
            if (typeof window === "undefined") return false;
            return window.confirm(confirmCloseMessage);
        }
        return true;
    };

    const handleClose = () => {
        if (!canClose()) return;
        if (onDialogOpenChange) { onDialogOpenChange(false); }
        if (resetFormOnClose) { form.reset(defaultValues as DefaultValues<T> | undefined); }
    };

    const handleDialogOpenChange = (open: boolean) => {
        if (open) {
            onDialogOpenChange?.(true);
            return;
        }
        handleClose();
    };

    const handleFormSubmit = async (values: T) => {
        try {
            const hasFileField = fields.some((f) => f.type === 'file');

            if (useFormData || hasFileField) {
                const formData = objectToFormData(values);
                await onSubmit(formData);
            } else {
                await onSubmit(values);
            }
        } catch (error: any) {
            console.log('Pot: ', error);

            const handled = applyApiErrors(error, form)

            if (!handled) {
                form.setError(`root`, {
                    type: 'server',
                    message: error?.response?.data?.message ||
                        "Terjadi kesalahan pada server",
                })
            }
        }
    };

    const watchedValues = useWatch({ control: form.control });

    const formFieldsContent = children ?? (
        <div className={`grid grid-cols-1 gap-4 ${GRID_COLS_MAP[gridCols as keyof typeof GRID_COLS_MAP] || 'md:grid-cols-1'}`}>
            {fields.map((field) => {
                if (field.condition && !field.condition(watchedValues)) {
                    return null;
                }

                return (
                    <RenderField
                        key={field.name}
                        field={field}
                        control={form.control}
                    />
                );
            })}
        </div>
    );

    const defaultFooter = withDialog ? (
        <DialogFooter>
            <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
            >
                {cancelText}
            </Button>
            <Button type="submit" disabled={isLoading || submitDisabled}>
                {isLoading ? "Loading..." : submitText}
            </Button>
        </DialogFooter>
    ) : (
        <Button type="submit" disabled={isLoading || submitDisabled} className="w-full">
            {isLoading ? "Loading..." : submitText}
        </Button>
    );

    const formContent = (
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {form.formState.errors.root && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {form.formState.errors.root.message}
                </div>
            )}
            {formFieldsContent}
            {renderFooter ?? defaultFooter}
        </form>
    );

    if (withDialog) {
        return (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                <DialogContent showCloseButton={showDialogCloseButton} className={cn("max-h-[99dvh] overflow-x-auto sm:max-w-[600px]", className)}>
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        {dialogDescription && (
                            <DialogDescription className="leading-relaxed">
                                {dialogDescription}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <Form {...form}>
                        {formContent}
                    </Form>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Form {...form}>
            {formContent}
        </Form>
    );
}

const COL_SPAN_MAP = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    12: "md:col-span-12",
    full: "md:col-span-full",
};

const GRID_COLS_MAP = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
    12: "md:grid-cols-12",
};

function RenderField<T extends FieldValues>({
    field,
    control,
}: {
    field: FormFieldConfig<T>;
    control: Control<T>;
}) {
    return (
        <FormField
            control={control}
            name={field.name}
            render={({ field: formField }) => (
                <FormItem
                    className={cn(
                        "col-span-1", // default mobile
                        field.colSpan && COL_SPAN_MAP[field.colSpan as keyof typeof COL_SPAN_MAP],
                        field.className
                    )}
                >
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl className="col-span-1">
                        <FieldInputSwitch field={field} formField={formField} />
                    </FormControl>

                    {field.description && (
                        <FormDescription>{field.description}</FormDescription>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function FieldInputSwitch<T extends FieldValues>({
    field,
    formField
}: {
    field: FormFieldConfig<T>;
    formField: ControllerRenderProps<T, Path<T>>
}) {
    switch (field.type) {
        case `file`:
            return (
                <ImageUploader
                    onValueChange={formField.onChange}
                    helperText={field.placeholder}
                    disabled={formField.disabled}
                    maxSize={field.maxSizes}
                    key={formField.name + (formField.value ? 'loaded' : 'empty')}
                    accept={field.accept}
                    value={formField.value}
                />
            )
        case "select":
            return (
                <SelectOption
                    {...formField}
                    onValueChange={formField.onChange}
                    disabled={field.disabled}
                    options={field.options || []}
                    value={formField.value!}
                    placeholder={field.placeholder}
                />
            );
        case "textarea":
            return (
                <Textarea
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    {...formField}
                />
            );
        case "password":
            return (
                <PasswordInput
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    {...formField}
                />
            );
        case "custom":
            return <>{
                field.renderCustom?.({ field: formField })
            }</>;
        case "date":
            return <DatePicker
                onValueChange={formField.onChange}
                value={formField.value}
                placeholder={field.placeholder}
                className={field.className + ' w-full'}
            />
        case "currency":
            return (
                <InputCurrency
                    {...formField}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    value={formField.value}
                    onValueChange={(val) => {
                        formField.onChange(val || 0);
                    }}
                    name={formField.name}
                    onBlur={formField.onBlur}
                />
            );
        case 'number':
            return (
                <Input
                    type={'number'}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    {...formField}
                    onChange={(e) => {
                        const value = e.target.value
                        formField.onChange(value === '' ? undefined : Number(value))
                    }}
                />
            );
        default:
            return (
                <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    {...formField}
                    onChange={formField.onChange}
                />
            );
    }
}
