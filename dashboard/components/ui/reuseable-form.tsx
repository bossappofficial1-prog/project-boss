"use client";

import {
  useForm,
  useFieldArray,
  Control,
  FieldValues,
  Path,
  DefaultValues,
  ControllerRenderProps,
  useWatch,
  UseFormReturn,
  UseFieldArrayReturn,
  ArrayPath,
  FieldArray,
  useFormContext,
} from "react-hook-form";
import { useEffect, ReactNode, useState, useRef, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";
import { AxiosError } from "axios";
import { DropzoneOptions } from "react-dropzone";

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { PasswordInput } from "./password-input";
import InputCurrency from "./input-currency";
import { DatePicker } from "./date-picker";
import { DateTimePicker } from "./datetime-picker";
import { FileUploader, FileUploaderVariant } from "./image-uploader";
import { InputPercentage } from "./input-presentage";
import { SegmentedControl } from "./segmented-control";
import { DualOptionSwitch } from "./dual-option-switch";
import { SelectOption } from "../shared/select-option";
import { ZodTypeDef } from "zod/v3";

const COL_SPAN_CLASS = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  12: "md:col-span-12",
  full: "md:col-span-full",
} as const;

const GRID_COLS_CLASS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  12: "md:grid-cols-12",
} as const;

type ColSpan = keyof typeof COL_SPAN_CLASS;
type GridCols = keyof typeof GRID_COLS_CLASS;

interface ApiErrorItem {
  path: string;
  message: string;
}

interface ApiErrorResponse {
  errors?: ApiErrorItem[];
  message?: string;
}

function objectToFormData(
  obj: Record<string, unknown>,
  form: FormData = new FormData(),
  namespace?: string,
): FormData {
  for (const [property, value] of Object.entries(obj)) {
    const key = namespace ? `${namespace}[${property}]` : property;
    if (value == null) continue;
    if (value instanceof Date) {
      form.append(key, value.toISOString());
    } else if (value instanceof File) {
      form.append(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (item instanceof File) {
          form.append(`${key}[]`, item);
        } else {
          form.append(`${key}[]`, String(item));
        }
      }
    } else if (typeof value === "object") {
      objectToFormData(value as Record<string, unknown>, form, key);
    } else {
      form.append(key, String(value));
    }
  }
  return form;
}

function applyApiErrors<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
): boolean {
  if (!(error instanceof AxiosError)) return false;
  const apiErrors = error.response?.data?.errors;
  if (!Array.isArray(apiErrors)) return false;
  for (const e of apiErrors as Partial<ApiErrorItem>[]) {
    if (e.path && e.message) {
      form.setError(e.path as Path<T>, { type: "server", message: e.message });
    }
  }
  return true;
}

// Extracted outside component to avoid re-creation on every render
function adaptNestedField<T extends FieldValues>(
  subField: FormFieldConfig<T>,
  newName: string,
  itemIndex?: number,
  arrayFieldName?: string,
): FormFieldConfig<T> {
  const cloned = { ...subField, name: newName as Path<T> };
  if (cloned.type === "array") {
    console.warn(
      "Nested array fields are not supported, converting to text field",
    );
    (cloned as unknown as TextFieldConfig<T>).type = "text";
  }

  // Wrap dependsOn for array sub-fields to resolve against item-level data first
  if (cloned.dependsOn && itemIndex !== undefined && arrayFieldName) {
    const originalDependsOn = cloned.dependsOn;
    const itemPrefix = `${arrayFieldName}.${itemIndex}.`;
    cloned.dependsOn = {
      ...originalDependsOn,
      condition: (value: unknown, allValues: Partial<T>) => {
        // Check item-level data first
        const itemKey = `${itemPrefix}${originalDependsOn.field}` as Path<T>;
        const itemValue = (allValues as Record<string, unknown>)[itemKey as string];
        if (itemValue !== undefined) {
          return originalDependsOn.condition(itemValue, allValues);
        }
        // Fall back to form-level
        return originalDependsOn.condition(value, allValues);
      },
    };
  }

  return cloned as FormFieldConfig<T>;
}

function getEmptyItem<T extends FieldValues>(): FieldArray<T, ArrayPath<T>> {
  return {} as FieldArray<T, ArrayPath<T>>;
}

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
  | "toggle"
  | "dual-option-switch"
  | "datetime-local"
  | "percentage"
  | "array";

type PlaceholderFn<T extends FieldValues> = (values: Partial<T>) => string;
type PlaceholderResolver<T extends FieldValues> = string | PlaceholderFn<T>;
type CustomRenderInput<T extends FieldValues> = (props: {
  field: ControllerRenderProps<T, Path<T>>;
  values: Partial<T>;
  form: UseFormReturn<T>;
}) => ReactNode;

interface BaseFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  placeholder?: PlaceholderResolver<T>;
  description?: string;
  disabled?: boolean;
  className?: string;
  valueToUpperCase?: boolean;
  colSpan?: ColSpan;
  icon?: React.ComponentType<{ className?: string }>;
  condition?: (values: Partial<T>) => boolean;
  typeResolver?: (values: Partial<T>) => FieldType;
  dependsOn?: {
    field: Path<T>;
    condition: (value: unknown, allValues: Partial<T>) => boolean;
    then?: (fieldConfig: FormFieldConfig<T>) => Partial<FormFieldConfig<T>>;
  };
}

interface TextFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type?: Exclude<
    FieldType,
    "select" | "toggle" | "dual-option-switch" | "file" | "custom" | "array"
  >;
}

interface SelectFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "select";
  options: { label: string; value: string }[];
}

interface ToggleFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "toggle";
  options: { label: string; value: string; disabled?: boolean }[];
}

interface DualSwitchFieldConfig<
  T extends FieldValues,
> extends BaseFieldConfig<T> {
  type: "dual-option-switch";
  switchOptions: {
    left: {
      label: string;
      value: unknown;
      activeClass?: string;
      icon?: React.ComponentType<{ className?: string }>;
    };
    right: {
      label: string;
      value: unknown;
      activeClass?: string;
      icon?: React.ComponentType<{ className?: string }>;
    };
  };
}

interface FileFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "file";
  accept?: DropzoneOptions["accept"];
  maxSizes?: number;
  variant?: FileUploaderVariant;
}

interface CustomFieldConfig<T extends FieldValues> extends BaseFieldConfig<T> {
  type: "custom";
  renderCustom: CustomRenderInput<T>;
}

interface ArrayFieldConfig<T extends FieldValues> extends Omit<
  BaseFieldConfig<T>,
  "name"
> {
  type: "array";
  name: ArrayPath<T>;
  arrayFields: FormFieldConfig<T>[];
  defaultItem?: Partial<FieldArray<T, ArrayPath<T>>>;
  renderItem?: (
    index: number,
    remove: () => void,
    fieldsArray: UseFieldArrayReturn<T, ArrayPath<T>>,
  ) => ReactNode;
  addButtonText?: string;
  removeButtonText?: string;
}

export type FormFieldConfig<T extends FieldValues> =
  | SelectFieldConfig<T>
  | ToggleFieldConfig<T>
  | DualSwitchFieldConfig<T>
  | FileFieldConfig<T>
  | CustomFieldConfig<T>
  | ArrayFieldConfig<T>
  | TextFieldConfig<T>;

interface DialogProps {
  withDialog: true;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  dialogTitle?: ReactNode;
  dialogDescription?: ReactNode;
  showDialogCloseButton?: boolean;
  cancelText?: string;
  resetFormOnClose?: boolean;
  preventClose?: boolean;
  confirmClose?: boolean;
  confirmCloseMessage?: string;
}

interface NoDialogProps {
  withDialog?: false;
}

export interface WizardStep<T extends FieldValues> {
  title: string;
  fields: Path<T>[];
  description?: string;
}

interface AutoSaveConfig<T extends FieldValues> {
  enabled: boolean;
  delay?: number;
  onSave?: (data: Partial<T>) => void;
  storageKey?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm<T extends FieldValues> = UseFormReturn<T, any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema<T extends FieldValues> = ZodType<T, ZodTypeDef, any>;

interface SharedFormProps<T extends FieldValues> {
  form?: AnyForm<T>;
  schema: AnySchema<T>;
  defaultValues?: DefaultValues<T>;
  fields: FormFieldConfig<T>[];
  submitText?: string;
  loadingText?: string;
  isLoading?: boolean;
  submitDisabled?: boolean;
  gridCols?: GridCols;
  children?: ReactNode;
  header?: ReactNode;
  renderFooter?: ReactNode;
  onValuesChange?: (values: Partial<T>) => void;
  hideSubmitButton?: boolean;
  id?: string;
  className?: string;
  errorSummary?: boolean;
  autoSave?: AutoSaveConfig<T>;
  steps?: WizardStep<T>[];
}

interface WithFormDataProps<T extends FieldValues> extends SharedFormProps<T> {
  useFormData: true;
  onSubmit: (values: FormData) => void | Promise<void>;
}

interface WithoutFormDataProps<
  T extends FieldValues,
> extends SharedFormProps<T> {
  useFormData?: false;
  onSubmit: (values: NoInfer<T>) => void | Promise<void>;
}

type BaseFormProps<T extends FieldValues> =
  | WithFormDataProps<T>
  | WithoutFormDataProps<T>;

export type ReusableFormProps<T extends FieldValues> = BaseFormProps<T> &
  (DialogProps | NoDialogProps);

export function ReusableForm<T extends FieldValues>({
  form: externalForm,
  schema,
  defaultValues,
  onSubmit,
  fields,
  submitText = "Submit",
  loadingText = "Submitting...",
  isLoading = false,
  submitDisabled = false,
  gridCols = 1,
  children,
  header,
  renderFooter,
  onValuesChange,
  hideSubmitButton = false,
  id,
  className,
  errorSummary = false,
  autoSave,
  steps,
  ...rest
}: ReusableFormProps<T>) {
  const isDialog = rest.withDialog === true;
  const dialogProps = isDialog ? (rest as unknown as DialogProps) : null;
  const useFormData = "useFormData" in rest && rest.useFormData === true;

  const [submitting, setSubmitting] = useState(false);
  const wasOpenRef = useRef(false);
  const prevDefaultValuesStrRef = useRef<string>("");
  const [currentStep, setCurrentStep] = useState(0);

  const internalForm = useForm<T>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as ZodType<FieldValues, ZodTypeDef, any>),
    defaultValues,
  });

  const form: AnyForm<T> = (externalForm ?? internalForm) as AnyForm<T>;

  // Reset when defaultValues change (covers async-loaded data for non-dialog forms)
  // and reset on dialog re-open
  useEffect(() => {
    if (defaultValues === undefined) return;
    const defaultValuesStr = JSON.stringify(defaultValues);
    const hasChanged = defaultValuesStr !== prevDefaultValuesStrRef.current;

    if (dialogProps) {
      if (dialogProps.isDialogOpen && (!wasOpenRef.current || hasChanged)) {
        form.reset(defaultValues);
      }
      wasOpenRef.current = dialogProps.isDialogOpen;
    } else if (hasChanged) {
      form.reset(defaultValues);
    }

    prevDefaultValuesStrRef.current = defaultValuesStr;
  }, [dialogProps?.isDialogOpen, defaultValues, form]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    onValuesChange?.(watchedValues);
  }, [watchedValues, onValuesChange]);

  // Auto-save: use stable refs for callbacks to avoid adding them as deps
  const autoSaveOnSaveRef = useRef(autoSave?.onSave);
  autoSaveOnSaveRef.current = autoSave?.onSave;

  useEffect(() => {
    if (!autoSave?.enabled) return;
    const delay = autoSave.delay ?? 1000;
    const id = setTimeout(() => {
      if (autoSaveOnSaveRef.current) {
        autoSaveOnSaveRef.current(watchedValues);
      } else if (autoSave.storageKey) {
        localStorage.setItem(
          autoSave.storageKey,
          JSON.stringify(watchedValues),
        );
      }
    }, delay);
    return () => clearTimeout(id);
  }, [watchedValues, autoSave?.enabled, autoSave?.delay, autoSave?.storageKey]);

  // Load saved data on mount
  useEffect(() => {
    if (!autoSave?.storageKey) return;
    const saved = localStorage.getItem(autoSave.storageKey);
    if (!saved) return;
    try {
      form.reset(JSON.parse(saved));
    } catch {
      // malformed storage data, ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isWizard = !!steps?.length;
  const currentStepFields = isWizard
    ? steps![currentStep].fields
    : fields.map((f) => f.name);
  const visibleFields = isWizard
    ? fields.filter((f) => currentStepFields.includes(f.name))
    : fields;

  const goToNextStep = useCallback(async () => {
    const isValid = await form.trigger(currentStepFields as Path<T>[]);
    if (isValid && currentStep < steps!.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [form, currentStep, currentStepFields, steps]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const canClose = useCallback((): boolean => {
    if (!dialogProps) return true;
    if (dialogProps.preventClose) return false;
    if ((dialogProps.confirmClose ?? true) && form.formState.isDirty) {
      const message =
        dialogProps.confirmCloseMessage ??
        "Perubahan belum disimpan. Tutup form?";
      return typeof window !== "undefined" && window.confirm(message);
    }
    return true;
  }, [dialogProps, form.formState.isDirty]);

  const handleClose = useCallback(() => {
    if (!canClose() || !dialogProps) return;
    dialogProps.onDialogOpenChange(false);
    if (dialogProps.resetFormOnClose ?? true) {
      form.reset(defaultValues);
    }
  }, [canClose, dialogProps, form, defaultValues]);

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (open) dialogProps?.onDialogOpenChange(true);
      else handleClose();
    },
    [dialogProps, handleClose],
  );

  const handleFormSubmit = useCallback(
    async (values: T) => {
      form.clearErrors("root");
      setSubmitting(true);
      try {
        const hasFileField = fields.some((f) => f.type === "file");
        if (useFormData || hasFileField) {
          const formData = objectToFormData(values as Record<string, unknown>);
          await (onSubmit as (v: FormData) => void | Promise<void>)(formData);
        } else {
          await (onSubmit as (v: T) => void | Promise<void>)(values);
        }
      } catch (error) {
        const handled = applyApiErrors(error, form);
        if (!handled) {
          const axiosError = error as AxiosError<ApiErrorResponse>;
          form.setError("root", {
            type: "server",
            message:
              axiosError?.response?.data?.message ??
              "Terjadi kesalahan pada server",
          });
        }
      } finally {
        setSubmitting(false);
      }
    },
    [fields, form, onSubmit, useFormData],
  );

  const scrollToField = useCallback((fieldName: string) => {
    const element = document.querySelector<HTMLElement>(
      `[name="${fieldName}"]`,
    );
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  }, []);

  const busy = isLoading || submitting;
  const formControl = form.control as unknown as Control<T>;
  const gridClass = GRID_COLS_CLASS[gridCols] ?? "md:grid-cols-1";

  const fieldGrid = (
    <>
      {header}

      {children ?? (
        <>
          {errorSummary && Object.keys(form.formState.errors).length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-semibold">Terdapat kesalahan:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {Object.entries(form.formState.errors).map(([name, error]) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => scrollToField(name)}
                      className="hover:underline cursor-pointer text-left"
                    >
                      {error?.message?.toString()}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isWizard && (
            <div className="mb-4">
              <h3 className="text-lg font-medium">{steps![currentStep].title}</h3>
              {steps![currentStep].description && (
                <p className="text-sm text-muted-foreground">
                  {steps![currentStep].description}
                </p>
              )}
            </div>
          )}

          <div className={`grid grid-cols-1 gap-4 ${gridClass}`}>
            {visibleFields.map((fieldConfig) => {
              if (fieldConfig.condition && !fieldConfig.condition(watchedValues))
                return null;
              return (
            <RenderField
              key={fieldConfig.name}
              field={fieldConfig}
              form={form}
              values={watchedValues}
            />
          );
        })}
      </div>
        </>
      )}
    </>
  );

  const footer = (() => {
    if (hideSubmitButton) return null;
    if (renderFooter !== undefined) return renderFooter;

    if (isWizard) {
      return (
        <div className="flex justify-between gap-2">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevStep}
              disabled={busy}
            >
              Kembali
            </Button>
          )}
          {currentStep < steps!.length - 1 ? (
            <Button type="button" onClick={goToNextStep} disabled={busy}>
              Selanjutnya
            </Button>
          ) : (
            <Button type="submit" disabled={busy || submitDisabled}>
              {busy ? loadingText : submitText}
            </Button>
          )}
        </div>
      );
    }

    if (dialogProps) {
      return (
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={busy}
          >
            {dialogProps.cancelText ?? "Batal"}
          </Button>
          <Button type="submit" disabled={busy || submitDisabled}>
            {busy ? loadingText : submitText}
          </Button>
        </DialogFooter>
      );
    }

    return (
      <Button
        type="submit"
        disabled={busy || submitDisabled}
        className="w-full"
      >
        {busy ? loadingText : submitText}
      </Button>
    );
  })();

  const formContent = (
    <form
      id={id}
      onSubmit={form.handleSubmit(handleFormSubmit)}
      className="space-y-6"
    >
      {form.formState.errors.root && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      {fieldGrid}
      {footer}
    </form>
  );

  if (dialogProps) {
    return (
      <Dialog
        open={dialogProps.isDialogOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent
          showCloseButton={dialogProps.showDialogCloseButton}
          className={cn(
            "h-dvh min-w-full md:min-w-150 md:h-auto rounded-none md:max-h-[99dvh] overflow-x-auto",
            className,
          )}
        >
          <DialogHeader>
            <DialogTitle>{dialogProps.dialogTitle}</DialogTitle>
            {dialogProps.dialogDescription && (
              <DialogDescription className="leading-relaxed">
                {dialogProps.dialogDescription}
              </DialogDescription>
            )}
          </DialogHeader>
          <Form {...form}>{formContent}</Form>
        </DialogContent>
      </Dialog>
    );
  }

  return <Form {...form}>{formContent}</Form>;
}

function resolvePlaceholder<T extends FieldValues>(
  placeholder: PlaceholderResolver<T> | undefined,
  values: Partial<T>,
): string | undefined {
  return typeof placeholder === "function" ? placeholder(values) : placeholder;
}

function RenderField<T extends FieldValues>({
  field,
  form,
  values,
}: {
  field: FormFieldConfig<T>;
  form: UseFormReturn<T>;
  values: Partial<T>;
}) {
  let finalField = field;
  if (field.dependsOn) {
    const depValue = values[field.dependsOn.field];
    if (field.dependsOn.condition(depValue, values)) {
      const thenResult = field.dependsOn.then?.(field) ?? {};
      finalField = {
        ...field,
        ...thenResult,
        type: thenResult.type ?? field.type,
      } as FormFieldConfig<T>;
    }
  }

  const resolvedType = finalField.typeResolver?.(values) ?? finalField.type;
  const colSpanClass = finalField.colSpan
    ? COL_SPAN_CLASS[finalField.colSpan]
    : undefined;

  return (
    <FormField
      control={form.control}
      name={finalField.name as Path<T>}
      render={({ field: formField }) => (
        <FormItem className={cn("col-span-1", colSpanClass)}>
          <FormLabel htmlFor={finalField.name}>{finalField.label}</FormLabel>
          <FormControl>
            <FieldInputSwitch
              field={
                { ...finalField, type: resolvedType } as FormFieldConfig<T>
              }
              formField={formField}
              values={values}
              form={form}
            />
          </FormControl>
          {finalField.description && (
            <FormDescription className="text-xs">
              {finalField.description}
            </FormDescription>
          )}
          <FormMessage className="text-sm" />
        </FormItem>
      )}
    />
  );
}

// Extracted as its own component to satisfy Rules of Hooks
// (useFieldArray cannot be called conditionally inside FieldInputSwitch)
function ArrayFieldRenderer<T extends FieldValues>({
  field,
  form,
  values,
}: {
  field: ArrayFieldConfig<T>;
  form: UseFormReturn<T>;
  values: Partial<T>;
}) {
  const arrayHelpers = useFieldArray({
    control: form.control,
    name: field.name as ArrayPath<T>,
  });
  const { fields: arrayFields, append, remove } = arrayHelpers;

  const addButtonText = field.addButtonText ?? "Tambah Item";
  const removeButtonText = field.removeButtonText ?? "Hapus";

  const handleAddItem = useCallback(() => {
    if (field.defaultItem) {
      append(field.defaultItem as FieldArray<T, ArrayPath<T>>);
    } else {
      append(getEmptyItem<T>());
    }
  }, [append, field.defaultItem]);

  return (
    <div className="space-y-4">
      {arrayFields.map((item, index) => (
        <div key={item.id} className="border p-4 rounded-md relative">
          {field.renderItem ? (
            field.renderItem(index, () => remove(index), arrayHelpers)
          ) : (
            <>
              {field.arrayFields.map((subField) => {
                const newName = `${field.name}.${index}.${subField.name}`;
                const adaptedField = adaptNestedField(
                  subField,
                  newName,
                  index,
                  field.name as string,
                );
                return (
                  <RenderField
                    key={subField.name}
                    field={adaptedField}
                    form={form}
                    values={values}
                  />
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="absolute top-2 right-2"
              >
                {removeButtonText}
              </Button>
            </>
          )}
        </div>
      ))}
      <Button
        type="button"
        onClick={handleAddItem}
        variant="outline"
        size="sm"
      >
        {addButtonText}
      </Button>
    </div>
  );
}

function FieldInputSwitch<T extends FieldValues>({
  field,
  formField,
  values,
  form,
}: {
  field: FormFieldConfig<T>;
  formField: ControllerRenderProps<T, Path<T>>;
  values: Partial<T>;
  form: UseFormReturn<T>;
}) {
  if (field.type === "array") {
    return (
      <ArrayFieldRenderer
        field={field as ArrayFieldConfig<T>}
        form={form}
        values={values}
      />
    );
  }

  const placeholder = resolvePlaceholder(field.placeholder, values);
  const Icon = field.icon;
  const iconClass = Icon ? "pl-9" : "";
  const baseClass = `text-sm ${field.className ?? ""}`;

  const withIcon = (input: ReactNode) =>
    Icon ? (
      <div className="relative">
        <Icon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        {input}
      </div>
    ) : (
      input
    );

  switch (field.type) {
    case "file":
      return (
        <div className="w-[87dvw] md:w-full">
          <FileUploader
            variant={(field as FileFieldConfig<T>).variant}
            onValueChange={formField.onChange}
            helperText={placeholder}
            disabled={formField.disabled}
            maxSize={(field as FileFieldConfig<T>).maxSizes}
            key={formField.name + (formField.value ? "loaded" : "empty")}
            accept={(field as FileFieldConfig<T>).accept}
            value={formField.value}
          />
        </div>
      );

    case "select":
      return (
        <SelectOption
          {...formField}
          id={formField.name}
          onValueChange={formField.onChange}
          disabled={field.disabled}
          options={(field as SelectFieldConfig<T>).options}
          value={formField.value as string}
          placeholder={placeholder}
          className={cn(iconClass, baseClass)}
        />
      );

    case "toggle":
      return (
        <SegmentedControl
          {...formField}
          size="sm"
          id={formField.name}
          onChange={formField.onChange}
          options={(field as ToggleFieldConfig<T>).options}
          value={formField.value as string}
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
          options={(field as DualSwitchFieldConfig<T>).switchOptions}
          value={formField.value}
        />
      );

    case "datetime-local":
      return (
        <DateTimePicker
          {...formField}
          id={formField.name}
          onChange={formField.onChange}
          disabled={field.disabled}
          value={formField.value}
          className={field.className}
        />
      );

    case "percentage":
      return withIcon(
        <InputPercentage
          {...formField}
          id={formField.name}
          onValueChange={formField.onChange}
          disabled={field.disabled}
          value={formField.value as number}
          className={cn(iconClass, baseClass)}
          placeholder={placeholder}
        />,
      );

    case "textarea":
      return withIcon(
        <Textarea
          id={formField.name}
          placeholder={placeholder}
          disabled={field.disabled}
          className={cn(iconClass, baseClass)}
          {...formField}
        />,
      );

    case "password":
      return withIcon(
        <PasswordInput
          id={formField.name}
          placeholder={placeholder}
          disabled={field.disabled}
          className={cn(iconClass, baseClass)}
          {...formField}
        />,
      );

    case "custom": {
      const { renderCustom } = field as CustomFieldConfig<T>;
      return <>{renderCustom?.({ field: formField, values, form })}</>;
    }

    case "date": {
      const rawValue = formField.value;
      const value =
        typeof rawValue === "string" && !isNaN(Date.parse(rawValue))
          ? rawValue
          : "";
      return (
        <DatePicker
          id={formField.name}
          onValueChange={formField.onChange}
          value={value}
          placeholder={placeholder}
          className={cn("w-full", field.className)}
        />
      );
    }

    case "currency":
      return withIcon(
        <InputCurrency
          {...formField}
          id={formField.name}
          placeholder={placeholder}
          disabled={field.disabled}
          value={formField.value as number}
          onValueChange={(val) => formField.onChange(val ?? 0)}
          className={cn(iconClass, baseClass)}
          name={formField.name}
          onBlur={formField.onBlur}
        />,
      );

    case "number":
      return withIcon(
        <Input
          id={formField.name}
          type="number"
          placeholder={placeholder}
          disabled={field.disabled}
          className={cn(iconClass, baseClass)}
          {...formField}
          onChange={(e) =>
            formField.onChange(
              e.target.value === "" ? undefined : Number(e.target.value),
            )
          }
        />,
      );

    default:
      return withIcon(
        <Input
          id={formField.name}
          type={field.type ?? "text"}
          placeholder={placeholder}
          disabled={field.disabled}
          className={cn(iconClass, baseClass)}
          {...formField}
          onChange={(e) => {
            const value = field.valueToUpperCase
              ? e.target.value.toUpperCase()
              : e.target.value;
            formField.onChange(value);
          }}
        />,
      );
  }
}
