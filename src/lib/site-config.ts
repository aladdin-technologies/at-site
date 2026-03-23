export const siteConfig = {
  name: "Airportronics",
  tagline: "The Intelligence Layer for Global Airports",
  description:
    "Global airport intelligence and strategy platform. Benchmarking, live performance tracking, charges intelligence, advisory, and research — for aviation leaders worldwide.",
  url: "https://airportronics.com",
  company: {
    legal: "Aladdin Technologies Ltd",
    address: [
      "7 Kent House",
      "Stratton Close",
      "Edgware",
      "London",
      "HA8 6PR",
      "United Kingdom",
    ],
    registration: "16170227",
  },
  nav: [
    { label: "Platform", href: "#platform" },
    { label: "Books", href: "#books" },
    { label: "Benchmarking", href: "#benchmarking" },
    { label: "Intelligence", href: "#intelligence" },
    { label: "Advisory", href: "#advisory" },
    { label: "Research", href: "#research" },
  ],
  footer: {
    platform: [
      { label: "Benchmarking", href: "#benchmarking" },
      { label: "Live Intelligence", href: "#intelligence" },
      { label: "Charges Database", href: "#charges" },
      { label: "Advisory", href: "#advisory" },
    ],
    resources: [
      { label: "Research Reports", href: "#research" },
      { label: "Book Series", href: "#books" },
      { label: "Case Studies", href: "#" },
      { label: "Methodology", href: "#" },
    ],
    company: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
} as const;
