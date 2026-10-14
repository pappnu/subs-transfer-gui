import { useId, type Dispatch, type SetStateAction } from "react";

export interface MultiTextInputProps {
  label: string;
  values: string[];
  setValues: Dispatch<SetStateAction<string[]>>;
}

export function MultiTextInput({
  label,
  values,
  setValues,
}: MultiTextInputProps) {
  const uid = useId();

  const valueInputs = values.map((value, idx) => (
    <div key={idx}>
      <input
        type="text"
        value={value}
        onChange={(e) =>
          setValues((prevState) => {
            const newState = [...prevState];
            newState[idx] = e.target.value;
            return newState;
          })
        }
      />
      <button
        onClick={() =>
          setValues((prevState) => {
            const newState = [...prevState];
            newState.splice(idx, 1);
            return newState;
          })
        }
      >
        x
      </button>
    </div>
  ));

  return (
    <div>
      <label htmlFor={uid}>{label}</label>
      <button
        id={uid}
        onClick={() =>
          setValues((prevState) => {
            return [...prevState, ""];
          })
        }
      >
        +
      </button>
      {valueInputs}
    </div>
  );
}
