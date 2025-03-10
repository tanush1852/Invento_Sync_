import React from "react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ContentSections from "@/components/ContentSections";

const LandingPage = () => {
  return (
    <div className="font-sans">
      <Hero />
      <ContentSections />
      <Footer />
    </div>
  );
};

export default LandingPage;
