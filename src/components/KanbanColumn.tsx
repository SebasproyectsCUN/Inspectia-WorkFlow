import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'stopped' | 'completed';
  assigned_to: string | null;
  start_date: string | null;
  end_date: string | null;
  position: number;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export const KanbanColumn = ({ id, title, color, tasks }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const getColumnClasses = () => {
    switch (id) {
      case 'backlog':
        return 'kanban-column-backlog';
      case 'in_progress':
        return 'kanban-column-progress';
      case 'stopped':
        return 'kanban-column-stopped';
      case 'completed':
        return 'kanban-column-completed';
      default:
        return '';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'min-h-[600px] transition-colors',
        getColumnClasses(),
        isOver && 'ring-2 ring-primary'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay tareas en esta columna</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};