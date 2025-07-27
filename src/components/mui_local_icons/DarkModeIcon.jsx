import React from "react";

function DarkModeIcon({ fontSize = "small", ...props }) {
  return (
    <svg
      width={fontSize === "small" ? 16 : fontSize === "medium" ? 20 : 24}
      height={fontSize === "small" ? 16 : fontSize === "medium" ? 20 : 24}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
    </svg>
  );
}

export default DarkModeIcon;
