-- Fix infinite recursion in project_members RLS policies
-- Create security definer functions to avoid recursive RLS issues

-- Function to check if user is project creator
CREATE OR REPLACE FUNCTION public.is_project_creator(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = _project_id AND created_by = _user_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if user is project admin
CREATE OR REPLACE FUNCTION public.is_project_admin(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = _project_id AND user_id = _user_id AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Function to check if user is project member
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = _project_id AND user_id = _user_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing policies
DROP POLICY IF EXISTS "Project creators and admins can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can view project members for their projects" ON public.project_members;

-- Create new policies using security definer functions
CREATE POLICY "Project creators and admins can manage members" 
ON public.project_members 
FOR ALL 
USING (
  public.is_project_creator(project_id, auth.uid()) OR 
  public.is_project_admin(project_id, auth.uid())
);

CREATE POLICY "Users can view project members for their projects" 
ON public.project_members 
FOR SELECT 
USING (public.is_project_member(project_id, auth.uid()));