// Hardcoded list of Indian cities
export const    INDIAN_CITIES = [
  "Ahmedabad",
  "Bangalore",
  "Bhopal",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Delhi",
  "Pune",
  "Hyderabad",
  "Indore",
  "Jaipur",
  "Kanpur",
  "Kolkata",
  "Lucknow",
  "Mumbai",
  "Nagpur",
  "Nashik",
  "Patna",
  "Surat",
  "Vadodara",
  "Visakhapatnam",
  "Aurangabad",
  "Bhubaneswar",
  "Ghaziabad",
  "Kochi",
  "Nashik",
  "Vadodara",
  "Khandwa",
  "Gwalior"
];

// Validate if a city is in the allowed list (case-insensitive)
export const isValidCity = (city) => {
  if (!city || typeof city !== "string") return false;
  return INDIAN_CITIES.some((c) => c.toLowerCase() === city.trim().toLowerCase());
};

// Validate array of cities
export const areValidCities = (cities) => {
  if (!Array.isArray(cities)) return false;
  return cities.every((c) => isValidCity(c));
};
