"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface EvidenceLogo {
  name: string;
  src: string;
  alt: string;
}

const evidenceLogos: EvidenceLogo[] = [
  { name: "PubMed", src: "/logos/pubmed.png", alt: "PubMed" },
  { name: "Cochrane", src: "/logos/cochrane library.jpg", alt: "Cochrane Library" },
  { name: "FDA", src: "/logos/open fda.png", alt: "FDA" },
  { name: "NLM", src: "/logos/national library of medicine.png", alt: "National Library of Medicine" },
  { name: "MedlinePlus", src: "/logos/MedlinePlus.png", alt: "MedlinePlus" },
  { name: "OpenAlex", src: "/logos/OpenAlex.webp", alt: "OpenAlex" },
  { name: "Europe PMC", src: "/logos/europe pmc.png", alt: "Europe PMC" },
  { name: "Semantic Scholar", src: "/logos/Semantic Scholar.png", alt: "Semantic Scholar" },
  { name: "ADA", src: "/logos/American_Diabetes_Association_logo_sans_slogan.svg", alt: "American Diabetes Association" },
  { name: "DailyMed", src: "/logos/DailyMedLogo.png", alt: "DailyMed - FDA Drug Labels" },
  { name: "AAP", src: "/logos/AAP.jpg", alt: "American Academy of Pediatrics" },
];

export function EvidenceLogosScroll() {
  // Triple the logos for seamless infinite loop
  const triplicatedLogos = [...evidenceLogos, ...evidenceLogos, ...evidenceLogos];
  
  // Calculate total width: each logo is 96px (w-24) + 32px gap (gap-8)
  const logoWidth = 128; // 96px + 32px gap
  const totalWidth = logoWidth * evidenceLogos.length;

  return (
    <div className="w-full overflow-hidden py-6">
      <div className="relative flex">
        <motion.div
          className="flex gap-8 items-center"
          animate={{
            x: [-totalWidth, 0],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40, // Slower, smoother scroll
              ease: "linear",
            },
          }}
        >
          {triplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="shrink-0 w-24 h-16 relative grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300"
              title={logo.alt}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className="object-contain"
                sizes="96px"
                priority={index < evidenceLogos.length}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
