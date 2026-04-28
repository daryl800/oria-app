import { useEffect, useRef, useState } from 'react';
import type { StructuredLocation } from '../lib/locations';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

const NOMINATIM_LANG: Record<string, string> = {
  'zh-TW': 'zh-TW,zh;q=0.9,en;q=0.8',
  'zh-CN': 'zh-CN,zh;q=0.9,en;q=0.8',
  'ja':    'ja,en;q=0.8',
  'ko':    'ko,en;q=0.8',
  'sv':    'sv,en;q=0.8',
  'en':    'en',
};

type LocationAutocompleteProps = {
  value: string;
  selectedLocation: StructuredLocation | null;
  onInputChange: (value: string) => void;
  onSelect: (location: StructuredLocation) => void;
  label: string;
  placeholder: string;
  helperText: string;
  timezoneLabel: string;
  lang?: string;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
};

function getPlaceName(address: NominatimResult['address']): string {
  return address.city || address.town || address.village || address.county || address.state || '';
}

function getFlag(countryCode?: string): string {
  if (!countryCode) return '';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function LocationAutocomplete({
  value,
  selectedLocation,
  onInputChange,
  onSelect,
  label,
  placeholder,
  helperText,
  timezoneLabel,
  lang = 'en',
  inputStyle,
  labelStyle,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [tzLoading, setTzLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const query = value.trim();
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&featuretype=city`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': NOMINATIM_LANG[lang] ?? 'en', 'User-Agent': 'Oria-App/1.0' },
        });
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [value]);

  async function handleSelect(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const city = getPlaceName(result.address) || result.display_name.split(',')[0];
    const country = result.address.country || '';
    const flag = getFlag(result.address.country_code);

    setTzLoading(true);
    setOpen(false);
    onInputChange(`${city}${flag ? ' ' + flag : ''}, ${country}`);

    try {
      const tzRes = await fetch(`${API_URL}/api/public/timezone/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const tzData = await tzRes.json();
      const timezone = tzData.timezone || 'UTC';

      onSelect({
        city,
        country,
        display_name: result.display_name,
        lat,
        lng,
        timezone,
      });
    } catch {
      // Fallback: use UTC if timezone lookup fails
      onSelect({
        city,
        country,
        display_name: result.display_name,
        lat,
        lng,
        timezone: 'UTC',
      });
    } finally {
      setTzLoading(false);
    }
  }

  return (
    <div style={{ position: 'relative', marginBottom: 20 }}>
      <label className="oria-card-label" style={labelStyle}>{label}</label>
      <input
        className="oria-input"
        style={{ ...inputStyle, appearance: 'none' }}
        placeholder={placeholder}
        value={value}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onChange={e => {
          onInputChange(e.target.value);
          if (selectedLocation) onSelect(null as any); // clear selection on edit
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />

      {/* Helper text */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.5 }}>
        {loading ? '🔍 Searching...' : helperText}
      </div>

      {/* Timezone display — read only */}
      {tzLoading && (
        <div style={{
          marginTop: 8, padding: '9px 12px', borderRadius: 12,
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.12)',
          color: 'rgba(255,255,255,0.4)', fontSize: 12,
        }}>
          Detecting timezone...
        </div>
      )}
      {selectedLocation && !tzLoading && (
        <div style={{
          marginTop: 8, padding: '9px 12px', borderRadius: 12,
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.18)',
          color: 'rgba(255,255,255,0.62)', fontSize: 12, lineHeight: 1.5,
        }}>
          {timezoneLabel}: {selectedLocation.timezone} — detected from birth location
        </div>
      )}

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 20, left: 0, right: 0,
          top: 'calc(100% - 2px)', borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(216,180,254,0.22)',
          background: 'rgba(18, 7, 36, 0.98)',
          boxShadow: '0 18px 44px rgba(0,0,0,0.34)',
        }}>
          {suggestions.map(result => {
            const city = getPlaceName(result.address) || result.display_name.split(',')[0];
            const country = result.address.country || '';
            const flag = getFlag(result.address.country_code);
            return (
              <button
                key={result.place_id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(result)}
                style={{
                  width: '100%', border: 'none',
                  background: 'transparent', color: '#F0EDE8',
                  padding: '13px 16px',
                  display: 'flex', justifyContent: 'space-between',
                  gap: 12, alignItems: 'center',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 15, textAlign: 'left',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span>{city} {flag}</span>
                <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12 }}>{country}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
