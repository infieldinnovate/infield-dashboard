// components/forms/form_elements/select.tsx

"use client";

import React, { forwardRef, useId } from "react";
import {
  FieldError,
  FieldValues,
  UseFormRegister,
  Control,
  Controller,
  RegisterOptions,
} from "react-hook-form";
import clsx from "clsx";
import { ChevronDown, type LucideIcon } from "lucide-react";
import styles from "./formElement.module.scss";

type SelectOption = { value: string | number; label: string };

type SelectFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  label?: string;
  /** Option A: uncontrolled/register usage */
  register?: UseFormRegister<TFieldValues>;
  registerOptions?: RegisterOptions<TFieldValues, any>;
  /** Option B: controlled via react-hook-form Controller */
  control?: Control<TFieldValues>;
  name: string;
  id?: string;
  /** widened to any to avoid the strict PathValueImpl mismatch */
  defaultValue?: any;
  error?: FieldError | null;
  hidden?: boolean;
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  options: SelectOption[];
  icon?: LucideIcon;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  selectWrapperClassName?: string;
  selectClassName?: string;
};

const UncontrolledSelect = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ children, ...props }, ref) => (
  <select ref={ref} {...props}>
    {children}
  </select>
));
UncontrolledSelect.displayName = "UncontrolledSelect";

export default function SelectField<
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  register,
  registerOptions,
  control,
  name,
  id,
  defaultValue,
  error = null,
  hidden = false,
  selectProps,
  options,
  icon = ChevronDown,
  placeholder,
  disabled = false,
  required = false,
  selectWrapperClassName,
  selectClassName,
}: SelectFieldProps<TFieldValues>) {
  const autoId = useId();
  const selectId = id || `${name}-${autoId}`;
  const errorId = `${selectId}-error`;

  const registerProps = register
    ? (register(name as any, registerOptions) as Record<string, unknown>)
    : {};

  const renderLabel = () =>
    label ? (
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
    ) : null;

  const renderIcon = () => {
    if (!icon) return null;
    const Icon = icon;
    return (
      <span aria-hidden="true" className={styles.icon}>
        <Icon size={18} />
      </span>
    );
  };

  const renderError = () =>
    error?.message ? (
      <p id={errorId} className={styles.error}>
        {String(error.message)}
      </p>
    ) : null;

  const selectClassNames = clsx(styles.element, selectClassName);

  return (
    <div
      className={clsx(styles.container, selectWrapperClassName, {
        [styles.hidden]: hidden,
      })}
    >
      {renderLabel()}

      <div
        className={clsx(styles.elementWrapper, {
          [styles.elementWrapperError]: !!error,
        })}
      >
        {renderIcon()}

        {control ? (
          <Controller
            name={name as any}
            control={control}
            // cast to any to satisfy the Controller generic constraint
            defaultValue={(defaultValue ?? "") as any}
            render={({ field }) => (
              <select
                id={selectId}
                {...field}
                className={selectClassNames}
                disabled={disabled}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...selectProps}
              >
                {placeholder && (
                  <option value="" disabled hidden>
                    {placeholder}
                  </option>
                )}
                {options.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          />
        ) : (
          <UncontrolledSelect
            id={selectId}
            defaultValue={defaultValue}
            className={selectClassNames}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...(registerProps as any)}
            {...selectProps}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </UncontrolledSelect>
        )}
      </div>

      {renderError()}
    </div>
  );
}
