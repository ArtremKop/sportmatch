import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Navbar } from "./components/Navbar";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Home } from "./pages/Home";
import { CreateGame } from "./pages/CreateGame";
import { EditGame } from "./pages/EditGame";
import { GameDetail } from "./pages/GameDetail";
import { Profile } from "./pages/Profile";
import { MyGames } from "./pages/MyGames";

function Private({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="p-4 text-sm text-slate-500">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Private>
              <Home />
            </Private>
          }
        />
        <Route
          path="/games/new"
          element={
            <Private>
              <CreateGame />
            </Private>
          }
        />
        <Route
          path="/games/:id/edit"
          element={
            <Private>
              <EditGame />
            </Private>
          }
        />
        <Route
          path="/games/:id"
          element={
            <Private>
              <GameDetail />
            </Private>
          }
        />
        <Route
          path="/profile"
          element={
            <Private>
              <Profile />
            </Private>
          }
        />
        <Route
          path="/my-games"
          element={
            <Private>
              <MyGames />
            </Private>
          }
        />
      </Routes>
    </div>
  );
}
