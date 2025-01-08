-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user if not exists
DO $$
DECLARE
    admin_id uuid := gen_random_uuid();
BEGIN
    -- Create user if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'paularacy@gmail.com') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            aud,
            role
        )
        VALUES (
            admin_id,                                    -- id
            '00000000-0000-0000-0000-000000000000',    -- instance_id
            'paularacy@gmail.com',                      -- email
            crypt('adm@123', gen_salt('bf')),          -- encrypted_password
            now(),                                      -- email_confirmed_at
            '{"provider":"email","providers":["email"]}', -- raw_app_meta_data
            '{"name":"Admin User"}',                    -- raw_user_meta_data
            now(),                                      -- created_at
            now(),                                      -- updated_at
            'authenticated',                            -- aud
            'authenticated'                             -- role
        );

        -- Create identity
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            admin_id,
            json_build_object(
                'sub', admin_id::text,
                'email', 'paularacy@gmail.com'
            )::jsonb,
            'email',
            now(),
            now(),
            now()
        );

        -- Create profile
        INSERT INTO public.profiles (id, email, role)
        VALUES (admin_id, 'paularacy@gmail.com', 'admin');
    END IF;
END
$$;
