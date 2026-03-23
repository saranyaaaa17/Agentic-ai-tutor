import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import StartLearning from "./pages/StartLearning";
import Assessment from "./assessment/Assessment";
import ProblemSolvingAssessment from "./assessment/ProblemSolvingAssessment";
import ServiceBasedAssessment from "./assessment/ServiceBasedAssessment";
import ServiceCompanySelection from "./assessment/ServiceCompanySelection";
import ProductCompanySelection from "./assessment/ProductCompanySelection";
import ProductBasedAssessment from "./assessment/ProductBasedAssessment";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CodePage from "./pages/CodePage";
import DailyChallengePage from "./pages/DailyChallengePage";
import Socratic from "./components/chat/Socratic";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactSupport from "./pages/ContactSupport";

import { SettingsProvider } from "./context/SettingsContext";

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<ContactSupport />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/start-learning" element={<Navigate to="/dashboard" replace />} />
        <Route path="/assessment" element={
          <ProtectedRoute>
            <Assessment />
          </ProtectedRoute>
        } />
        <Route path="/problem-assessment" element={
          <ProtectedRoute>
            <ProblemSolvingAssessment />
          </ProtectedRoute>
        } />
        <Route path="/service-assessment" element={
          <ProtectedRoute>
            <ServiceBasedAssessment />
          </ProtectedRoute>
        } />
        <Route path="/service-selection" element={
          <ProtectedRoute>
            <ServiceCompanySelection />
          </ProtectedRoute>
        } />
        <Route path="/product-selection" element={
          <ProtectedRoute>
             <ProductCompanySelection />
          </ProtectedRoute>
        } />
        <Route path="/product-assessment" element={
          <ProtectedRoute>
             <ProductBasedAssessment />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/code" element={
          <ProtectedRoute>
            <CodePage />
          </ProtectedRoute>
        } />
        <Route path="/daily-challenge" element={
          <ProtectedRoute>
            <DailyChallengePage />
          </ProtectedRoute>
        } />
      </Routes>
      <Socratic />
    </BrowserRouter>
  </SettingsProvider>
  );
}

export default App;
