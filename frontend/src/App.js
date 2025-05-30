import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Signup from "./components/Signup";
import Login from "./components/Login";
import EventsPage from "./components/EventsPage";
import CreatePost from "./components/CreatePost";
import MainPage from "./components/MainPage";
import Profile from "./components/Profile";
import RoomRating from "./components/RoomRating";
import Administration from "./components/Administration";
import FeedbackPage from "./components/FeedbackPage";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import ModerationPanel from "./components/ModerationPanel";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/user_login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<MainPage />} />
          <Route path="/profile/:username" element={
    <ProtectedRoute>
        <Profile />
    </ProtectedRoute>
} />
          <Route path="/explore" element={<EventsPage />} />
          <Route path="/create_news" element={<CreatePost />} />
          <Route path="/rating" element={<RoomRating />} />
          <Route path="/administration" element={<Administration />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          
          <Route element={<AdminRoute />}>
            <Route path="/moderation" element={<ModerationPanel />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;