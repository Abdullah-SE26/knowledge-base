"use client";

import React, { FC, SVGProps } from "react";
import { TextInput, TextInputProps } from "flowbite-react";
import { Search } from "lucide-react";

interface SearchBarProps extends TextInputProps {
  icon?: FC<SVGProps<SVGSVGElement>>;
}

const SearchBar: FC<SearchBarProps> = ({
  placeholder = "Search...",
  required = true,
  icon = Search,
  className,
  type = "search",
  ...rest
}) => {
  return (
    <TextInput
      type={type}
      placeholder={placeholder}
      required={required}
      icon={icon}
      className={className}
      {...rest}
    />
  );
};

export default SearchBar;
