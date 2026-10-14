import {
  useId,
  type DetailedHTMLProps,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
} from "react";

export interface LabeledInputProps {
  label: string;
  labelProps?: Partial<
    DetailedHTMLProps<LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>
  >;
  inputProps: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
}

export function LabeledInput({
  label,
  labelProps,
  inputProps,
}: LabeledInputProps) {
  const uid = useId();

  return (
    <div>
      <label {...labelProps} htmlFor={uid}>
        {label}
      </label>
      <input {...inputProps} id={uid} />
    </div>
  );
}
