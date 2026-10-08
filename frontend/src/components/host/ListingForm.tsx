"use client";

/**
 * ListingForm.tsx
 *
 * Multi-step wizard for creating and editing listings:
 *  - Step 1: Basics (Title, Description, Property Type, Room Type, Category)
 *  - Step 2: Location (City, State, Country, Address, Lat/Lng coordinates)
 *  - Step 3: Floor Plan (Guests, Bedrooms, Beds, Bathrooms)
 *  - Step 4: Amenities (Categorized grid with vector icons)
 *  - Step 5: Photos (URL input, sample presets, thumbnail grid, reorder, remove, min 5)
 *  - Step 6: Pricing (Nightly rate, Cleaning fee, Live 3-night estimate)
 *  - Step 7: Review & Publish (Full preview, ground rules, submit)
 */

import React, { useState, useEffect, useReducer } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Home,
  Building,
  Castle,
  Warehouse,
  Hotel,
  Tent,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Sparkles,
  Wifi,
  Utensils,
  Wind,
  Flame,
  Waves,
  Car,
  Tv,
  Bath,
  Dumbbell,
  Snowflake,
  Zap,
  Monitor,
  Bell,
  Coffee,
  PawPrint,
  LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "../../lib/api";
import type {
  ListingDetail,
  Category,
  Amenity,
  RoomType,
  ListingCreate,
  ListingUpdate,
} from "../../types";

const PROPERTY_TYPES = [
  { id: "House", label: "House", icon: Home, desc: "A standalone residential building" },
  { id: "Apartment", label: "Apartment", icon: Building, desc: "A rented unit in a multi-unit building" },
  { id: "Villa", label: "Villa", icon: Castle, desc: "A luxurious and spacious retreat" },
  { id: "Cabin", label: "Cabin", icon: Tent, desc: "A rustic stay surrounded by nature" },
  { id: "Guesthouse", label: "Guesthouse", icon: Warehouse, desc: "A separate carriage house or suite" },
  { id: "Hotel", label: "Hotel", icon: Hotel, desc: "A boutique or hospitality room" },
];

const ROOM_TYPES: { id: RoomType; label: string; desc: string }[] = [
  { id: "entire_home", label: "An entire place", desc: "Guests have the whole place to themselves." },
  { id: "private_room", label: "A private room", desc: "Guests have their own room, plus shared common spaces." },
  { id: "shared_room", label: "A shared room", desc: "Guests sleep in a room or common area shared with others." },
];

const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi,
  utensils: Utensils,
  kitchen: Utensils,
  wind: Wind,
  flame: Flame,
  heating: Flame,
  waves: Waves,
  pool: Waves,
  car: Car,
  parking: Car,
  sparkles: Sparkles,
  tv: Tv,
  bath: Bath,
  dumbbell: Dumbbell,
  snowflake: Snowflake,
  zap: Zap,
  monitor: Monitor,
  bell: Bell,
  coffee: Coffee,
  paw: PawPrint,
};

const SAMPLE_PHOTO_PRESETS = [
  {
    name: "Modern Loft",
    urls: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
    ],
  },
  {
    name: "Coastal Villa",
    urls: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80",
    ],
  },
  {
    name: "Alpine Cabin",
    urls: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80",
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&q=80",
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1200&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1200&q=80",
    ],
  },
];

interface FormState {
  title: string;
  description: string;
  propertyType: string;
  roomType: RoomType;
  categoryId: number | null;
  city: string;
  state: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenityIds: number[];
  imageUrls: string[];
  pricePerNight: number;
  cleaningFee: number;
  status: "active" | "inactive";
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: unknown }
  | { type: "TOGGLE_AMENITY"; amenityId: number }
  | { type: "ADD_IMAGE"; url: string }
  | { type: "REMOVE_IMAGE"; index: number }
  | { type: "MOVE_IMAGE"; fromIndex: number; toIndex: number }
  | { type: "SET_PRESET_IMAGES"; urls: string[] };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "TOGGLE_AMENITY": {
      const exists = state.amenityIds.includes(action.amenityId);
      return {
        ...state,
        amenityIds: exists
          ? state.amenityIds.filter((id) => id !== action.amenityId)
          : [...state.amenityIds, action.amenityId],
      };
    }
    case "ADD_IMAGE": {
      if (!action.url.trim() || state.imageUrls.includes(action.url.trim())) return state;
      return { ...state, imageUrls: [...state.imageUrls, action.url.trim()] };
    }
    case "REMOVE_IMAGE": {
      const updated = state.imageUrls.filter((_, i) => i !== action.index);
      return { ...state, imageUrls: updated };
    }
    case "MOVE_IMAGE": {
      const { fromIndex, toIndex } = action;
      if (toIndex < 0 || toIndex >= state.imageUrls.length) return state;
      const copy = [...state.imageUrls];
      const [item] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, item);
      return { ...state, imageUrls: copy };
    }
    case "SET_PRESET_IMAGES": {
      return { ...state, imageUrls: [...action.urls] };
    }
    default:
      return state;
  }
}

interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: ListingDetail;
  onSuccess?: (listing: ListingDetail) => void;
}

const TOTAL_STEPS = 7;
const STEP_TITLES = [
  "Basics",
  "Location",
  "Capacity",
  "Amenities",
  "Photos",
  "Pricing",
  "Review",
];

export function ListingForm({ mode, initialData, onSuccess }: ListingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const initialState: FormState = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    propertyType: initialData?.property_type || "House",
    roomType: initialData?.room_type || "entire_home",
    categoryId: initialData?.category_id || null,
    city: initialData?.city || "",
    state: initialData?.state || "",
    country: initialData?.country || "India",
    address: initialData?.address || "",
    latitude: initialData?.latitude || 28.6139,
    longitude: initialData?.longitude || 77.209,
    maxGuests: initialData?.max_guests || 2,
    bedrooms: initialData?.bedrooms || 1,
    beds: initialData?.beds || 1,
    bathrooms: initialData?.bathrooms || 1,
    amenityIds: initialData?.amenities.map((a) => a.id) || [],
    imageUrls: initialData?.images.map((img) => img.url) || [],
    pricePerNight: initialData?.price_per_night || 3500,
    cleaningFee: initialData?.cleaning_fee || 500,
    status: (initialData?.status as "active" | "inactive") || "active",
  };

  const [state, dispatch] = useReducer(formReducer, initialState);

  // Load categories and amenities
  const initialCategoryId = initialData?.category_id;
  useEffect(() => {
    let cancelled = false;
    Promise.all([apiClient.categories.list(), apiClient.amenities.list()])
      .then(([cats, amens]) => {
        if (cancelled) return;
        setCategories(cats);
        setAmenities(amens);
        if (!initialCategoryId && cats.length > 0) {
          dispatch({ type: "SET_FIELD", field: "categoryId", value: cats[0].id });
        }
      })
      .catch((err) => {
        console.error("Failed to load categories/amenities", err);
      });
    return () => {
      cancelled = true;
    };
  }, [initialCategoryId]);

  // Validation per step
  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!state.title.trim()) return "Please enter a listing title.";
        if (state.title.length > 80) return "Title must be 80 characters or fewer.";
        if (!state.description.trim() || state.description.trim().length < 50) {
          return "Description must be at least 50 characters long.";
        }
        if (!state.propertyType) return "Please choose a property type.";
        if (!state.categoryId) return "Please choose a category.";
        return null;
      case 2:
        if (!state.city.trim()) return "Please provide the city.";
        if (!state.country.trim()) return "Please provide the country.";
        return null;
      case 3:
        if (state.maxGuests < 1) return "Must accommodate at least 1 guest.";
        if (state.beds < 1) return "Must have at least 1 bed.";
        if (state.bathrooms < 0.5) return "Must have at least 0.5 bathrooms.";
        return null;
      case 4:
        return null; // Amenities can be empty or optional
      case 5:
        if (state.imageUrls.length < 5) {
          return `Please add at least 5 photos (${state.imageUrls.length}/5 currently).`;
        }
        return null;
      case 6:
        if (state.pricePerNight < 100) return "Price per night must be at least ₹100.";
        if (state.cleaningFee < 0) return "Cleaning fee cannot be negative.";
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.error(error);
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAddCustomImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    try {
      new URL(newImageUrl.trim());
      dispatch({ type: "ADD_IMAGE", url: newImageUrl.trim() });
      setNewImageUrl("");
      toast.success("Photo added");
    } catch {
      toast.error("Please enter a valid image URL (e.g. https://...)");
    }
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let s = 1; s <= 6; s++) {
      const err = validateStep(s);
      if (err) {
        toast.error(`Step ${s} (${STEP_TITLES[s - 1]}): ${err}`);
        setCurrentStep(s);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const payload: ListingCreate = {
          title: state.title.trim(),
          description: state.description.trim(),
          property_type: state.propertyType,
          category_id: state.categoryId || undefined,
          room_type: state.roomType,
          city: state.city.trim(),
          state: state.state.trim() || undefined,
          country: state.country.trim(),
          address: state.address.trim() || undefined,
          latitude: state.latitude,
          longitude: state.longitude,
          price_per_night: Number(state.pricePerNight),
          cleaning_fee: Number(state.cleaningFee),
          max_guests: state.maxGuests,
          bedrooms: state.bedrooms,
          beds: state.beds,
          bathrooms: state.bathrooms,
          amenity_ids: state.amenityIds,
          image_urls: state.imageUrls,
        };

        const created = await apiClient.host.createListing(payload);
        toast.success("Listing created successfully!");
        if (onSuccess) {
          onSuccess(created);
        } else {
          router.push(`/host/dashboard?tab=listings`);
        }
      } else {
        if (!initialData) return;
        const payload: ListingUpdate = {
          title: state.title.trim(),
          description: state.description.trim(),
          property_type: state.propertyType,
          category_id: state.categoryId || undefined,
          room_type: state.roomType,
          city: state.city.trim(),
          state: state.state.trim() || undefined,
          country: state.country.trim(),
          address: state.address.trim() || undefined,
          latitude: state.latitude,
          longitude: state.longitude,
          price_per_night: Number(state.pricePerNight),
          cleaning_fee: Number(state.cleaningFee),
          max_guests: state.maxGuests,
          bedrooms: state.bedrooms,
          beds: state.beds,
          bathrooms: state.bathrooms,
          status: state.status,
          amenity_ids: state.amenityIds,
          image_urls: state.imageUrls,
        };

        const updated = await apiClient.host.updateListing(initialData.id, payload);
        toast.success("Listing updated successfully!");
        if (onSuccess) {
          onSuccess(updated);
        } else {
          router.push(`/host/dashboard?tab=listings`);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to save listing:", err);
      const msg = err instanceof Error ? err.message : "Failed to save listing";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group amenities by category
  const categorizedAmenities = amenities.reduce<Record<string, Amenity[]>>((acc, item) => {
    const cat = item.category || "features";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Pricing preview calculation for 3 nights
  const sampleNights = 3;
  const sampleSubtotal = state.pricePerNight * sampleNights;
  const sampleCleaning = state.cleaningFee;
  const sampleServiceFee = Math.round(sampleSubtotal * 0.14);
  const sampleTotal = sampleSubtotal + sampleCleaning + sampleServiceFee;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Top Wizard Steps Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase text-[#717171]">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <h2 className="text-2xl font-bold text-[#222222]">
              {STEP_TITLES[currentStep - 1]}
            </h2>
          </div>
          <div className="text-sm font-medium text-[#717171]">
            {mode === "create" ? "New Listing" : `Editing #${initialData?.id}`}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#FF385C] h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center justify-between mt-3 overflow-x-auto gap-2 pb-1 text-xs">
          {STEP_TITLES.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurr = stepNum === currentStep;
            return (
              <button
                key={title}
                type="button"
                onClick={() => {
                  // Only allow jumping back or to immediate next step if valid
                  if (stepNum <= currentStep) {
                    setCurrentStep(stepNum);
                  } else if (stepNum === currentStep + 1 && !validateStep(currentStep)) {
                    setCurrentStep(stepNum);
                  }
                }}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full font-medium transition-colors ${
                  isCurr
                    ? "bg-[#222222] text-white"
                    : isDone
                    ? "bg-neutral-100 text-[#222222] hover:bg-neutral-200"
                    : "text-[#717171] opacity-50 cursor-not-allowed"
                }`}
              >
                {stepNum}. {title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-white border border-[#DDDDDD] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* ── STEP 1: BASICS ── */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-1">
                Listing Title
              </label>
              <p className="text-xs text-[#717171] mb-2">
                Catchy and descriptive titles work best. Highlight what makes your place special.
              </p>
              <div className="relative">
                <input
                  type="text"
                  maxLength={80}
                  value={state.title}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "title", value: e.target.value })
                  }
                  placeholder="e.g. Peaceful Hillside Villa with Infinity Pool"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#222222] text-sm"
                />
                <span className="absolute right-3 bottom-3 text-xs text-[#717171]">
                  {state.title.length}/80
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-1">
                Description
              </label>
              <p className="text-xs text-[#717171] mb-2">
                Share what makes your space unique, the neighborhood, and the ambiance (minimum 50 characters).
              </p>
              <div className="relative">
                <textarea
                  rows={5}
                  value={state.description}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "description", value: e.target.value })
                  }
                  placeholder="Describe your space in detail..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#222222] text-sm"
                />
                <span
                  className={`absolute right-3 bottom-3 text-xs ${
                    state.description.length >= 50 ? "text-emerald-600" : "text-[#717171]"
                  }`}
                >
                  {state.description.length} chars (min 50)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-3">
                Property Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PROPERTY_TYPES.map((pt) => {
                  const Icon = pt.icon;
                  const selected = state.propertyType === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SET_FIELD", field: "propertyType", value: pt.id })
                      }
                      className={`p-4 rounded-xl border text-left flex flex-col items-start gap-2 transition-all ${
                        selected
                          ? "border-[#222222] bg-neutral-50 ring-2 ring-[#222222]"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <Icon className="w-6 h-6 text-[#222222]" />
                      <div>
                        <div className="font-semibold text-sm text-[#222222]">{pt.label}</div>
                        <div className="text-xs text-[#717171] leading-tight mt-0.5">{pt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#222222] mb-3">
                What type of place will guests have?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROOM_TYPES.map((rt) => {
                  const selected = state.roomType === rt.id;
                  return (
                    <button
                      key={rt.id}
                      type="button"
                      onClick={() =>
                        dispatch({ type: "SET_FIELD", field: "roomType", value: rt.id })
                      }
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selected
                          ? "border-[#222222] bg-neutral-50 ring-2 ring-[#222222]"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className="font-semibold text-sm text-[#222222]">{rt.label}</div>
                      <div className="text-xs text-[#717171] mt-1">{rt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-[#222222] mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const selected = state.categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          dispatch({ type: "SET_FIELD", field: "categoryId", value: c.id })
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? "bg-[#222222] text-white border-[#222222]"
                            : "bg-white text-[#222222] border-neutral-300 hover:border-neutral-500"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: LOCATION ── */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={state.city}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "city", value: e.target.value })
                  }
                  placeholder="e.g. Udaipur"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={state.state}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "state", value: e.target.value })
                  }
                  placeholder="e.g. Rajasthan"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={state.country}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "country", value: e.target.value })
                  }
                  placeholder="e.g. India"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={state.address}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", field: "address", value: e.target.value })
                  }
                  placeholder="e.g. 14 Lake Palace Road"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <h4 className="text-sm font-semibold text-[#222222] mb-2">
                Coordinates (Latitude / Longitude)
              </h4>
              <p className="text-xs text-[#717171] mb-3">
                Used to pin your place on the map.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-xs text-[#717171] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={state.latitude}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "latitude",
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#717171] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={state.longitude}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "longitude",
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm"
                  />
                </div>
              </div>

              {/* Location pin preview card */}
              <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF385C]/10 flex items-center justify-center text-[#FF385C] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#222222]">
                    Pin Preview: {state.city || "City"}, {state.country || "Country"}
                  </div>
                  <div className="text-[11px] text-[#717171]">
                    {state.address ? `${state.address} • ` : ""}Lat {state.latitude.toFixed(4)}, Lng {state.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: CAPACITY & FLOOR PLAN ── */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-lg">
            <p className="text-xs text-[#717171]">
              Specify the sleeping arrangements and capacity for your guests.
            </p>

            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <div className="font-semibold text-sm text-[#222222]">Guests</div>
                <div className="text-xs text-[#717171]">Maximum number of people allowed</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={state.maxGuests <= 1}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "maxGuests",
                      value: Math.max(1, state.maxGuests - 1),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm disabled:opacity-30 hover:border-[#222222]"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold">{state.maxGuests}</span>
                <button
                  type="button"
                  disabled={state.maxGuests >= 16}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "maxGuests",
                      value: Math.min(16, state.maxGuests + 1),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm hover:border-[#222222]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <div className="font-semibold text-sm text-[#222222]">Bedrooms</div>
                <div className="text-xs text-[#717171]">Dedicated sleeping rooms</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={state.bedrooms <= 0}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "bedrooms",
                      value: Math.max(0, state.bedrooms - 1),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm disabled:opacity-30 hover:border-[#222222]"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold">{state.bedrooms}</span>
                <button
                  type="button"
                  disabled={state.bedrooms >= 20}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "bedrooms",
                      value: Math.min(20, state.bedrooms + 1),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm hover:border-[#222222]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <div className="font-semibold text-sm text-[#222222]">Beds</div>
                <div className="text-xs text-[#717171]">Available beds for guests</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={state.beds <= 1}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "beds",
                      value: Math.max(1, state.beds - 1),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm disabled:opacity-30 hover:border-[#222222]"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold">{state.beds}</span>
                <button
                  type="button"
                  disabled={state.beds >= 20}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "beds",
                      value: Math.min(20, state.beds + 1),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm hover:border-[#222222]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-neutral-100">
              <div>
                <div className="font-semibold text-sm text-[#222222]">Bathrooms</div>
                <div className="text-xs text-[#717171]">Full and half baths</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={state.bathrooms <= 0.5}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "bathrooms",
                      value: Math.max(0.5, state.bathrooms - 0.5),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm disabled:opacity-30 hover:border-[#222222]"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold">{state.bathrooms}</span>
                <button
                  type="button"
                  disabled={state.bathrooms >= 10}
                  onClick={() =>
                    dispatch({
                      type: "SET_FIELD",
                      field: "bathrooms",
                      value: Math.min(10, state.bathrooms + 0.5),
                    })
                  }
                  className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-sm hover:border-[#222222]"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: AMENITIES ── */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <p className="text-xs text-[#717171]">
              Select all features available on the premises. Guests often filter by these!
            </p>

            {Object.entries(categorizedAmenities).map(([catName, amens]) => (
              <div key={catName} className="space-y-3">
                <h4 className="text-xs font-semibold text-[#717171] uppercase tracking-wider">
                  {catName}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {amens.map((amenity) => {
                    const isSelected = state.amenityIds.includes(amenity.id);
                    const iconKey = (amenity.icon || "").toLowerCase();
                    const Icon = AMENITY_ICONS[iconKey] || Sparkles;
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() =>
                          dispatch({ type: "TOGGLE_AMENITY", amenityId: amenity.id })
                        }
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                          isSelected
                            ? "border-[#222222] bg-neutral-50 ring-1 ring-[#222222]"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-[#FF385C]" : "text-[#717171]"
                          }`}
                        />
                        <span className="text-xs font-medium text-[#222222] truncate">
                          {amenity.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#222222] ml-auto shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 5: PHOTOS ── */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-[#222222]">
                  Listing Photos ({state.imageUrls.length}/5 required)
                </h4>
                <p className="text-xs text-[#717171]">
                  The first photo will be used as the cover photo. Reorder them using arrows.
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  state.imageUrls.length >= 5
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {state.imageUrls.length >= 5 ? "Requirement met" : "Needs 5 minimum"}
              </span>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleAddCustomImage} className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste an image URL (e.g. https://images.unsplash.com/...)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#222222]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add photo
              </button>
            </form>

            {/* Quick Sample Presets */}
            <div>
              <div className="text-xs font-semibold text-[#717171] mb-2">
                Or pick a preset photo gallery:
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      dispatch({ type: "SET_PRESET_IMAGES", urls: preset.urls })
                    }
                    className="text-xs px-3 py-1.5 rounded-full border border-neutral-300 hover:border-neutral-500 font-medium text-[#222222] bg-white transition-colors"
                  >
                    Load 5 {preset.name} photos
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail Grid with Reorder and Delete */}
            {state.imageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {state.imageUrls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    className="relative group rounded-xl overflow-hidden border border-neutral-200 aspect-[4/3] bg-neutral-100"
                  >
                    <Image
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 bg-[#222222] text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                        Cover Photo
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>

                    {/* Action Bar Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        title="Move left"
                        disabled={idx === 0}
                        onClick={() =>
                          dispatch({ type: "MOVE_IMAGE", fromIndex: idx, toIndex: idx - 1 })
                        }
                        className="w-7 h-7 rounded-full bg-white text-[#222222] flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Move right"
                        disabled={idx === state.imageUrls.length - 1}
                        onClick={() =>
                          dispatch({ type: "MOVE_IMAGE", fromIndex: idx, toIndex: idx + 1 })
                        }
                        className="w-7 h-7 rounded-full bg-white text-[#222222] flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Remove photo"
                        onClick={() =>
                          dispatch({ type: "REMOVE_IMAGE", index: idx })
                        }
                        className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-neutral-200 rounded-xl text-center text-xs text-[#717171]">
                No photos added yet. Add at least 5 photos or choose a preset gallery above.
              </div>
            )}
          </div>
        )}

        {/* ── STEP 6: PRICING ── */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#222222] mb-1">
                  Price per night (₹) *
                </label>
                <p className="text-xs text-[#717171] mb-2">
                  Set your base nightly rate. You can change this anytime.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-3 text-sm text-[#717171] font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={state.pricePerNight}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "pricePerNight",
                        value: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-300 font-semibold text-lg text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#222222] mb-1">
                  Cleaning fee (₹)
                </label>
                <p className="text-xs text-[#717171] mb-2">
                  One-time fee per stay to cover turnover and sanitization costs.
                </p>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-3 text-sm text-[#717171] font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    value={state.cleaningFee}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_FIELD",
                        field: "cleaningFee",
                        value: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-300 font-semibold text-lg text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#222222]"
                  />
                </div>
              </div>
            </div>

            {/* Live 3-night preview card */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 max-w-md">
              <div className="text-xs font-semibold text-[#717171] uppercase tracking-wider mb-3">
                Live 3-Night Price Quote Preview
              </div>
              <div className="space-y-2 text-sm text-[#222222]">
                <div className="flex justify-between">
                  <span className="text-[#717171]">
                    ₹{state.pricePerNight.toLocaleString()} × 3 nights
                  </span>
                  <span>₹{sampleSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717171]">Cleaning fee</span>
                  <span>₹{sampleCleaning.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717171]">Airbnb service fee (~14%)</span>
                  <span>₹{sampleServiceFee.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-base">
                  <span>Guest total</span>
                  <span>₹{sampleTotal.toLocaleString()}</span>
                </div>
                <div className="pt-1 text-[11px] text-[#717171]">
                  Your estimated host payout: ₹{(sampleSubtotal + sampleCleaning).toLocaleString()}
                </div>
              </div>
            </div>

            {/* In edit mode, allow toggling status */}
            {mode === "edit" && (
              <div className="pt-4 border-t border-neutral-200">
                <label className="block text-sm font-semibold text-[#222222] mb-1">
                  Listing Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "SET_FIELD", field: "status", value: "active" })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                      state.status === "active"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-neutral-600 border-neutral-300"
                    }`}
                  >
                    Active (Live in Search)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "SET_FIELD", field: "status", value: "inactive" })
                    }
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                      state.status === "inactive"
                        ? "bg-neutral-800 text-white border-neutral-800"
                        : "bg-white text-neutral-600 border-neutral-300"
                    }`}
                  >
                    Inactive (Deactivated / Hidden)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 7: REVIEW & PUBLISH ── */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-[#222222] mb-1">
                Review your listing details
              </h4>
              <p className="text-xs text-[#717171]">
                Everything look good? You can publish now and edit details anytime from your dashboard.
              </p>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-2xl border border-neutral-200 bg-neutral-50">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-200 md:col-span-1">
                {state.imageUrls[0] ? (
                  <Image
                    src={state.imageUrls[0]}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-neutral-400">
                    No image
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-white border border-neutral-200 text-[#717171]">
                  {state.propertyType} • {state.roomType.replace("_", " ")}
                </div>
                <h3 className="font-bold text-lg text-[#222222] leading-snug">
                  {state.title || "Untitled Listing"}
                </h3>
                <div className="text-xs text-[#717171]">
                  {state.city}, {state.state ? `${state.state}, ` : ""}{state.country}
                </div>
                <div className="text-xs text-[#717171] pt-1">
                  {state.maxGuests} guests • {state.bedrooms} bedrooms • {state.beds} beds • {state.bathrooms} baths
                </div>
                <div className="text-xs text-[#717171]">
                  {state.amenityIds.length} amenities selected • {state.imageUrls.length} photos
                </div>
                <div className="pt-2">
                  <span className="text-base font-bold text-[#222222]">
                    ₹{state.pricePerNight.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#717171]"> / night</span>
                  {state.cleaningFee > 0 && (
                    <span className="text-xs text-[#717171]">
                      {" "}• ₹{state.cleaningFee.toLocaleString()} cleaning
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 text-xs text-[#717171] bg-white space-y-1">
              <div className="font-semibold text-[#222222]">Host Commitment & Ground Rules</div>
              <p>
                By publishing, you agree to treat all guests with respect, maintain accurate listing details,
                and uphold Airbnb’s safety and hospitality standards.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] p-4 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1 || isSubmitting}
            onClick={handleBack}
            className="px-5 py-2.5 rounded-full border border-[#222222] text-[#222222] text-xs font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-8 py-2.5 rounded-full bg-[#FF385C] text-white text-xs font-semibold hover:bg-[#E31C5F] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isSubmitting
                ? "Saving listing..."
                : mode === "create"
                ? "Publish listing"
                : "Save changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
