-- Add admin policy for managing user roles
CREATE POLICY "Admins can manage user roles"
ON user_roles FOR ALL
USING (is_admin(auth.uid()));