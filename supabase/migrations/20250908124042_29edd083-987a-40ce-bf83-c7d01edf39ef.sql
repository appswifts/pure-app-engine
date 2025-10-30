-- Update the grub-cafe restaurant to be owned by the correct user
UPDATE restaurants 
SET user_id = 'a2446161-5c3d-4aa4-a36e-2a4928bdea37'
WHERE slug = 'grub-cafe' AND email = 'grubcaferw@gmail.com';