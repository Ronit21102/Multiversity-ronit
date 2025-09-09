import React from "react";

import { User } from "../types/editor";
import UserAvatar from "./UserAvatar";

interface OnlineUsersProps {
  onlineUsers: User[];
  currentUser: User;
  status: "connecting" | "connected" | "disconnected";
}

const OnlineUsers: React.FC<OnlineUsersProps> = ({
  onlineUsers,
  currentUser,
  status,
}) => {
  return (
    <div className="border-b border-gray-100 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {onlineUsers.length + 1} user
            {onlineUsers.length + 1 === 1 ? "" : "s"} online
          </span>
          <div className="flex items-center -space-x-2">
            {onlineUsers.map((user, index) => (
              <UserAvatar key={`${user.name}-${index}`} user={user} />
            ))}
            <UserAvatar user={currentUser} isCurrentUser={true} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              status === "connected" ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-500">
            {status === "connected" ? "Connected" : "Offline"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OnlineUsers;
