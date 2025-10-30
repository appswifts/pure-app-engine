-- Add unique constraint on user_id to fix the ON CONFLICT issue in handle_new_user() function
ALTER TABLE public.restaurants 
ADD CONSTRAINT restaurants_user_id_unique UNIQUE (user_id);