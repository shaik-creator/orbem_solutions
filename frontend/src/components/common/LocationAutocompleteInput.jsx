import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { classNames } from '../../utils/formatters';

const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 400;
const LOCAL_LOCATIONS = [
  ['BOM', 'Mumbai', 'Chhatrapati Shivaji Maharaj International Airport, Maharashtra, India'],
  ['DEL', 'Delhi NCR', 'Indira Gandhi International Airport, Delhi, India'],
  ['BLR', 'Bengaluru', 'Kempegowda International Airport, Karnataka, India'],
  ['HYD', 'Hyderabad', 'Rajiv Gandhi International Airport, Telangana, India'],
  ['MAA', 'Chennai', 'Chennai International Airport, Tamil Nadu, India'],
  ['CCU', 'Kolkata', 'Netaji Subhas Chandra Bose International Airport, West Bengal, India'],
  ['AMD', 'Ahmedabad', 'Sardar Vallabhbhai Patel International Airport, Gujarat, India'],
  ['COK', 'Kochi', 'Cochin International Airport, Kerala, India'],
  ['PNQ', 'Pune', 'Pune Airport, Maharashtra, India'],
  ['JAI', 'Jaipur', 'Jaipur International Airport, Rajasthan, India'],
  ['GOI', 'Goa', 'Dabolim Airport, Goa, India'],
  ['TRV', 'Thiruvananthapuram', 'Trivandrum International Airport, Kerala, India'],
  ['IXC', 'Chandigarh', 'Chandigarh International Airport, India'],
  ['LKO', 'Lucknow', 'Chaudhary Charan Singh International Airport, Uttar Pradesh, India'],
  ['DXB', 'Dubai', 'Dubai International Airport, United Arab Emirates'],
  ['DOH', 'Doha', 'Hamad International Airport, Qatar'],
  ['SIN', 'Singapore', 'Changi Airport, Singapore'],
  ['HKG', 'Hong Kong', 'Hong Kong International Airport'],
  ['LHR', 'London', 'Heathrow Airport, United Kingdom'],
  ['FRA', 'Frankfurt', 'Frankfurt Airport, Germany'],
  ['AMS', 'Amsterdam', 'Amsterdam Schiphol Airport, Netherlands'],
  ['BKK', 'Bangkok', 'Suvarnabhumi Airport, Thailand'],
  ['JED', 'Jeddah', 'King Abdulaziz International Airport, Saudi Arabia'],
  ['KUL', 'Kuala Lumpur', 'Kuala Lumpur International Airport, Malaysia']
].map(([code, name, address]) => ({
  id: code,
  name,
  address,
  fullAddress: `${code} - ${name}, ${address}`,
  lat: null,
  lon: null,
  type: 'airport',
  class: 'logistics-node',
  addressDetails: {},
  code
}));

function searchLocalLocations(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return LOCAL_LOCATIONS
    .map((location) => {
      const haystack = `${location.code} ${location.name} ${location.address} ${location.fullAddress}`.toLowerCase();
      const startsWithCode = location.code.toLowerCase().startsWith(normalized);
      const startsWithName = location.name.toLowerCase().startsWith(normalized);
      const contains = haystack.includes(normalized);
      return {
        location,
        score: startsWithCode ? 0 : startsWithName ? 1 : contains ? 2 : 99
      };
    })
    .filter((entry) => entry.score < 99)
    .sort((a, b) => a.score - b.score || a.location.name.localeCompare(b.location.name))
    .slice(0, 6)
    .map((entry) => entry.location);
}

export default function LocationAutocompleteInput({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  disabled = false,
  selectionValue = 'fullAddress',
  error: fieldError,
  inputClassName = '',
  maxLength,
  required = false
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const wrapperRef = useRef(null);
  const requestIdRef = useRef(0);
  const selectedValueRef = useRef('');

  useEffect(() => {
    setInputValue(value || '');
    if (!value) {
      selectedValueRef.current = '';
      setPredictions([]);
      setActiveIndex(-1);
      setShowDropdown(false);
      setLookupError('');
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmedValue = inputValue.trim();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (disabled || trimmedValue.length < MIN_SEARCH_LENGTH || trimmedValue === selectedValueRef.current) {
      setPredictions([]);
      setActiveIndex(-1);
      setLoading(false);
      setLookupError('');
      return undefined;
    }

    setLookupError('');
    setLoading(true);
    setShowDropdown(true);

    const timer = window.setTimeout(() => {
      setLoading(false);
      if (requestId !== requestIdRef.current) return;

      const results = searchLocalLocations(trimmedValue);
      setPredictions(results);
      setActiveIndex(results.length ? 0 : -1);
      setShowDropdown(true);
      setLookupError(results.length ? '' : 'No saved ORBEM locations found');
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [disabled, inputValue]);

  function updateInput(nextValue) {
    selectedValueRef.current = '';
    setInputValue(nextValue);
    setShowDropdown(nextValue.trim().length >= MIN_SEARCH_LENGTH);
    onChange?.(nextValue);
  }

  function selectLocation(location) {
    if (!location) return;
    const nextValue = selectionValue === 'code' ? location.code : location.fullAddress;
    selectedValueRef.current = nextValue;
    setInputValue(nextValue);
    setPredictions([]);
    setActiveIndex(-1);
    setShowDropdown(false);
    setLookupError('');
    onChange?.(nextValue);
    onSelect?.(location);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setShowDropdown(false);
      return;
    }

    if (!showDropdown && ['ArrowDown', 'ArrowUp'].includes(event.key) && predictions.length) {
      setShowDropdown(true);
      return;
    }

    if (event.key === 'ArrowDown') {
      if (!predictions.length) return;
      event.preventDefault();
      setActiveIndex((current) => (current >= predictions.length - 1 ? 0 : current + 1));
    } else if (event.key === 'ArrowUp') {
      if (!predictions.length) return;
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? predictions.length - 1 : current - 1));
    } else if (event.key === 'Enter' && showDropdown && predictions[activeIndex]) {
      event.preventDefault();
      selectLocation(predictions[activeIndex]);
    }
  }

  const shouldShowDropdown = showDropdown && !disabled && (loading || lookupError || predictions.length > 0);

  return (
    <div ref={wrapperRef} className="relative block text-sm">
      {label ? <label className="mb-1 block font-semibold text-[#344054]">{label}</label> : null}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
        <input
          className={classNames(
            'h-11 w-full rounded-lg border bg-white py-2 pl-9 pr-10 text-sm text-[#172033] shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]',
            fieldError ? 'border-red-400' : 'border-[#dbe3ea]',
            inputClassName
          )}
          value={inputValue}
          onChange={(event) => updateInput(event.target.value)}
          onFocus={() => {
            if (inputValue.trim().length >= MIN_SEARCH_LENGTH) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
        />
        {loading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#64748b]" /> : null}
      </div>

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-[#dbe3ea] bg-white py-2 shadow-[0_18px_45px_rgba(15,31,61,0.18)]">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#64748b]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching locations...
            </div>
          ) : predictions.length ? (
            predictions.map((location, index) => (
              <button
                key={location.id || location.fullAddress}
                type="button"
                className={classNames(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition',
                  index === activeIndex ? 'bg-[#e6f1fb]' : 'hover:bg-[#f8fafc]'
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectLocation(location)}
              >
                <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-xl border border-[#bfdbfe] bg-[#e6f1fb] text-[11px] font-bold text-[#185fa5]">
                  [{location.code}]
                </span>
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]">
                  <MapPin className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#172033]">{location.name}</span>
                  {location.address ? <span className="mt-0.5 block truncate text-xs text-[#64748b]">{location.address}</span> : null}
                </span>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm font-medium text-[#64748b]">{lookupError || 'No locations found'}</div>
          )}
        </div>
      ) : null}
      {fieldError ? <span className="mt-1 block text-xs text-red-600">{fieldError}</span> : null}
    </div>
  );
}
