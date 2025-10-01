import React from "react";
import {
  useForm,
  FieldPath,
  FieldValues,
  UseFormProps,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

// =============================================================================
// FORM CONTEXT
// =============================================================================

interface FormContextValue<
  T extends FieldValues = FieldValues
> {
  form: UseFormReturn<T>;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
}

const FormContext =
  React.createContext<FormContextValue | null>(null);

export function useFormContext<
  T extends FieldValues = FieldValues
>() {
  const context = React.useContext(
    FormContext
  ) as FormContextValue<T> | null;

  if (!context) {
    throw new Error(
      "useFormContext must be used within a Form component"
    );
  }

  return context;
}

// =============================================================================
// FORM COMPONENTS
// =============================================================================

interface FormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
  className?: string;
  children: React.ReactNode;
  mode?:
    | "onChange"
    | "onBlur"
    | "onSubmit"
    | "onTouched"
    | "all";
  disabled?: boolean;
  resetOnSubmit?: boolean;
}

export function Form<T extends FieldValues>({
  schema,
  onSubmit,
  defaultValues,
  className,
  children,
  mode = "onBlur",
  disabled = false,
  resetOnSubmit = false,
  ...props
}: FormProps<T>) {
  const [isSubmitting, setIsSubmitting] =
    React.useState(false);
  const [submitError, setSubmitError] = React.useState<
    string | null
  >(null);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    ...props,
  } as UseFormProps<T>);

  const handleSubmit = form.handleSubmit(
    async (data: T) => {
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        await onSubmit(data);

        if (resetOnSubmit) {
          form.reset();
        }
      } catch (error) {
        console.error("Form submission error:", error);

        if (error instanceof Error) {
          setSubmitError(error.message);
        } else {
          setSubmitError(
            "Erro inesperado. Tente novamente."
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  );

  const contextValue: FormContextValue<T> = {
    form,
    isSubmitting,
    errors: form.formState.errors as Record<
      string,
      { message?: string }
    >,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-4", className)}
        noValidate
      >
        {submitError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        <fieldset
          disabled={disabled || isSubmitting}
          className="space-y-4"
        >
          {children}
        </fieldset>
      </form>
    </FormContext.Provider>
  );
}

// =============================================================================
// FIELD COMPONENTS
// =============================================================================

interface FieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  name,
  label,
  description,
  required,
  className,
  children,
}: FieldProps) {
  const { form } = useFormContext();
  const error = form.formState.errors[name];
  const fieldId = `field-${name}`;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label
          htmlFor={fieldId}
          className="text-sm font-medium"
        >
          {label}
          {required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
      )}

      <div className="relative">
        {React.cloneElement(
          children as React.ReactElement,
          {
            id: fieldId,
            "aria-describedby": description
              ? `${fieldId}-description`
              : undefined,
            "aria-invalid": !!error,
          }
        )}
      </div>

      {description && (
        <p
          id={`${fieldId}-description`}
          className="text-xs text-muted-foreground"
        >
          {description}
        </p>
      )}

      {error && (
        <p
          className="text-xs text-destructive"
          role="alert"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// INPUT FIELD COMPONENTS
// =============================================================================

interface InputFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "name"
  > {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function InputField({
  name,
  label,
  description,
  required,
  className,
  ...props
}: InputFieldProps) {
  const { form } = useFormContext();

  return (
    <Field
      name={name}
      label={label}
      description={description}
      required={required}
    >
      <Input
        {...form.register(name)}
        className={cn(
          form.formState.errors[name] &&
            "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    </Field>
  );
}

interface TextareaFieldProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "name"
  > {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function TextareaField({
  name,
  label,
  description,
  required,
  className,
  ...props
}: TextareaFieldProps) {
  const { form } = useFormContext();

  return (
    <Field
      name={name}
      label={label}
      description={description}
      required={required}
    >
      <Textarea
        {...form.register(name)}
        className={cn(
          form.formState.errors[name] &&
            "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    </Field>
  );
}

interface NumberFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "name" | "type"
  > {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function NumberField({
  name,
  label,
  description,
  required,
  className,
  ...props
}: NumberFieldProps) {
  const { form } = useFormContext();

  return (
    <Field
      name={name}
      label={label}
      description={description}
      required={required}
    >
      <Input
        {...form.register(name, { valueAsNumber: true })}
        type="number"
        className={cn(
          form.formState.errors[name] &&
            "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
    </Field>
  );
}

// =============================================================================
// SELECT FIELD COMPONENT
// =============================================================================

interface SelectFieldProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "name"
  > {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  placeholder?: string;
}

export function SelectField({
  name,
  label,
  description,
  required,
  options,
  placeholder,
  className,
  ...props
}: SelectFieldProps) {
  const { form } = useFormContext();

  return (
    <Field
      name={name}
      label={label}
      description={description}
      required={required}
    >
      <select
        {...form.register(name)}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          form.formState.errors[name] &&
            "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(({ value, label, disabled }) => (
          <option
            key={value}
            value={value}
            disabled={disabled}
          >
            {label}
          </option>
        ))}
      </select>
    </Field>
  );
}

// =============================================================================
// CHECKBOX FIELD COMPONENT
// =============================================================================

interface CheckboxFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "name" | "type"
  > {
  name: string;
  label?: string;
  description?: string;
}

export function CheckboxField({
  name,
  label,
  description,
  className,
  ...props
}: CheckboxFieldProps) {
  const { form } = useFormContext();
  const fieldId = `field-${name}`;
  const error = form.formState.errors[name];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start space-x-2">
        <input
          {...form.register(name)}
          type="checkbox"
          id={fieldId}
          className={cn(
            "h-4 w-4 rounded border border-input bg-background text-primary",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive"
          )}
          {...props}
        />

        {label && (
          <Label
            htmlFor={fieldId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </Label>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground ml-6">
          {description}
        </p>
      )}

      {error && (
        <p
          className="text-xs text-destructive ml-6"
          role="alert"
        >
          {error.message}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// SUBMIT BUTTON COMPONENT
// =============================================================================

interface SubmitButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "type"
  > {
  children: React.ReactNode;
  loadingText?: string;
}

export function SubmitButton({
  children,
  loadingText = "Enviando...",
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  const { isSubmitting } = useFormContext();

  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      className={cn("w-full", className)}
      {...props}
    >
      {isSubmitting && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isSubmitting ? loadingText : children}
    </Button>
  );
}

// =============================================================================
// FORM UTILITIES
// =============================================================================

export function FormError({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-medium">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// =============================================================================
// FORM VALIDATION HOOKS
// =============================================================================

export function useFormValidation<T extends FieldValues>(
  schema: z.ZodSchema<T>
) {
  const validate = React.useCallback(
    (data: unknown) => {
      const result = schema.safeParse(data);

      if (result.success) {
        return {
          isValid: true,
          data: result.data,
          errors: {},
        };
      }

      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join(".");
        errors[path] = error.message;
      });

      return { isValid: false, data: null, errors };
    },
    [schema]
  );

  return { validate };
}
