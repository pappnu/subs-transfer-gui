import type { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type ButtonHTMLAttributes,
  type DetailedHTMLProps,
  type LiHTMLAttributes,
  type PropsWithChildren,
} from "react";

export interface DraggableFileListItemProps extends PropsWithChildren {
  sortableId: UniqueIdentifier;
  liProps?: Partial<
    DetailedHTMLProps<LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>
  >;
  buttonProps?: Partial<
    DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >
  >;
}

export function DraggableFileListItem({
  sortableId,
  children,
  liProps,
  buttonProps,
}: DraggableFileListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      {...liProps}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
      <button {...buttonProps}>x</button>
    </li>
  );
}
