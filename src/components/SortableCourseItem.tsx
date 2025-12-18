import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode, cloneElement, isValidElement } from "react";
import { Button } from "./ui/button";

interface SortableCourseItemProps {
  id: string;
  children: ReactNode;
}

export function SortableCourseItem({ id, children }: SortableCourseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Pass drag handle button to child via context (if needed)
  const dragHandle = (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 hover:bg-transparent flex-shrink-0"
      {...attributes}
      {...listeners}
    >
      <GripVertical size={18} />
    </Button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {isValidElement(children)
        ? cloneElement(children, { dragHandle } as React.Attributes)
        : children}
    </div>
  );
}
