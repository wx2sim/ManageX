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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-4xl border border-pink-200/70 bg-white/95 shadow-[0_40px_120px_rgba(236,72,153,0.25)] backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-pink-100/50 bg-white/95 p-6">
          <h2 className="text-2xl font-semibold text-zinc-950">Add New Girl</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 transition hover:text-zinc-600"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Picture Upload */}
          <div>
            <label className="block text-sm font-semibold text-zinc-950 mb-2">
              Profile Picture
            </label>
            <div className="flex flex-col items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-pink-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center text-2xl text-pink-700">
                  📷
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm text-zinc-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-zinc-950 mb-2">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter girl's name"
              className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-semibold text-zinc-950 mb-2">
              Age *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="Enter age"
              min="1"
              max="120"
              className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-zinc-950 mb-2">
              Phone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter phone number"
              className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            />
          </div>

          {/* Stay Type */}
          <div>
            <label className="block text-sm font-semibold text-zinc-950 mb-2">
              Stay Type
            </label>
            <select
              name="stay"
              value={formData.stay}
              onChange={handleInputChange}
              className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-950 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            >
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary</option>
            </select>
          </div>

          {/* Bed Number */}
          <div>
            <label className="block text-sm font-semibold text-zinc-950 mb-2">
              Bed Number *
            </label>
            <input
              type="text"
              name="bedNumber"
              value={formData.bedNumber}
              onChange={handleInputChange}
              placeholder="Enter bed number"
              className="w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-400 transition focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-300/50"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:bg-pink-700"
            >
              Add Girl
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
