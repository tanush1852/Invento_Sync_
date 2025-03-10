import React from "react";
import { motion } from "framer-motion";

const Hero = () => {
  // Stagger effect for text elements
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 overflow-hidden">
      {/* Moving gradient background */}
      <div className="absolute inset-0 moving-gradient"></div>

      <div className="relative flex flex-col md:flex-row items-center gap-12">
        {/* Left Column - Text with animations */}
        <motion.div
          className="md:w-1/2"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <motion.h1
            className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6"
            variants={item}
          >
            <span className="block">Revolutionize</span>
            <span className="block text-blue-600">Inventory Management</span>
          </motion.h1>

          <motion.p className="text-lg text-gray-600 mb-8" variants={item}>
            Streamline your stock, boost efficiency, and unlock growth with our
            powerful inventory management software.
          </motion.p>

          <motion.div variants={item}>
            <motion.a
              href="#"
              className="inline-block px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out shadow-md mr-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.a>
            <motion.a
              href="#"
              className="inline-block px-6 py-3 bg-transparent border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-blue-600 hover:text-blue-600 transition duration-300 ease-in-out"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Demo
            </motion.a>
          </motion.div>
        </motion.div>

        {/* Right Column - Simplified static image presentation with no animations */}
        <div className="md:w-1/2 relative">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl"></div>
            <img
              src="/LandingPage1.jpg"
              alt="Warehouse with inventory shelves"
              className="relative w-full rounded-lg shadow-lg object-cover border-2 border-white"
              style={{ maxHeight: "500px" }}
            />

            {/* Simple subtle overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Animated wave divider */}
      <div className="absolute bottom-0 left-0 w-full">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120">
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,80C672,64,768,64,864,69.3C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* Angled Moving gradient animation */}
      <style jsx>{`
        .moving-gradient {
          background: linear-gradient(
            135deg,
            rgba(238, 242, 255, 0.4),
            rgba(219, 234, 254, 0.4),
            rgba(196, 225, 255, 0.4),
            rgba(224, 242, 254, 0.4)
          );
          background-size: 400% 400%;
          animation: gradient 15s ease infinite;
          z-index: -1;
        }

        @keyframes gradient {
          0% {
            background-position: 0% 25%;
          }
          25% {
            background-position: 50% 0%;
          }
          50% {
            background-position: 100% 50%;
          }
          75% {
            background-position: 50% 100%;
          }
          100% {
            background-position: 0% 25%;
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
