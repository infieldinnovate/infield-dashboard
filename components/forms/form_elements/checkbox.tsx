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

type CheckboxFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  label?: string;
  register?: UseFormRegister<TFieldValues>;
  registerOptions?: RegisterOptions<TFieldValues, any>;
  control?: Control<TFieldValues>;
  name?: string;
  id?: string;
  error?: FieldError | null;
  disabled?: boolean;
  required?: boolean;
  wrapperClassName?: string;
  className?: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

export default function CheckboxField<
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  register,
  registerOptions,
  control,
  name = "",
  id,
  error = null,
  disabled = false,
  required = false,
  wrapperClassName,
  className,
  checked,
  onChange,
}: CheckboxFieldProps<TFieldValues>) {
  const autoId = useId();
  const checkboxId = id || `${name}-${autoId}`;
  const errorId = `${checkboxId}-error`;

  const registerProps = register
    ? (register(name as any, registerOptions) as Record<string, unknown>)
    : {};

  const controlledProps =
    onChange || checked !== undefined ? { checked: checked ?? false, onChange } : {};

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    id: checkboxId,
    type: "checkbox",
    className: styles.checkboxInput,
    disabled,
    required,
    "aria-invalid": !!error,
    "aria-describedby": error ? errorId : undefined,
  };

  return (
    <div
      className={clsx(
        styles.checkboxWrapper,
        wrapperClassName,
        className,
      )}
    >
      {control ? (
        <Controller
          name={name as any}
          control={control}
          render={({ field }) => (
            <label className={styles.checkboxLabel}>
              <input {...field} {...inputProps} />
              <span className={styles.checkmark}>
                <svg
                  className={styles.checkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {label && <span className={styles.checkboxText}>{label}</span>}
            </label>
          )}
        />
      ) : (
        <label className={styles.checkboxLabel}>
          <input
            {...inputProps}
            {...controlledProps}
            {...(registerProps as any)}
          />
          <span className={styles.checkmark}>
            <svg
              className={styles.checkIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          {label && <span className={styles.checkboxText}>{label}</span>}
        </label>
      )}
      {error?.message && (
        <p id={errorId} className={styles.error}>
          {String(error.message)}
        </p>
      )}
    </div>
  );
}
