// src/app/market/[id]/ProductGallery.jsx
"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }) {
  const [current, setCurrent] = useState(0);

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={name}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === current ? "border-emerald-500" : "border-gray-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}