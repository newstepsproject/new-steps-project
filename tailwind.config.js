/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			gpt: {
  				primary: '#F97C5D',
  				secondary: '#4EA8DE', 
  				highlight: '#4ECDC4',
  				text: '#0D1B2A',
  				bg: '#FCF8F5'
  			},
  			brand: {
  				'50': '#e6f0fa',
  				'100': '#cce0f5',
  				'200': '#99c2eb',
  				'300': '#66a3e0',
  				'400': '#3385d6',
  				'500': '#0057A0',
  				'600': '#004e90',
  				'700': '#00427a',
  				'800': '#003764',
  				'900': '#002c50',
  				DEFAULT: '#0057A0'
  			},
  			energy: {
  				'50': '#fef2ee',
  				'100': '#fde5dd',
  				'200': '#fbccbb',
  				'300': '#f9b298',
  				'400': '#f69876',
  				'500': '#F25C2D',
  				'600': '#da5328',
  				'700': '#b54522',
  				'800': '#90371b',
  				'900': '#752c16',
  				DEFAULT: '#F25C2D'
  			},
  			success: {
  				'50': '#ecfdf5',
  				'100': '#d1fae5',
  				'200': '#a7f3d0',
  				'300': '#6ee7b7',
  				'400': '#34d399',
  				'500': '#10b981',
  				'600': '#059669',
  				'700': '#047857',
  				'800': '#065f46',
  				'900': '#064e3b',
  				DEFAULT: '#10b981'
  			},
  			offwhite: {
  				'100': '#fefcfb',
  				'200': '#fdfaf7',
  				'300': '#fcf7f3',
  				'400': '#fbf5ef',
  				'500': '#FDF9F3',
  				'600': '#e3dfd9',
  				'700': '#cac6c0',
  				'800': '#b1aea7',
  				'900': '#97948e',
  				DEFAULT: '#FDF9F3'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-poppins)',
  				'Poppins',
  				'Montserrat',
  				'Inter',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-poppins)',
  				'Poppins',
  				'Montserrat',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			],
  			body: [
  				'var(--font-poppins)',
  				'Poppins',
  				'Inter',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: 0
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: 0
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(20px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fadeIn': 'fadeIn 0.5s ease-out',
  			'slideUp': 'slideUp 0.5s ease-out'
  		},
  		boxShadow: {
  			soft: '0 4px 20px -2px rgba(0, 0, 0, 0.06)',
  			card: '0 8px 30px rgba(0, 0, 0, 0.08)',
  			highlight: '0 0 0 2px rgba(33, 60, 66, 0.2)'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'texture-dots': 'url("/images/texture-dots.svg")'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}; 