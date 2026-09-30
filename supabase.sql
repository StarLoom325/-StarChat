
-- =========================================================
-- LOOMCHAT V2 DATABASE
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- PROFILES
-- =========================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique,
    display_name text not null default 'کاربر',
    avatar_url text,
    created_at timestamptz not null default now()
);


-- =========================================================
-- PRIVATE CONVERSATIONS
-- =========================================================

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),

    user_a uuid not null
        references public.profiles(id) on delete cascade,

    user_b uuid not null
        references public.profiles(id) on delete cascade,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint different_users
        check (user_a <> user_b),

    constraint sorted_users
        check (user_a < user_b),

    unique(user_a, user_b)
);


-- =========================================================
-- MESSAGES
-- =========================================================

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),

    conversation_id uuid not null
        references public.conversations(id)
        on delete cascade,

    sender_id uuid not null
        references public.profiles(id)
        on delete cascade,

    body text default '',

    message_type text not null default 'text',

    file_url text,

    created_at timestamptz not null default now(),

    constraint valid_message_type
        check (
            message_type in (
                'text',
                'image'
            )
        )
);


-- =========================================================
-- GROUPS
-- =========================================================

create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    description text default '',

    avatar_url text,

    owner_id uuid not null
        references public.profiles(id)
        on delete cascade,

    created_at timestamptz not null default now()
);


-- =========================================================
-- GROUP MEMBERS
-- =========================================================

create table if not exists public.group_members (
    id uuid primary key default gen_random_uuid(),

    group_id uuid not null
        references public.groups(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role text not null default 'member',

    created_at timestamptz not null default now(),

    unique(group_id, user_id)
);


-- =========================================================
-- CHANNELS
-- =========================================================

create table if not exists public.channels (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    description text default '',

    avatar_url text,

    owner_id uuid not null
        references public.profiles(id)
        on delete cascade,

    created_at timestamptz not null default now()
);


-- =========================================================
-- CHANNEL MEMBERS
-- =========================================================

create table if not exists public.channel_members (
    id uuid primary key default gen_random_uuid(),

    channel_id uuid not null
        references public.channels(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role text not null default 'member',

    created_at timestamptz not null default now(),

    unique(channel_id, user_id)
);


-- =========================================================
-- INDEXES
-- =========================================================

create index if not exists
messages_conversation_created
on public.messages(conversation_id, created_at);

create index if not exists
conversation_user_a
on public.conversations(user_a);

create index if not exists
conversation_user_b
on public.conversations(user_b);

create index if not exists
profiles_username
on public.profiles(username);

create index if not exists
group_members_group
on public.group_members(group_id);

create index if not exists
channel_members_channel
on public.channel_members(channel_id);


-- =========================================================
-- NEW USER PROFILE
-- =========================================================

create or replace function
public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles(
        id,
        display_name
    )

    values(
        new.id,
        coalesce(
            new.raw_user_meta_data->>'display_name',
            'کاربر'
        )
    )

    on conflict(id)
    do nothing;

    return new;

end;
$$;


drop trigger if exists
on_auth_user_created
on auth.users;


create trigger
on_auth_user_created

after insert
on auth.users

for each row

execute procedure
public.handle_new_user();


-- =========================================================
-- CREATE PRIVATE CONVERSATION
-- =========================================================

create or replace function
public.create_or_get_conversation(
    other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$

declare

    a uuid;
    b uuid;
    cid uuid;

begin

    if auth.uid() is null then
        raise exception 'Not authenticated';
    end if;

    if other_user_id = auth.uid() then
        raise exception 'Cannot chat with yourself';
    end if;

    if auth.uid() < other_user_id then

        a := auth.uid();
        b := other_user_id;

    else

        a := other_user_id;
        b := auth.uid();

    end if;

    insert into public.conversations(
        user_a,
        user_b
    )

    values(
        a,
        b
    )

    on conflict(user_a, user_b)

    do update set
        updated_at = now()

    returning id
    into cid;

    return cid;

end;

$$;


-- =========================================================
-- RLS
-- =========================================================

alter table public.profiles
enable row level security;

alter table public.conversations
enable row level security;

alter table public.messages
enable row level security;

alter table public.groups
enable row level security;

alter table public.group_members
enable row level security;

alter table public.channels
enable row level security;

alter table public.channel_members
enable row level security;


-- =========================================================
-- PROFILES
-- =========================================================

create policy
profiles_read_authenticated

on public.profiles

for select

to authenticated

using(true);


create policy
profiles_update_own

on public.profiles

for update

to authenticated

using(id = auth.uid())

with check(id = auth.uid());


-- =========================================================
-- CONVERSATIONS
-- =========================================================

create policy
conversation_members_read

on public.conversations

for select

to authenticated

using(
    user_a = auth.uid()
    or
    user_b = auth.uid()
);


-- =========================================================
-- MESSAGES READ
-- =========================================================

create policy
messages_read_members

on public.messages

for select

to authenticated

using(

    exists(

        select 1

        from public.conversations c

        where c.id = messages.conversation_id

        and (
            c.user_a = auth.uid()
            or
            c.user_b = auth.uid()
        )

    )

);


-- =========================================================
-- MESSAGES INSERT
-- =========================================================

create policy
messages_insert_members

on public.messages

for insert

to authenticated

with check(

    sender_id = auth.uid()

    and

    exists(

        select 1

        from public.conversations c

        where c.id = messages.conversation_id

        and (
            c.user_a = auth.uid()
            or
            c.user_b = auth.uid()
        )

    )

);


-- =========================================================
-- GROUPS
-- =========================================================

create policy
groups_read_authenticated

on public.groups

for select

to authenticated

using(true);


create policy
groups_create_own

on public.groups

for insert

to authenticated

with check(
    owner_id = auth.uid()
);


-- =========================================================
-- GROUP MEMBERS
-- =========================================================

create policy
group_members_read

on public.group_members

for select

to authenticated

using(true);


create policy
group_members_insert

on public.group_members

for insert

to authenticated

with check(
    user_id = auth.uid()
);


-- =========================================================
-- CHANNELS
-- =========================================================

create policy
channels_read_authenticated

on public.channels

for select

to authenticated

using(true);


create policy
channels_create_own

on public.channels

for insert

to authenticated

with check(
    owner_id = auth.uid()
);


-- =========================================================
-- CHANNEL MEMBERS
-- =========================================================

create policy
channel_members_read

on public.channel_members

for select

to authenticated

using(true);


create policy
channel_members_insert

on public.channel_members

for insert

to authenticated

with check(
    user_id = auth.uid()
);


-- =========================================================
-- REALTIME
-- =========================================================

alter table public.messages
replica identity full;


-- =========================================================
-- UPDATE CONVERSATION
-- =========================================================

create or replace function
public.touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$

begin

    update public.conversations

    set updated_at = now()

    where id = new.conversation_id;

    return new;

end;

$$;


drop trigger if exists
touch_conversation_message
on public.messages;


create trigger
touch_conversation_message

after insert

on public.messages

for each row

execute procedure
public.touch_conversation();
