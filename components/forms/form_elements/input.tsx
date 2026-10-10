"use client";

import React, { useId } from "react";
import {
  FieldError,
  FieldValues,
  UseFormRegister,
  RegisterOptions,
  Control,
  Controller,
} from "react-hook-form";
import { type LucideIcon } from "lucide-react";
import clsx from "clsx";
import styles from "./formElement.module.scss";

type InputFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  label?: string;
  type?: string;
  as?: "input" | "textarea";
  rows?: number;
  register?: UseFormRegister<TFieldValues>;
  registerOptions?: RegisterOptions<TFieldValues, any>;
  control?: Control<TFieldValues>;
  name?: string;
  id?: string;
  defaultValue?: any;
  error?: FieldError | null;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<
    HTMLInputElement | HTMLTextAreaElement
  >;
  icon?: LucideIcon;
  datalistOptions?: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  inputWrapperClassName?: string;
  inputClassName?: string;
  ariaLabel?: string;
  helperText?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  className?: string;
};

export default function InputField<
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  type = "text",
  as = "input",
  rows = 3,
  register,
  registerOptions,
  control,
  name = "",
  id,
  defaultValue,
  error = null,
  hidden = false,
  inputProps,
  icon,
  datalistOptions,
  placeholder,
  required = false,
  disabled = false,
  maxLength,
  minLength,
  inputWrapperClassName,
  inputClassName,
  ariaLabel,
  helperText,
  value,
  onChange,
  className,
}: InputFieldProps<TFieldValues>) {
  const autoId = useId();
  const inputId = id || `${name}-${autoId}`;
  const errorId = `${inputId}-error`;
  const datalistId = datalistOptions ? `${inputId}-datalist` : undefined;

  const Icon = icon;

  const commonProps: React.InputHTMLAttributes<
    HTMLInputElement | HTMLTextAreaElement
  > = {
    id: inputId,
    name,
    placeholder,
    required,
    disabled,
    maxLength,
    minLength,
    className: clsx(styles.element, inputClassName),
    "aria-invalid": !!error,
    "aria-describedby": error ? errorId : undefined,
    "aria-label": label ? undefined : ariaLabel,
    ...inputProps,
  };

  const registerProps = register
    ? (register(name as any, registerOptions) as Record<string, unknown>)
    : {};

  const controlledProps =
    onChange || value !== undefined
      ? { value: value ?? "", onChange }
      : {};

  const renderLabel = () =>
    label ? (
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
    ) : null;

  const renderIcon = () =>
    Icon ? (
      <span aria-hidden="true" className={styles.icon}>
        <Icon size={18} />
      </span>
    ) : null;

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

  const renderDatalist = () =>
    datalistOptions ? (
      <datalist id={datalistId}>
        {datalistOptions.map((opt, i) => (
          <option key={i} value={opt} />
        ))}
      </datalist>
    ) : null;

  const wrapperClass = clsx(
    styles.container,
    inputWrapperClassName,
    className,
    { [styles.hidden]: hidden },
  );

  // Controlled branch (Controller)
  if (control) {
    if (type === "file") {
      return (
        <div className={wrapperClass}>
          {renderLabel()}
          <div
            className={clsx(styles.elementWrapper, {
              [styles.elementWrapperError]: !!error,
            })}
          >
            {renderIcon()}
            <Controller
              name={name as any}
              control={control}
              render={({ field }) => (
                <input
                  id={inputId}
                  type="file"
                  onChange={(e) => field.onChange(e.target.files)}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  {...commonProps}
                />
              )}
            />
          </div>
          {renderError()}
          {renderDatalist()}
        </div>
      );
    }

    return (
      <div className={wrapperClass}>
        {renderLabel()}
        <div
          className={clsx(styles.elementWrapper, {
            [styles.elementWrapperError]: !!error,
          })}
        >
          {renderIcon()}
          <Controller
            name={name as any}
            control={control}
            render={({ field }) =>
              as === "textarea" ? (
                <textarea rows={rows} {...field} {...commonProps} />
              ) : (
                <input
                  type={type}
                  list={datalistId}
                  {...field}
                  {...commonProps}
                />
              )
            }
          />
        </div>
        {renderError()}
        {renderDatalist()}
      </div>
    );
  }

  // Uncontrolled (register) or controlled (value/onChange)
  if (as === "textarea") {
    return (
      <div className={wrapperClass}>
        {renderLabel()}
        <div
          className={clsx(styles.elementWrapper, {
            [styles.elementWrapperError]: !!error,
          })}
        >
          {renderIcon()}
          <textarea
            id={inputId}
            rows={rows}
            {...commonProps}
            {...controlledProps}
            {...(registerProps as any)}
          />
        </div>
        {renderError()}
        {renderHelperText()}
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {renderLabel()}
      <div
        className={clsx(styles.elementWrapper, {
          [styles.elementWrapperError]: !!error,
        })}
      >
        {renderIcon()}
        <input
          id={inputId}
          type={type}
          defaultValue={type === "file" ? undefined : defaultValue}
          list={datalistId}
          {...commonProps}
          {...controlledProps}
          {...(registerProps as any)}
        />
      </div>
      {renderError()}
      {renderHelperText()}
      {renderDatalist()}
    </div>
  );
}
