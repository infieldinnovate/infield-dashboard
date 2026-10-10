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
import clsx from "clsx";
import styles from "./formElement.module.scss";

type TextareaFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  label?: string;
  rows?: number;
  register?: UseFormRegister<TFieldValues>;
  registerOptions?: RegisterOptions<TFieldValues, any>;
  control?: Control<TFieldValues>;
  name?: string;
  id?: string;
  defaultValue?: any;
  error?: FieldError | null;
  hidden?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  textareaClassName?: string;
  wrapperClassName?: string;
  helperText?: string;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  className?: string;
};

export default function TextareaField<
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  rows = 3,
  register,
  registerOptions,
  control,
  name = "",
  id,
  defaultValue,
  error = null,
  hidden = false,
  placeholder,
  disabled = false,
  required = false,
  maxLength,
  minLength,
  textareaClassName,
  wrapperClassName,
  helperText,
  value,
  onChange,
  className,
}: TextareaFieldProps<TFieldValues>) {
  const autoId = useId();
  const textareaId = id || `${name}-${autoId}`;
  const errorId = `${textareaId}-error`;

  const registerProps = register
    ? (register(name as any, registerOptions) as Record<string, unknown>)
    : {};

  const controlledProps =
    onChange || value !== undefined
      ? { value: value ?? "", onChange }
      : {};

  const commonProps: React.TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id: textareaId,
    name,
    placeholder,
    required,
    disabled,
    maxLength,
    minLength,
    rows,
    className: clsx(styles.element, styles.textarea, textareaClassName),
    "aria-invalid": !!error,
    "aria-describedby": error ? errorId : undefined,
  };

  const wrapperClass = clsx(
    styles.container,
    wrapperClassName,
    className,
    { [styles.hidden]: hidden },
  );

  return (
    <div className={wrapperClass}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div
        className={clsx(styles.elementWrapper, {
          [styles.elementWrapperError]: !!error,
        })}
      >
        {control ? (
          <Controller
            name={name as any}
            control={control}
            render={({ field }) => (
              <textarea {...field} {...commonProps} />
            )}
          />
        ) : (
          <textarea
            defaultValue={defaultValue}
            {...commonProps}
            {...controlledProps}
            {...(registerProps as any)}
          />
        )}
      </div>
      {error?.message && (
        <p id={errorId} className={styles.error}>
          {String(error.message)}
        </p>
      )}
      {helperText && !error && (
        <span className={styles.helperText}>{helperText}</span>
      )}
    </div>
  );
}
