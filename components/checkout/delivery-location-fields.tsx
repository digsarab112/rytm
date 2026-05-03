"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { DeliveryMethod } from "@/types/cart";

type DeliveryCitySuggestion = {
  ref: string;
  deliveryCityRef?: string;
  label: string;
  city: string;
  region?: string;
  area?: string;
};

type DeliveryWarehouseSuggestion = {
  ref: string;
  label: string;
  number?: string;
  address?: string;
};

type DeliveryLocationFieldsProps = {
  deliveryMethod: DeliveryMethod;
  dictionary: Dictionary;
  defaultCity: string;
  defaultWarehouse: string;
};

export function DeliveryLocationFields({
  deliveryMethod,
  dictionary,
  defaultCity,
  defaultWarehouse,
}: DeliveryLocationFieldsProps) {
  const [city, setCity] = useState(defaultCity);
  const [cityRef, setCityRef] = useState("");
  const [warehouse, setWarehouse] = useState(defaultWarehouse);
  const [citySuggestions, setCitySuggestions] = useState<DeliveryCitySuggestion[]>([]);
  const [warehouseSuggestions, setWarehouseSuggestions] = useState<
    DeliveryWarehouseSuggestion[]
  >([]);
  const [isCityFocused, setIsCityFocused] = useState(false);
  const [isWarehouseFocused, setIsWarehouseFocused] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCity(defaultCity);
      setWarehouse(defaultWarehouse);
      setCityRef("");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [defaultCity, defaultWarehouse, deliveryMethod]);

  useEffect(() => {
    const query = city.trim();

    if (query.length < 2) {
      const timer = window.setTimeout(() => setCitySuggestions([]), 0);

      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(
        `/api/delivery/cities?provider=${deliveryMethod}&q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      )
        .then((response) => response.json())
        .then((data: { items?: DeliveryCitySuggestion[] }) => {
          setCitySuggestions(Array.isArray(data.items) ? data.items : []);
        })
        .catch(() => setCitySuggestions([]));
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, deliveryMethod]);

  useEffect(() => {
    if (!cityRef) {
      const timer = window.setTimeout(() => setWarehouseSuggestions([]), 0);

      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(
        `/api/delivery/warehouses?provider=${deliveryMethod}&cityRef=${encodeURIComponent(
          cityRef,
        )}&q=${encodeURIComponent(warehouse.trim())}`,
        { signal: controller.signal },
      )
        .then((response) => response.json())
        .then((data: { items?: DeliveryWarehouseSuggestion[] }) => {
          setWarehouseSuggestions(Array.isArray(data.items) ? data.items : []);
        })
        .catch(() => setWarehouseSuggestions([]));
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cityRef, deliveryMethod, warehouse]);

  const cityPlaceholder = useMemo(
    () =>
      deliveryMethod === "ukrposhta"
        ? dictionary.checkout.city
        : dictionary.checkout.city,
    [deliveryMethod, dictionary.checkout.city],
  );

  function chooseCity(suggestion: DeliveryCitySuggestion) {
    setCity(suggestion.label);
    setCityRef(suggestion.deliveryCityRef ?? suggestion.ref);
    setWarehouse("");
    setCitySuggestions([]);
  }

  function chooseWarehouse(suggestion: DeliveryWarehouseSuggestion) {
    setWarehouse(suggestion.label);
    setWarehouseSuggestions([]);
  }

  return (
    <>
      <SuggestionField
        label={dictionary.checkout.city}
        name="city"
        value={city}
        placeholder={cityPlaceholder}
        suggestions={citySuggestions}
        isOpen={isCityFocused && citySuggestions.length > 0}
        onFocus={() => setIsCityFocused(true)}
        onBlur={() => window.setTimeout(() => setIsCityFocused(false), 120)}
        onChange={(value) => {
          setCity(value);
          setCityRef("");
        }}
        onSelect={chooseCity}
        getLabel={(item) => item.label}
        getDescription={(item) => [item.region, item.area].filter(Boolean).join(", ")}
      />
      <input type="hidden" name="cityRef" value={cityRef} />
      <SuggestionField
        label={dictionary.checkout.novaPoshtaBranch}
        name="novaPoshtaBranch"
        value={warehouse}
        disabled={!city.trim()}
        suggestions={warehouseSuggestions}
        isOpen={isWarehouseFocused && warehouseSuggestions.length > 0}
        onFocus={() => setIsWarehouseFocused(true)}
        onBlur={() => window.setTimeout(() => setIsWarehouseFocused(false), 120)}
        onChange={setWarehouse}
        onSelect={chooseWarehouse}
        getLabel={(item) => item.label}
        getDescription={(item) => item.address ?? item.number ?? ""}
      />
    </>
  );
}

function SuggestionField<T>({
  label,
  name,
  value,
  placeholder,
  disabled,
  suggestions,
  isOpen,
  onFocus,
  onBlur,
  onChange,
  onSelect,
  getLabel,
  getDescription,
}: {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  suggestions: T[];
  isOpen: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onSelect: (value: T) => void;
  getLabel: (value: T) => string;
  getDescription: (value: T) => string;
}) {
  return (
    <label className="relative grid gap-2 text-sm font-semibold text-foreground">
      {label}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required
          autoComplete="off"
          className="pl-9"
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-xl">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${getLabel(suggestion)}-${index}`}
              type="button"
              className="grid w-full gap-1 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
              }}
            >
              <span className="inline-flex items-start gap-2 font-semibold text-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {getLabel(suggestion)}
              </span>
              {getDescription(suggestion) ? (
                <span className="pl-6 text-xs text-muted-foreground">
                  {getDescription(suggestion)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}
