/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: "class", // Enables dark mode via a CSS class
	content: [
	  './pages/**/*.{ts,tsx}',      // Includes all TS and TSX files in pages
	  './components/**/*.{ts,tsx}', // Includes all TS and TSX files in components
	  './app/**/*.{ts,tsx}',        // Includes all TS and TSX files in app
	  './src/**/*.{ts,tsx}',        // Includes all TS and TSX files in src
	],
	theme: {
	  container: {
		center: true,            // Centers the container
		padding: "2rem",         // Adds horizontal padding
		screens: {
		  "2xl": "1400px",       // Custom breakpoint for 2xl screens
		},
	  },
	  extend: {
		colors: {
		  // Retained shadcn essential colors using CSS variables
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "hsl(var(--primary))",
			foreground: "hsl(var(--primary-foreground))",
		  },
		  secondary: {
			DEFAULT: "hsl(var(--secondary))",
			foreground: "hsl(var(--secondary-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		  },
		  popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		  },
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		  // Retained neon colors as per your addition
		  'neon-blue': '#00FFFF',
		  'neon-green': '#39FF14',
		  'neon-pink': '#FF10F0',
		  'neon-yellow': '#FFFF00',
		},
		borderRadius: {
		  // Maintained borderRadius settings for consistency with shadcn components
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
		keyframes: {
		  // Retained keyframes for accordion animations if used by shadcn components
		  "accordion-down": {
			from: { height: 0 },
			to: { height: "var(--radix-accordion-content-height)" },
		  },
		  "accordion-up": {
			from: { height: "var(--radix-accordion-content-height)" },
			to: { height: 0 },
		  },
		},
		animation: {
		  // Retained animations corresponding to keyframes
		  "accordion-down": "accordion-down 0.2s ease-out",
		  "accordion-up": "accordion-up 0.2s ease-out",
		},
	  },
	},
	plugins: [
	  require("tailwindcss-animate"), // Keeps the animate plugin for animations
	  // Remove any additional plugins that are not being used
	],
  }
  