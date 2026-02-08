import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/start-learning" element={<StartLearning />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/problem-assessment" element={<ProblemSolvingAssessment />} />
        <Route path="/service-assessment" element={<ServiceBasedAssessment />} />
        <Route path="/service-selection" element={<ServiceCompanySelection />} />
        <Route path="/product-selection" element={<ProductCompanySelection />} />
        <Route path="/product-assessment" element={<ProductBasedAssessment />} />
        <Route path="/product-assessment" element={<ProductBasedAssessment />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
