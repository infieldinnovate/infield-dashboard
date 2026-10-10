// components/forms/form_elements/InputField.tsx

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
  /** Make RegisterOptions generic so it matches the form value type */
  registerOptions?: RegisterOptions<TFieldValues, any>;
  control?: Control<TFieldValues>;
  name: string;
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
  name,
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

  // registerProps typed with generic registerOptions
  const registerProps = register
    ? (register(name as any, registerOptions) as Record<string, unknown>)
    : {};

  const renderLabel = () =>
    label ? (
      <label htmlFor={inputId} className={styles.label}>
        {label}
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

  // Controlled branch (Controller)
  if (control) {
    // File special-case for controlled usage
    if (type === "file") {
      return (
        <div
          className={clsx(styles.container, inputWrapperClassName, {
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
            <Controller
              name={name as any}
              control={control}
              // defaultValue={defaultValue ?? null}
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

          {datalistOptions && type !== "file" && as !== "textarea" && (
            <datalist id={datalistId}>
              {datalistOptions.map((opt, i) => (
                <option key={i} value={opt} />
              ))}
            </datalist>
          )}
        </div>
      );
    }

    // Non-file controlled inputs
    return (
      <div
        className={clsx(styles.container, inputWrapperClassName, {
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
          <Controller
            name={name as any}
            control={control}
            // defaultValue={defaultValue ?? ""}
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

        {datalistOptions && as !== "textarea" && (
          <datalist id={datalistId}>
            {datalistOptions.map((opt, i) => (
              <option key={i} value={opt} />
            ))}
          </datalist>
        )}
      </div>
    );
  }

  // Fallback: uncontrolled (register) or native input
  if (as === "textarea") {
    return (
      <div
        className={clsx(styles.container, inputWrapperClassName, {
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
          <textarea
            id={inputId}
            // defaultValue={defaultValue ?? ""}
            rows={rows}
            {...commonProps}
            {...(registerProps as any)}
          />
        </div>

        {renderError()}
      </div>
    );
  }

  // input (including uncontrolled/register file)
  return (
    <div
      className={clsx(styles.container, inputWrapperClassName, {
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

        <input
          id={inputId}
          type={type}
          defaultValue={type === "file" ? undefined : defaultValue}
          list={datalistId}
          {...commonProps}
          {...(registerProps as any)}
        />
      </div>

      {renderError()}

      {datalistOptions && (
        <datalist id={datalistId}>
          {datalistOptions.map((opt, i) => (
            <option key={i} value={opt} />
          ))}
        </datalist>
      )}
    </div>
  );
}
