"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  className?: string;
}

export function UserAvatar({ name, image, className }: UserAvatarProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={className}>
      {image && <AvatarImage src={image} alt={name || "User"} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
