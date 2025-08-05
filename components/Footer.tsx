import React from "react";
import LogoSwitcher from "./LogoSwitcher";

const Footer = () => {
  return (
    <footer className="w-full border-t-2 border-blue-950 dark:bg-neutral bg-white dark:text-white text-black mt-8 px-4 py-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <LogoSwitcher />
        </div>

        {/* Center: Text */}
        <div className="text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} - Mawarid Holding Investment LLC.
            All rights reserved.
          </p>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400 ">
            Created by{" "}
            <span className="hover:text-yellow-300">
              <a
                href="https://www.linkedin.com/in/muhammad-abdullah-62647829b"
                target="_blank"
                rel="noopener noreferrer"
              >
                Muhammad Abdullah
              </a>
            </span>
          </p>
        </div>

        {/* Right: Social Links */}
        <div className="flex gap-4">
          <a
            href="https://www.instagram.com/mawaridhi/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-500 transition"
          >
            <i className="fab fa-instagram text-2xl hover:text-pink-500"></i>
          </a>
          <a
            href="https://www.linkedin.com/company/mawarid-holding-investment/?originalSubdomain=ae"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition"
          >
            <i className="fab fa-linkedin-in text-2xl hover:text-blue-600"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;