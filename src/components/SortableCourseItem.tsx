import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";

interface SortableCourseItemProps {
  id: string;
  children: ReactNode;
}

export function SortableCourseItem({ id, children }: SortableCourseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="flex items-center gap-2">
        <button
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
