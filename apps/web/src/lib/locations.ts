export type StructuredLocation = {
  city: string;
  country: string;
  display_name: string;
  lat: number;
  lng: number;
  timezone: string;
};

export function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
