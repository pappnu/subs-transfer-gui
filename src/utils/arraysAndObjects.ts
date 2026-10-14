export function removeItem<T>(array: T[], item: T): T[] {
  const index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
  }
  return array;
}
