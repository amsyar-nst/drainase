# AI Rules for Lovable Project

This document outlines the technical stack and specific library usage guidelines for this project to ensure consistency, maintainability, and adherence to best practices.

## Tech Stack Overview

*   **Frontend Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **UI Component Library:** shadcn/ui (built on Radix UI)
*   **Styling Framework:** Tailwind CSS
*   **Routing:** React Router DOM
*   **Backend as a Service (BaaS):** Supabase (for database, authentication, and storage)
*   **Data Fetching & Caching:** TanStack Query
*   **Date Manipulation:** date-fns
*   **Icons:** Lucide React
*   **Toast Notifications:** Sonner

## Library Usage Guidelines

To maintain a consistent and efficient codebase, please adhere to the following rules when developing:

1.  **UI Components:**
    *   **Always prioritize `shadcn/ui` components.** These are pre-styled with Tailwind CSS and provide accessibility features.
    *   If a required component is not available in `shadcn/ui` or needs significant deviation from its default behavior, create a **new component** in `src/components/` and style it using Tailwind CSS. **Do not modify existing `shadcn/ui` component files directly.**

2.  **Styling:**
    *   **Use Tailwind CSS exclusively** for all styling. Avoid writing custom CSS classes in separate `.css` files (except for `src/index.css` for global styles) or using inline styles unless absolutely necessary for dynamic values.
    *   Ensure designs are **responsive** by utilizing Tailwind's responsive utility classes.

3.  **Routing:**
    *   All client-side routing must be handled using **`react-router-dom`**.
    *   Define all main application routes within `src/App.tsx`.

4.  **Backend & Data Management:**
    *   **Supabase** is the designated backend for database operations, authentication, and file storage. Interact with Supabase using the client configured in `src/integrations/supabase/client.ts`.
    *   For server state management and data fetching, use **`@tanstack/react-query`**. This helps with caching, synchronization, and error handling for asynchronous data.

5.  **Date Handling:**
    *   All date formatting, parsing, and manipulation should be done using **`date-fns`**.

6.  **Icons:**
    *   Use icons from the **`lucide-react`** library.

7.  **Toast Notifications:**
    *   For displaying user feedback messages (success, error, info, loading), use the **`sonner`** toast library.

8.  **Form Handling:**
    *   For building forms and handling validation, continue to use **`react-hook-form`** in conjunction with **`zod`** for schema validation.

9.  **File Structure:**
    *   Place pages in `src/pages/`.
    *   Place reusable components in `src/components/`.
    *   Keep directory names all lower-case.

10. **Code Quality:**
    *   Strive for simple, elegant, and readable code. Avoid over-engineering.
    *   Ensure all new components are created in their own dedicated files.
    *   Implement features fully; avoid placeholders or partial implementations.