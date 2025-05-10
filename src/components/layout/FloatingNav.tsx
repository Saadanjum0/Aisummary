
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, PlusCircle, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const FloatingNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("");

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") {
      setActiveItem("home");
    } else if (path.startsWith("/search")) {
      setActiveItem("search");
    } else if (path.startsWith("/create") || path.startsWith("/import")) {
      setActiveItem("create");
    } else if (path.startsWith("/tags")) {
      setActiveItem("tags");
    } else if (path.startsWith("/profile")) {
      setActiveItem("profile");
    } else {
      setActiveItem("");
    }
  }, [location]);

  const navItems = [
    { name: "home", icon: Home, path: "/" },
    { name: "search", icon: Search, path: "/search" },
    { name: "create", icon: PlusCircle, path: "/create" },
    { name: "tags", icon: Tag, path: "/tags" },
    { name: "profile", icon: User, path: "/profile" },
  ];

  return (
    <div className="floating-nav shadow-glass animate-slide-up">
      {navItems.map((item) => (
        <div
          key={item.name}
          onClick={() => navigate(item.path)}
          className={cn(
            "nav-icon",
            activeItem === item.name && "active"
          )}
          title={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
        >
          <item.icon className="h-6 w-6" />
        </div>
      ))}
    </div>
  );
};

export default FloatingNav;
