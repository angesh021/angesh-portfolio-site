
# Aetherius OS - Interactive Cybersecurity Portfolio

> My personal portfolio, reimagined as a futuristic operating system to showcase my skills in cybersecurity, development, and UI/UX.

This project is more than just a resume; it's a fully interactive experience I designed and built from the ground up. It reflects my passion for creating robust, engaging, and secure digital environments. Welcome to Aetherius OS.

![Aetherius OS Screenshot](https://i.imgur.com/your-screenshot-url.png) 
*(Replace this with a link to a screenshot or GIF of your portfolio)*

---

## ✨ Core Features

-   **Aetherius OS Theme:** A unique UI/UX simulating a futuristic operating system, complete with a system bootloader sequence, draggable windows, and interactive sound effects.
-   **CyberSec Dashboard:** An interactive dashboard in the "About" section featuring a live skill profiler and a simulated threat intelligence feed.
-   **Dynamic Dossiers:** In-depth, animated modals for professional experiences and personal projects, providing rich context, impact metrics, and media previews.
-   **Integrated Education Hub:** A unified section presenting academic history on an animated timeline, an interactive holographic carousel for certifications, and a strategic roadmap for future learning.
-   **Secure Contact Form:** A macOS-style contact form featuring floating labels, real-time validation, and a client-side Proof-of-Work mechanism to deter spam bots.
-   **System Settings Panel:** A comprehensive control panel allowing users to customize their experience by toggling themes (light/dark), changing accent colors, enabling/disabling visual effects, and more.
-   **Bilingual Support:** Fully internationalized content supporting both English and French.
-   **Responsive & Accessible:** Designed to be fully responsive across all devices and built with accessibility best practices in mind (ARIA attributes, keyboard navigation).

## 🛠️ Tech Stack

This portfolio was built with a modern, performant, and scalable tech stack:

-   **Frontend:** [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Animation:** [Framer Motion](https://www.framer.com/motion/)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **Form Handling:** Full-stack Express backend integrating [Resend](https://resend.com/) for secure email delivery.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v18 or later recommended)
-   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/angesh021/aetherius-os-portfolio.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd aetherius-os-portfolio
    ```
3.  **Install dependencies:**
    ```sh
    npm install
    ```
4.  **Set up environment variables:**
    This project uses Resend via an Express backend to handle contact form submissions securely.
    
    -   Create a `.env` file in the root of the project.
    -   Add your Resend API key to the file:
        ```
        RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE
        ```
5.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 📂 Project Structure

The project is organized with a clear separation of concerns, making it easy to navigate and maintain.

```
/
├── public/
│   └── # Static assets like resume PDFs
├── src/
│   ├── components/
│   │   ├── layout/   # Header, Footer, Section
│   │   ├── sections/ # Hero, About, Experience, etc.
│   │   └── ui/       # Reusable UI elements (buttons, modals, effects)
│   ├── hooks/
│   │   └── # Custom hooks for theme, i18n, settings, etc.
│   ├── lib/
│   │   ├── data.ts   # Centralized data for experiences, projects, etc.
│   │   └── i18n.ts   # Translation strings
│   ├── styles/
│   │   └── # Global and component-specific CSS
│   ├── types.ts      # TypeScript type definitions
│   └── App.tsx       # Main application component
└── index.html        # Entry point
```

## ✏️ Customization & Content Management

This portfolio is designed to be easily configurable. All personal data, including professional experience, project details, skills, and text content, is centralized in the `/lib` directory:

-   **`lib/data.ts`**: Contains all structured data for experiences, projects, skills, education, and certifications.
-   **`lib/i18n.ts`**: Contains all UI text strings for both English and French.

To adapt this portfolio for your own use, simply modify the content within these two files with your information.

## 📞 Contact

**Angesh Chanderdip**

-   **LinkedIn:** [linkedin.com/in/angesh-chanderdip](https://www.linkedin.com/in/angesh-chanderdip/)
-   **GitHub:** [github.com/angesh021](https://github.com/angesh021)

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
