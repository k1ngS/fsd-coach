export type FullstackCombination =
  | "next-fastapi"
  | "react-fastapi"
  | "vue-fastapi"
  | "next-express"
  | "react-express";

export interface FullstackConfig {
  name: string;
  description: string;
  frontend: string;
  backend: string;
  recommended?: boolean;
}

export const FULLSTACK_COMBINATIONS: Record<
  FullstackCombination,
  FullstackConfig
> = {
  "next-fastapi": {
    name: "Next.js + FastAPI",
    description: "React frontend with Python backend",
    frontend: "next-app",
    backend: "fastapi",
    recommended: true,
  },
  "react-fastapi": {
    name: "React + FastAPI",
    description: "React SPA with Python backend",
    frontend: "react-vite",
    backend: "fastapi",
  },
  "vue-fastapi": {
    name: "Vue 3 + FastAPI",
    description: "Vue SPA with Python backend",
    frontend: "vue-vite",
    backend: "fastapi",
  },
  "next-express": {
    name: "Next.js + Express",
    description: "Full TypeScript stack",
    frontend: "next-app",
    backend: "express",
  },
  "react-express": {
    name: "React + Express",
    description: "React SPA with Express backend",
    frontend: "react-vite",
    backend: "express",
  },
};
