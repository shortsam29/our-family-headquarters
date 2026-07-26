-- City-level household weather preferences. No precise address or provider credential is stored.
alter table public.households
  add column if not exists weather_city text,
  add column if not exists weather_region text,
  add column if not exists weather_postal_code text,
  add column if not exists weather_country text,
  add column if not exists weather_display_name text,
  add column if not exists weather_latitude double precision,
  add column if not exists weather_longitude double precision,
  add column if not exists weather_time_zone text,
  add column if not exists weather_temperature_unit text not null default 'fahrenheit';

alter table public.households
  add constraint households_weather_latitude_check check (weather_latitude is null or weather_latitude between -90 and 90),
  add constraint households_weather_longitude_check check (weather_longitude is null or weather_longitude between -180 and 180),
  add constraint households_weather_temperature_unit_check check (weather_temperature_unit in ('fahrenheit', 'celsius')),
  add constraint households_weather_location_complete_check check (
    (weather_latitude is null and weather_longitude is null and weather_display_name is null and weather_time_zone is null)
    or
    (weather_latitude is not null and weather_longitude is not null and weather_display_name is not null and weather_time_zone is not null)
  );