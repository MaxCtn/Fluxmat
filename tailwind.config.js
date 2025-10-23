/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: { colors: { brand: { 600:"#7c3aed", 700:"#6d28d9" } } }
  },
  plugins: [],
}
