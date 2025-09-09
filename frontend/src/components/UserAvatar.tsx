import React from "react";

import { User } from "../types/editor";

interface UserAvatarProps {
  user: User;
  isCurrentUser?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  isCurrentUser = false,
}) => {
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: user.color }}
      title={isCurrentUser ? `${user.name} (You)` : user.name}
    >
      {getUserInitials(user.name)}
    </div>
  );
};

export default UserAvatar;
