import { LabeledInput } from "./LabeledInput";

export interface CheckboxProps {
  label: string;
  value: boolean;
  setValue?: (value: boolean) => unknown;
}

export function Checkbox({ label, value, setValue }: CheckboxProps) {
  return (
    <LabeledInput
      label={label}
      inputProps={{
        type: "checkbox",
        checked: value,
        onChange: (e) => setValue?.(e.target.checked),
      }}
    />
  );
}
