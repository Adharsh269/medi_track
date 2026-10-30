import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    },
);

const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "user@example.com",
    password: "Use-a-secure-password-here",
    email_confirm: false,
    user_metadata: {
        full_name: "Test User",
    },
});

if (error) {
    console.error(error.message);
} else {
        console.log("Supabase user ID:", data.user.id);
}
