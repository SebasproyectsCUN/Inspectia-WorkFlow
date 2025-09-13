import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Paperclip, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
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

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export const TaskCard = ({ task, isDragging = false }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const isPastDue = task.end_date && new Date(task.end_date) < new Date() && task.status !== 'completed';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        (isDragging || sortableIsDragging) && 'opacity-50 shadow-lg scale-105',
        isPastDue && 'border-danger'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">
            {task.name}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.profiles && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs bg-muted">
                    {getUserInitials(task.profiles.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            {/* Show attachment icon if task has attachments */}
            <Paperclip className="h-3 w-3 text-muted-foreground" />
          </div>
          
          {(task.start_date || task.end_date) && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className={cn(
                "text-xs",
                isPastDue ? "text-danger font-medium" : "text-muted-foreground"
              )}>
                {task.end_date ? formatDate(task.end_date) : formatDate(task.start_date!)}
              </span>
            </div>
          )}
        </div>

        {isPastDue && (
          <Badge variant="destructive" className="text-xs">
            Vencida
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};