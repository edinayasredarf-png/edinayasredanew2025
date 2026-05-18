-- Быстрая проверка прав gen_user в Adminer (база public).
-- Выполните целиком. Смотрите колонку ok.

SELECT current_database() AS database_name, current_user AS user_name;

SELECT
  has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_schema_in_db,
  has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_table_in_public;

-- Попытка выдать себе CREATE в public (может быть «permission denied» — это нормально)
GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;

SELECT has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_after_grant;
