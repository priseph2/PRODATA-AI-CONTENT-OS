import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    instagram: "text-pink-600",
    facebook: "text-blue-600",
    linkedin: "text-blue-700",
    twitter: "text-sky-500",
    tiktok: "text-gray-900",
  };
  return colors[platform.toLowerCase()] || "text-gray-500";
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    instagram: "📷",
    facebook: "📘",
    linkedin: "💼",
    twitter: "🐦",
    tiktok: "🎵",
  };
  return icons[platform.toLowerCase()] || "📝";
}