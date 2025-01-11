-- Create users table (handled by Supabase Auth)
-- Reference it using auth.users

-- Create lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX lists_user_id_idx ON lists(user_id);
CREATE INDEX lists_date_idx ON lists(date);
CREATE INDEX tasks_list_id_idx ON tasks(list_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can view their own lists"
  ON lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lists"
  ON lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON lists FOR DELETE
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view tasks in their lists"
  ON tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM lists
    WHERE lists.id = tasks.list_id
    AND lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert tasks in their lists"
  ON tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM lists
    WHERE lists.id = list_id
    AND lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in their lists"
  ON tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM lists
    WHERE lists.id = tasks.list_id
    AND lists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks in their lists"
  ON tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM lists
    WHERE lists.id = tasks.list_id
    AND lists.user_id = auth.uid()
  )); 