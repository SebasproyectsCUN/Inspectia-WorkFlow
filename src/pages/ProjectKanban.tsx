import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, User, Paperclip, MoreHorizontal } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KanbanColumn } from '@/components/KanbanColumn';
import { TaskCard } from '@/components/TaskCard';
import inspectiaLogo from '@/assets/inspectia-logo.png';

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

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectMember {
  user_id: string;
  profiles: {
    full_name: string;
  };
}

const TASK_STATUSES = [
  { id: 'backlog', name: 'Backlog', color: 'kanban-backlog' },
  { id: 'in_progress', name: 'En Progreso', color: 'kanban-progress' },
  { id: 'stopped', name: 'Detenida', color: 'kanban-stopped' },
  { id: 'completed', name: 'Finalizada', color: 'kanban-completed' },
];

const ProjectKanban = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch project members - using inner join since relation might not work
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId);

      if (memberError) throw memberError;
      
      // Get profiles for members
      const memberIds = memberData?.map(m => m.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', memberIds);

      if (profilesError) throw profilesError;
      
      const membersWithProfiles = memberData?.map(member => ({
        user_id: member.user_id,
        profiles: {
          full_name: profilesData?.find(p => p.user_id === member.user_id)?.full_name || 'Usuario'
        }
      })) || [];
      
      setMembers(membersWithProfiles);

      // Fetch tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('position');

      if (taskError) throw taskError;
      
      // Get profiles for assigned users
      const assignedUserIds = taskData?.map(t => t.assigned_to).filter(Boolean) || [];
      const { data: taskProfilesData, error: taskProfilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', assignedUserIds);

      if (taskProfilesError) throw taskProfilesError;
      
      const tasksWithProfiles = taskData?.map(task => ({
        ...task,
        profiles: task.assigned_to ? {
          full_name: taskProfilesData?.find(p => p.user_id === task.assigned_to)?.full_name || 'Usuario'
        } : undefined
      })) || [];
      
      setTasks(tasksWithProfiles);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información del proyecto",
        variant: "destructive",
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async () => {
    if (!taskName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la tarea es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            project_id: projectId,
            name: taskName,
            description: taskDescription,
            assigned_to: taskAssignedTo || null,
            start_date: taskStartDate || null,
            end_date: taskEndDate || null,
            created_by: user?.id,
            position: tasks.length,
          }
        ])
        .select('*')
        .single();

      if (error) throw error;

      // Get profile for assigned user if exists
      let profileData = null;
      if (data.assigned_to) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', data.assigned_to)
          .single();
        profileData = profile;
      }

      const taskWithProfile = {
        ...data,
        profiles: profileData ? { full_name: profileData.full_name } : undefined
      };

      setTasks([...tasks, taskWithProfile]);
      setTaskName('');
      setTaskDescription('');
      setTaskAssignedTo('');
      setTaskStartDate('');
      setTaskEndDate('');
      setIsCreateTaskOpen(false);

      toast({
        title: "¡Éxito!",
        description: "Tarea creada correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la tarea",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(task => task.id === activeId);
    if (!activeTask) return;

    // Check if dropping on a column
    const newStatus = TASK_STATUSES.find(status => status.id === overId)?.id as 'backlog' | 'in_progress' | 'stopped' | 'completed' | undefined;
    if (newStatus && newStatus !== activeTask.status) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', activeId);

        if (error) throw error;

        setTasks(tasks.map(task => 
          task.id === activeId 
            ? { ...task, status: newStatus }
            : task
        ));

        toast({
          title: "Tarea actualizada",
          description: `La tarea se movió a ${TASK_STATUSES.find(s => s.id === newStatus)?.name}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar la tarea",
          variant: "destructive",
        });
      }
    }

    setActiveId(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </Button>
              <img src={inspectiaLogo} alt="Inspectia" className="h-8" />
              <div>
                <h1 className="text-xl font-bold text-foreground">{project?.name}</h1>
                {project?.description && (
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
              </div>
            </div>
            
            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nueva Tarea</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear nueva tarea</DialogTitle>
                  <DialogDescription>
                    Completa la información de la nueva tarea
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-name">Nombre de la tarea</Label>
                    <Input
                      id="task-name"
                      placeholder="Desarrollar funcionalidad X"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-description">Descripción</Label>
                    <Textarea
                      id="task-description"
                      placeholder="Describe los detalles de la tarea..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assigned-to">Asignar a</Label>
                      <Select value={taskAssignedTo} onValueChange={setTaskAssignedTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {members.map((member) => (
                            <SelectItem key={member.user_id} value={member.user_id}>
                              {member.profiles.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Fecha de inicio</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={taskStartDate}
                        onChange={(e) => setTaskStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Fecha de finalización</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={taskEndDate}
                      onChange={(e) => setTaskEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createTask}>Crear Tarea</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TASK_STATUSES.map((status) => (
              <KanbanColumn
                key={status.id}
                id={status.id}
                title={status.name}
                color={status.color}
                tasks={getTasksByStatus(status.id)}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeId ? (
              <TaskCard
                task={tasks.find(task => task.id === activeId)!}
                isDragging
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  );
};

export default ProjectKanban;