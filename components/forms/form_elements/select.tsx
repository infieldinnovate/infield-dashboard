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
  register?: UseFormRegister<TFieldValues>;
  registerOptions?: RegisterOptions<TFieldValues, any>;
  control?: Control<TFieldValues>;
  name?: string;
  id?: string;
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
  helperText?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  className?: string;
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
  name = "",
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
  helperText,
  value,
  onChange,
  className,
}: SelectFieldProps<TFieldValues>) {
  const autoId = useId();
  const selectId = id || `${name}-${autoId}`;
  const errorId = `${selectId}-error`;

  const registerProps = register
    ? (register(name as any, registerOptions) as Record<string, unknown>)
    : {};

  const controlledProps =
    onChange || value !== undefined
      ? { value: value ?? "", onChange }
      : {};

  const renderLabel = () =>
    label ? (
      <label htmlFor={selectId} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
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

  const renderHelperText = () =>
    helperText && !error ? (
      <span className={styles.helperText}>{helperText}</span>
    ) : null;

  const selectClassNames = clsx(styles.element, selectClassName);
  const wrapperClass = clsx(
    styles.container,
    selectWrapperClassName,
    className,
    { [styles.hidden]: hidden },
  );

  const renderOptions = () => (
    <>
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
    </>
  );

  return (
    <div className={wrapperClass}>
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
                {renderOptions()}
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
            {...controlledProps}
            {...(registerProps as any)}
            {...selectProps}
          >
            {renderOptions()}
          </UncontrolledSelect>
        )}
      </div>
      {renderError()}
      {renderHelperText()}
    </div>
  );
}
