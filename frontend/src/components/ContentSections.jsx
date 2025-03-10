import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Feature section component for main content
const FeatureSection = ({ title, description, icon, image, reversed }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <motion.div
      ref={ref}
      className={`flex flex-col ${
        reversed ? "md:flex-row-reverse" : "md:flex-row"
      } gap-8 py-16`}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {/* Text content */}
      <div className="w-full md:w-1/2 space-y-6 flex flex-col justify-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600">
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        <p className="text-lg text-gray-600">{description}</p>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <a
            href="#"
            className="text-blue-600 font-medium flex items-center group"
          >
            Learn more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </motion.div>
      </div>

      {/* Image */}
      <motion.div
        className="w-full md:w-1/2"
        initial={{ opacity: 0, x: reversed ? -30 : 30 }}
        animate={
          inView ? { opacity: 1, x: 0 } : { opacity: 0, x: reversed ? -30 : 30 }
        }
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <div className="relative rounded-lg overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-60"></div>
          <img
            src={image}
            alt={title}
            className="relative w-full h-full object-cover rounded-lg"
            style={{ minHeight: "300px" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Bento Box Feature component with mouse interaction
const BentoFeature = ({ icon, title, description, size = "small", index }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: "-50px 0px",
  });

  // Create a staggered animation effect
  const delay = index * 0.1;

  // Ref for the div element to apply mouse movement effects
  const boxRef = useRef(null);

  // Set up mouse move effect
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const handleMouseMove = (e) => {
      const boxRect = box.getBoundingClientRect();

      // Calculate mouse position relative to the box center
      const boxCenterX = boxRect.left + boxRect.width / 2;
      const boxCenterY = boxRect.top + boxRect.height / 2;

      // Calculate the mouse distance from center (as percentage of box width/height)
      const deltaX = (e.clientX - boxCenterX) / (boxRect.width / 2);
      const deltaY = (e.clientY - boxCenterY) / (boxRect.height / 2);

      // Apply the 3D transform
      // Limit the rotation to make it subtle
      const rotateX = -deltaY * 5; // 5 degrees max rotation
      const rotateY = deltaX * 5; // 5 degrees max rotation
      const scale = 1.03; // Subtle scale on hover

      // Apply transforms
      box.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;

      // Move background gradient based on mouse position
      const gradientElement = box.querySelector(".bento-gradient");
      if (gradientElement) {
        const moveX = deltaX * 15;
        const moveY = deltaY * 15;
        gradientElement.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    const handleMouseLeave = () => {
      // Reset transforms when mouse leaves
      box.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;

      const gradientElement = box.querySelector(".bento-gradient");
      if (gradientElement) {
        gradientElement.style.transform = `translate(0px, 0px)`;
      }
    };

    // Add event listeners
    box.addEventListener("mousemove", handleMouseMove);
    box.addEventListener("mouseleave", handleMouseLeave);

    // Clean up
    return () => {
      box.removeEventListener("mousemove", handleMouseMove);
      box.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={(el) => {
        // Combine both refs
        boxRef.current = el;
        if (ref) {
          ref(el);
        }
      }}
      className={`bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col h-full relative overflow-hidden
        ${size === "large" ? "row-span-2 col-span-2" : ""}
        ${size === "medium" ? "row-span-1 col-span-2" : ""}
        ${size === "small" ? "row-span-1 col-span-1" : ""}
      `}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.6,
        delay: delay,
        ease: "easeOut",
      }}
      style={{
        transformOrigin: "center center",
        transition: "transform 0.2s ease-out",
        willChange: "transform",
      }}
    >
      {/* Interactive gradient background that moves with mouse */}
      <div
        className="bento-gradient absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-30"
        style={{
          transition: "transform 0.3s ease-out",
          willChange: "transform",
        }}
      ></div>

      {/* Decorative elements that respond to hover */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-400/5 rounded-full"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-400/5 rounded-full"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="text-blue-600 mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Hover effect border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-indigo-500/0 to-purple-500/0 opacity-0 transition-opacity duration-300 hover:opacity-30 pointer-events-none"></div>
    </motion.div>
  );
};

const ContentSections = () => {
  // Add global moving gradient with improved visibility
  useEffect(() => {
    // Ensure the gradient animation continues throughout the page
    const body = document.querySelector("body");
    if (body && !body.classList.contains("with-moving-gradient")) {
      body.classList.add("with-moving-gradient");

      // Add global styles if not already added with increased opacity for better visibility
      if (!document.getElementById("global-gradient-style")) {
        const style = document.createElement("style");
        style.id = "global-gradient-style";
        style.textContent = `
          body.with-moving-gradient {
            position: relative;
          }
          
          body.with-moving-gradient::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              135deg, 
              rgba(238, 242, 255, 0.7),  /* Increased opacity */
              rgba(219, 234, 254, 0.7),  /* Increased opacity */
              rgba(196, 225, 255, 0.7),  /* Increased opacity */
              rgba(224, 242, 254, 0.7)   /* Increased opacity */
            );
            background-size: 400% 400%;
            animation: global-gradient 15s ease infinite;
            z-index: -1;
            pointer-events: none;
          }
          
          @keyframes global-gradient {
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
          
          /* Add a subtle noise texture for better visual effect */
          body.with-moving-gradient::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
            z-index: -1;
            opacity: 0.3;
            pointer-events: none;
          }
        `;
        document.head.appendChild(style);
      }
    }

    return () => {
      // Cleanup is optional
    };
  }, []);

  // Feature sections data
  const features = [
    {
      title: "Real-time Inventory Tracking",
      description:
        "Monitor your stock levels in real-time across all locations. Get instant updates on inventory movements, ensuring you always know what's in stock, what's low, and what's on the way.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      image: "/LandingPage4.jpg",
    },
    {
      title: "Automated Reordering System",
      description:
        "Let our system automatically reorder products when inventory falls below your specified thresholds. Save time and ensure you never run out of essential items without manual intervention.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      image: "/LandingPage3.jpg",
      reversed: true,
    },
    {
      title: "Comprehensive Analytics",
      description:
        "Gain valuable insights with powerful analytics tools. Track sales trends, identify your best-selling products, monitor inventory turnover rates, and make data-driven decisions to optimize your business.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      image: "/LandingPage2.png",
    },
  ];

  // "Everything you need" bento box features
  const bentoFeatures = [
    {
      title: "Financial Report Generation",
      description:
        "Generate and store financial reports seamlessly using Google Sheets and Docs. Automate data extraction, processing, and real-time updates with Google Apps Script.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="8" x2="7" y2="16" />
          <line x1="11" y1="8" x2="11" y2="16" />
          <line x1="15" y1="8" x2="15" y2="16" />
          <line x1="19" y1="8" x2="19" y2="16" />
        </svg>
      ),
      size: "small",
    },
    {
      title: "Multi-Location Support",
      description:
        "Manage inventory across multiple warehouses, stores, or locations from a single interface.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      size: "medium",
    },
    {
      title: "Supplier Management",
      description:
        "Keep track of supplier information, purchase history, and performance metrics in one place.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      size: "small",
    },
    {
      title: "Mobile Access",
      description:
        "Access your inventory system from anywhere on your mobile device with our responsive design.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      ),
      size: "small",
    },
    {
      title: "Comprehensive Reporting",
      description:
        "Generate detailed reports on inventory status, sales trends, reorder needs, and more with just a few clicks.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
      size: "medium",
    },
    {
      title: "Low Stock Alerts",
      description:
        "Receive notifications when inventory levels drop below your defined thresholds.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      size: "small",
    },
   
  ];

  // Animating section title
  const [sectionRef, sectionInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-12 z-10">
      {/* Add a container with higher z-index to ensure content appears above the background gradient */}
      <div className="relative z-10">
        {/* Main content */}
        <div className="py-8">
          {features.map((feature, index) => (
            <FeatureSection key={index} {...feature} />
          ))}
        </div>

        {/* "Everything you need" Bento Box Section */}
        <div className="py-16">
          <motion.div
            ref={sectionRef}
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={
              sectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Inventory
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600">
              Our comprehensive platform offers all the tools you need to
              streamline your operations.
            </p>
          </motion.div>

          {/* Bento Box Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-min">
            {bentoFeatures.map((feature, index) => (
              <BentoFeature key={index} index={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentSections;
