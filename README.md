# 🥗 Pantry Pal — AAA+ AI Food Intelligence

[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-blue.svg)](https://expo.dev)
[![Framework](https://img.shields.io/badge/Framework-React%20Native-61DAFB.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-000020.svg)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ECF8E.svg)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

## 🌟 The Future of Food Management

**Pantry Pal** is not just an inventory tracker; it is a high-performance **AI Supply Chain** for your home. By leveraging **Google Gemini AI** and a robust **Supabase Real-time Backend**, Pantry Pal reduces domestic food waste by up to 40% through predictive analytics and intelligent recipe orchestration.
he application integrates Google Gemini AI to provide advanced cognitive features:

Multi-Object Neural Scanning: Uses Gemini Vision to identify multiple grocery items from a single high-fidelity photo. The AIFoodScanner component processes these images to automatically detect food items and generate metadata.

Automated Metadata & Categorization: Items are automatically tagged into categories like Produce, Dairy, or Meat and enriched with nutritional data.

Context-Aware Recipe Generation: The AI creates gourmet recipes derived exclusively from your current inventory, adapting to available ingredients.

Waste Forecast Engine: A predictive analytics system uses time-series analysis to identify items likely to expire within a 7-day window.

QR Scanning & Household Orchestration
The app focuses on collaborative management through a robust orchestration engine:

Zero-Config Onboarding: New household members can join instantly via QR-code invitations, facilitating a seamless "scan-to-join" loop. The system uses components like BarcodeScanner to handle these interactions.

Atomic Real-time Sync: All data is synchronized across family devices instantly using a Supabase Real-time backend.

Granular Permission Tiers: Secure resource control is maintained through Role-Based Access Control (RBAC), including Owner, Admin, and Member roles.

Core Benefits
Pantry Pal provides several high-performance benefits for home management:

Waste Reduction: Predictive analytics and intelligent orchestration can reduce domestic food waste by up to 40%.

Sustainability Tracking: Users can monitor their ecological impact through visual CO2 offset calculations and "efficiency rings".

Shopping Optimization: An intelligent list engine auto-sorts groceries by supermarket aisle, optimizing transit time and shopping routes.

Hands-Free Cooking: An immersive cooking mode features a high-legibility UI and integrated Voice Synthesis (Text-to-Speech) for guided, step-by-step preparation.




---

## ✨ Enterprise-Grade Features

### 🤖 **AI-Vision & Recognition**

- **Multi-Object Scanning**: Google Gemini Vision to identify entire grocery hauls from a single photo.
- **Auto-Categorization**: Automatic tagging of items (Produce, Dairy, Meat) using AI metadata.
- **Confidence Scoring**: Real-time validation of scanned items with high-fidelity visual feedback.

### 🏠 **Household Orchestration**

- **Real-time Sync**: Collaborative pantry management for families via Supabase Real-time.
- **QR-Code Invitations**: Seamlessly invite household members with an instant scan-to-join loop.
- **Permission Tiers**: Owner, Admin, and Member roles for secure inventory control.

### 🍳 **Chef AI & Immersive Cooking**

- **Inventory-Based Recipes**: AI generates gourmet recipes based _only_ on what is currently in your fridge.
- **Immersive Cooking Mode**: A high-legibility, hands-free UI featuring **Voice Synthesis (Text-to-Speech)** to guide you step-by-step.
- **Aisle-Based Shopping**: The only list engine that automatically sorts your groceries by supermarket aisle to optimize your shopping route.

### 📊 **Predictive Analytics**

- **Waste Forecast Engine**: Predicts which items will expire in the next 7 days using time-series analysis.
- **Impact Scoring**: Track your sustainability progress with CO2 offset calculations and efficiency rings.
- **Spending Insights**: High-density Bento-style visualizations of your consumption patterns.

---

## 🛠️ Technical Architecture

### **Core Frontend Stack**

- **Framework**: React Native 0.79 (Hermes Engine)
- **SDK**: Expo 53 (Managed Workflow)
- **State Management**: TanStack Query (React Query) v5
- **Animations**: React Native Reanimated 3 (Spring Physics)
- **Navigation**: Expo Router v4 (File-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)

### **Cloud & Intelligence**

- **Database/Auth**: Supabase (PostgreSQL + RLS)
- **AI Engine**: Google Gemini Pro Vision API / OpenAI GPT-4o
- **Backend Logic**: Supabase Edge Functions (Deno Runtime)
- **Push Engine**: Expo Notifications (FCM / APNs)
