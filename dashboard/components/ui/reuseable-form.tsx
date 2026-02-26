"use client";

import {
  useForm,
  Control,
  FieldValues,
  Path,
  DefaultValues,
  ControllerRenderProps,
  useWatch,
  UseFormReturn,
} from "react-hook-form";
import { useEffect, ReactNode, useState, useRef } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { DatePicker } from "./date-picker";
import ImageUploader from "./ImageUploader";
import { DropzoneOptions } from "react-dropzone";
import { cn } from "@/lib/utils";
import { InputPercentage } from "./input-presentage";
import { DualOptionSwitch } from "./dual-option-switch";
import { SegmentedControl } from "./segmented-control";
import { DateTimePicker } from "./datetime-picker";

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

function applyApiErrors<T extends FieldValues>(error: any, form: ReturnType<typeof useForm<T>>) {
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

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "file"
  | "date"
  | "number"
  | "select"
  | "textarea"
  | "currency"
  | "custom"
  | "tel"
  | "presentage"
  | "dual-option-switch"
  | "toogle"
  | "datetime-local";

type PlaceholderResolver<T extends FieldValues> = string | ((values: Partial<T>) => string);

interface BaseFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: PlaceholderResolver<T>;
  description?: string;
  disabled?: boolean;
  className?: string;
  valueToUpperCase?: boolean;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | "full";
  renderCustom?: CustomRenderInput<T>;
  condition?: (values: Partial<T>) => boolean;
  typeResolver?: (values: Partial<T>) => FieldType;
  type?: FieldType;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ImageFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "file";
  accept?: DropzoneOptions["accept"];
  maxSizes?: number;
}

interface SelectFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "select";
  options?: { label: string; value: string }[];
}

interface ToogleFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "toogle";
  options?: { label: string; value: string; disabled?: boolean }[];
}

interface SwitchFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "dual-option-switch";
  switchOptions: {
    left: {
      label: string;
      value: any;
      activeClass?: string;
      icon?: React.ComponentType<{ className?: string }>;
    };
    right: {
      label: string;
      value: any;
      activeClass?: string;
      icon?: React.ComponentType<{ className?: string }>;
    };
  };
}

interface StandardFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type?: Exclude<FieldType, "select" | "dual-option-switch" | "file">;
  options?: never;
  switchOptions?: never;
}

export type FormFieldConfig<T extends FieldValues> =
  | ImageFieldConfig<T>
  | SwitchFieldConfig<T>
  | SelectFieldConfig<T>
  | ToogleFieldConfig<T>
  | StandardFieldConfig<T>
  | ({ type: "custom"; renderCustom: CustomRenderInput<T> } & BaseFieldConfig<T>);

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
  onValuesChange?: (values: Partial<T>) => void;
  hideSubmitButton?: boolean;

  // Dialog Props
  withDialog?: boolean;
  id?: string;
  isDialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  dialogTitle?: ReactNode;
  dialogDescription?: ReactNode;
  showDialogCloseButton?: boolean;
  cancelText?: string;
  resetFormOnClose?: boolean;
  className?: string;
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
  renderFooter,
  onValuesChange,
  hideSubmitButton,
  id,
}: ReusableFormProps<T>) {
  const [internalLoading, setInternalLoading] = useState(false);
  const wasDialogOpen = useRef(false);

  const internalForm = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const form = externalForm ?? internalForm;

  useEffect(() => {
    if (!withDialog) return;

    // dialog baru saja dibuka
    if (isDialogOpen && !wasDialogOpen.current) {
      form.reset(defaultValues as DefaultValues<T> | undefined);
    }

    wasDialogOpen.current = !!isDialogOpen;
  }, [isDialogOpen, withDialog, defaultValues]);

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
    if (onDialogOpenChange) {
      onDialogOpenChange(false);
    }
    if (resetFormOnClose) {
      form.reset(defaultValues as DefaultValues<T> | undefined);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) {
      onDialogOpenChange?.(true);
      return;
    }
    handleClose();
  };

  const handleFormSubmit = async (values: T) => {
    form.clearErrors("root");
    try {
      setInternalLoading(true);
      const hasFileField = fields.some((f) => f.type === "file");
      if (useFormData || hasFileField) {
        const formData = objectToFormData(values);
        await onSubmit(formData);
      } else {
        await onSubmit(values);
      }
    } catch (error: any) {
      console.log("Error: ", error);

      const handled = applyApiErrors(error, form);

      if (!handled) {
        form.setError(`root`, {
          type: "server",
          message: error?.response?.data?.message || "Terjadi kesalahan pada server",
        });
      }
    } finally {
      setInternalLoading(false);
    }
  };

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(watchedValues);
    }
  }, [watchedValues, onValuesChange]);

  const formFieldsContent = children ?? (
    <div
      className={`grid grid-cols-1 gap-4 ${GRID_COLS_MAP[gridCols as keyof typeof GRID_COLS_MAP] || "md:grid-cols-1"}`}>
      {fields.map((field) => {
        if (field.condition && !field.condition(watchedValues)) {
          return null;
        }

        return (
          <RenderField
            key={field.name}
            field={field}
            control={form.control}
            values={watchedValues}
          />
        );
      })}
    </div>
  );

  const defaultFooter = hideSubmitButton ? null : withDialog ? (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        onClick={handleClose}
        disabled={isLoading || internalLoading}>
        {cancelText}
      </Button>
      <Button
        type="submit"
        className={`${isLoading || internalLoading ? "cursor-progress" : "cursor-pointer"}`}
        disabled={isLoading || submitDisabled}>
        {isLoading || internalLoading ? "Loading..." : submitText}
      </Button>
    </DialogFooter>
  ) : (
    <Button type="submit" disabled={isLoading || submitDisabled} className="w-full">
      {isLoading ? "Loading..." : submitText}
    </Button>
  );

  const formContent = (
    <form id={id} onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
        <DialogContent
          showCloseButton={showDialogCloseButton}
          className={cn(
            "h-[100dvh] min-w-full md:min-w-[600px] md:h-auto rounded-none md:max-h-[99dvh] overflow-x-auto",
            className,
          )}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            {dialogDescription && (
              <DialogDescription className="leading-relaxed">{dialogDescription}</DialogDescription>
            )}
          </DialogHeader>
          <Form {...form}>{formContent}</Form>
        </DialogContent>
      </Dialog>
    );
  }

  return <Form {...form}>{formContent}</Form>;
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

function resolvePlaceholder<T extends FieldValues>(
  placeholder: PlaceholderResolver<T> | undefined,
  values: Partial<T>,
): string | undefined {
  if (typeof placeholder === "function") {
    return placeholder(values);
  }
  return placeholder;
}

function RenderField<T extends FieldValues>({
  field,
  control,
  values,
}: {
  field: FormFieldConfig<T>;
  control: Control<T>;
  values: Partial<T>;
}) {
  const resolvedType = field.typeResolver?.(values) ?? field.type;

  return (
    <FormField
      control={control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem
          className={cn(
            "col-span-1", // default mobile
            field.colSpan && COL_SPAN_MAP[field.colSpan as keyof typeof COL_SPAN_MAP],
            // field.className <--- Removed this because it duplicates styling on the container, causing layout issues (e.g. specific heights applied to container instead of input)
          )}>
          <FormLabel htmlFor={field.name}>{field.label}</FormLabel>
          <FormControl className="col-span-1">
            <FieldInputSwitch
              allValues={values}
              field={{ ...field, type: resolvedType } as FormFieldConfig<T>}
              formField={formField}
            />
          </FormControl>

          {field.description && <FormDescription>{field.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FieldInputSwitch<T extends FieldValues>({
  field,
  formField,
  allValues,
}: {
  field: FormFieldConfig<T>;
  formField: ControllerRenderProps<T, Path<T>>;
  allValues: Partial<T>;
}) {
  const placeholderText = resolvePlaceholder(field.placeholder, allValues);
  const Icon = field.icon;

  switch (field.type) {
    case `file`:
      return (
        <div className="w-[87dvw] md:w-full">
          <ImageUploader
            onValueChange={formField.onChange}
            helperText={placeholderText}
            disabled={formField.disabled}
            maxSize={field.maxSizes}
            key={formField.name + (formField.value ? "loaded" : "empty")}
            accept={field.accept}
            value={formField.value}
          />
        </div>
      );
    case "select":
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <SelectOption
            {...formField}
            id={formField.name}
            onValueChange={formField.onChange}
            disabled={field.disabled}
            options={field.options || []}
            value={formField.value!}
            placeholder={placeholderText}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
          />
        </div>
      );
    case "toogle":
      return (
        <SegmentedControl
          {...formField}
          size="sm"
          id={formField.name}
          onChange={formField.onChange}
          options={field.options || []}
          value={formField.value!}
        />
      );
    case "dual-option-switch":
      return (
        <DualOptionSwitch
          {...formField}
          className={field.className}
          id={formField.name}
          onValueChange={formField.onChange}
          disabled={field.disabled}
          options={field.switchOptions!}
          value={formField.value!}
        />
      );
    case "datetime-local":
      return (
        <DateTimePicker
          {...formField}
          className={field.className}
          id={formField.name}
          onChange={formField.onChange}
          disabled={field.disabled}
          value={formField.value!}
        />
      );
    case "presentage":
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <InputPercentage
            {...formField}
            id={formField.name}
            onValueChange={formField.onChange}
            disabled={field.disabled}
            value={formField.value!}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
            placeholder={placeholderText}
          />
        </div>
      );
    case "textarea":
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <Textarea
            id={formField.name}
            placeholder={placeholderText}
            disabled={field.disabled}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
            {...formField}
          />
        </div>
      );
    case "password":
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <PasswordInput
            id={formField.name}
            placeholder={placeholderText}
            disabled={field.disabled}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
            {...formField}
          />
        </div>
      );
    case "custom":
      return <>{field.renderCustom?.({ field: formField })}</>;
    case "date":
      return (
        <DatePicker
          id={formField.name}
          onValueChange={formField.onChange}
          value={formField.value}
          placeholder={placeholderText}
          className={field.className + " w-full"}
        />
      );
    case "currency":
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <InputCurrency
            {...formField}
            id={formField.name}
            placeholder={placeholderText}
            disabled={field.disabled}
            value={formField.value}
            onValueChange={(val) => {
              formField.onChange(val || 0);
            }}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
            name={formField.name}
            onBlur={formField.onBlur}
          />
        </div>
      );
    case "number":
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <Input
            id={formField.name}
            type={"number"}
            placeholder={placeholderText}
            disabled={field.disabled}
            {...formField}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
            onChange={(e) => {
              const value = e.target.value;
              formField.onChange(value === "" ? undefined : Number(value));
            }}
          />
        </div>
      );
    default:
      return (
        <div className="relative">
          {Icon && <Icon className={`absolute left-3 top-3.5 h-4 w-4 text-muted-foreground`} />}
          <Input
            id={formField.name}
            type={field.type || "text"}
            placeholder={placeholderText}
            disabled={field.disabled}
            className={`${Icon ? "pl-9" : ""} text-sm ${field.className}`}
            {...formField}
            onChange={(e) => {
              let value = e.target.value;
              if (field.valueToUpperCase) value = value.toUpperCase();
              formField.onChange(value);
            }}
          />
        </div>
      );
  }
}
