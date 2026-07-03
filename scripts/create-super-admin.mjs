import { createClient } from "@supabase/supabase-js";

function readArgs() {
  const args = process.argv.slice(2);
  const values = new Map();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    values.set(arg.slice(2), args[index + 1]);
    index += 1;
  }

  return {
    email: values.get("email") ?? process.env.SUPER_ADMIN_EMAIL,
    password: values.get("password") ?? process.env.SUPER_ADMIN_PASSWORD
  };
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const { email, password } = readArgs();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY en el entorno.");
  process.exit(1);
}

if (!email || !password) {
  console.error("Uso: npm run seed:super-admin -- --email correo@dominio.com --password \"contrasena-segura\"");
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contrasena debe tener al menos 8 caracteres.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: {
    role: "super_admin"
  }
});

if (!createError) {
  console.log(`Super admin creado: ${created.user.email}`);
  process.exit(0);
}

if (!createError.message.toLowerCase().includes("already")) {
  console.error(createError.message);
  process.exit(1);
}

const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

if (listError) {
  console.error(listError.message);
  process.exit(1);
}

const existingUser = users.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

if (!existingUser) {
  console.error("El usuario ya existe, pero no se pudo encontrar para actualizarlo.");
  process.exit(1);
}

const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
  password,
  email_confirm: true,
  app_metadata: {
    ...existingUser.app_metadata,
    role: "super_admin"
  }
});

if (updateError) {
  console.error(updateError.message);
  process.exit(1);
}

console.log(`Super admin actualizado: ${updated.user.email}`);
