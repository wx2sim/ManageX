"use client";

import { useState } from "react";

interface AddGirlFormData {
  name: string;
  age: string;
  phone: string;
  stay: "permanent" | "temporary";
  picture: File | null;
  bedNumber: string;
}

interface AddGirlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AddGirlFormData) => void;
}

export default function AddGirlModal({ isOpen, onClose, onSubmit }: AddGirlModalProps) {
  const [formData, setFormData] = useState<AddGirlFormData>({
    name: "",
    age: "",
    phone: "",
    stay: "permanent",
    picture: null,
    bedNumber: "",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        picture: file,
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.phone || !formData.bedNumber) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      phone: "",
      stay: "permanent",
      picture: null,
      bedNumber: "",
    });
    setPreviewUrl(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-sm rounded-3xl border border-pink-200 bg-white shadow-[0_20px_100px_rgba(236,72,153,0.2)] overflow-visible max-h-[calc(100vh-2rem)] flex flex-col">
        <div className="flex items-center justify-between border-b border-pink-100 p-4 sm:p-5 shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-950">Add New Girl</h2>
          <button
            onClick={onClose}
            className="text-lg text-zinc-400 transition hover:text-zinc-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-4 sm:p-5 overflow-y-auto flex-1">
          {/* Picture Upload */}
          <div className="flex flex-col items-center gap-2">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-14 w-14 rounded-full object-cover border border-pink-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center text-base text-pink-700">
                👤
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs text-zinc-600 cursor-pointer"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-950 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full name"
              className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            />
          </div>

          {/* Age & Bed Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-950 mb-1">
                Age *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Age"
                min="1"
                max="120"
                className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-950 mb-1">
                Bed *
              </label>
              <input
                type="text"
                name="bedNumber"
                value={formData.bedNumber}
                onChange={handleInputChange}
                placeholder="Number"
                className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-zinc-950 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone number"
              className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            />
          </div>

          {/* Stay Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-950 mb-1">
              Stay Type
            </label>
            <div className="relative">
              <select
                name="stay"
                value={formData.stay}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 pr-8 text-sm text-zinc-950 transition appearance-none focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50 cursor-pointer"
              >
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-2 text-zinc-500 text-sm">
                ▼
              </div>
            </div>
          </div>
        </form>

        {/* Buttons */}
        <div className="flex gap-2 p-4 sm:p-5 border-t border-pink-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 rounded-xl bg-pink-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-pink-500/30 transition hover:bg-pink-700"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
