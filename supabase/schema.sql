-- Profiles (extension de auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  slogan text,
  elo integer not null default 1000,
  duels_played integer not null default 0,
  duels_won integer not null default 0,
  created_at timestamptz not null default now()
);

-- Programmes politiques
create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  unique(user_id) -- un seul programme par utilisateur
);

-- Les 6 points du programme
create table program_points (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs on delete cascade not null,
  "order" integer not null check ("order" between 1 and 6),
  category text not null,
  title text not null,
  description text not null,
  ai_context text,
  unique(program_id, "order")
);

-- Historique des duels
create table duels (
  id uuid primary key default gen_random_uuid(),
  program_1_id uuid references programs on delete cascade not null,
  program_2_id uuid references programs on delete cascade not null,
  voter_id uuid references profiles on delete cascade not null,
  winner_id uuid references programs on delete cascade not null,
  elo_change integer not null,
  created_at timestamptz not null default now(),
  -- Un votant ne peut pas voir le même duel deux fois
  unique(program_1_id, program_2_id, voter_id)
);

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table programs enable row level security;
alter table program_points enable row level security;
alter table duels enable row level security;

-- Policies : lecture publique, écriture sur ses propres données
create policy "Profiles visibles par tous" on profiles for select using (true);
create policy "Profil modifiable par son owner" on profiles for update using (auth.uid() = id);

create policy "Programmes visibles" on programs for select using (
  status = 'approved'
  or auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);
create policy "Programme créable par son owner" on programs for insert with check (auth.uid() = user_id);
create policy "Programme modifiable par son owner" on programs for update using (auth.uid() = user_id);
create policy "Programme supprimable par son owner" on programs for delete using (auth.uid() = user_id);
create policy "Admins peuvent modérer" on programs for update using (
  exists (select 1 from profiles where id = auth.uid() and is_admin = true)
);

create policy "Points visibles par tous" on program_points for select using (true);
create policy "Points modifiables par l'owner du programme" on program_points for insert
  with check (auth.uid() = (select user_id from programs where id = program_id));
create policy "Points updatables par l'owner du programme" on program_points for update
  using (auth.uid() = (select user_id from programs where id = program_id));
create policy "Points supprimables par l'owner du programme" on program_points for delete
  using (auth.uid() = (select user_id from programs where id = program_id));

create policy "Duels visibles par tous" on duels for select using (true);
create policy "Duel créable par le votant" on duels for insert with check (auth.uid() = voter_id);
