import { useState, type Dispatch, type SetStateAction } from "react";
import { readData, saveData, type Json } from "../utils/storage";
import { useDebounce } from "./useDebounce";

export function usePersistedState<T extends Json>(
  key: string,
  initialState: T | (() => T),
  wait: number = 1000,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState(() =>
    readData<T>(
      key,
      typeof initialState === "function" ? initialState() : initialState,
    ),
  );

  const { debounce } = useDebounce(saveData<T>, wait);

  const setAndPersist = (value: SetStateAction<T>) => {
    setState((prevValue) => {
      let newValue: T;
      if (typeof value === "function") {
        newValue = value(prevValue);
      } else {
        newValue = value;
      }
      debounce(key, newValue);
      return newValue;
    });
  };

  return [state, setAndPersist];
}
