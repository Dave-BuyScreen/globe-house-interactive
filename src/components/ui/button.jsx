import React from "react";

const variants = {
  default: "",
  ghost: "bg-transparent",
  outline: "border bg-transparent",
};

const sizes = {
  default: "",
  icon: "inline-flex items-center justify-center p-0",
};

export const Button = React.forwardRef(function Button(
  { variant = "default", size = "default", className = "", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] ?? ""} ${sizes[size] ?? ""} ${className}`}
      {...props}
    />
  );
});

export default Button;
