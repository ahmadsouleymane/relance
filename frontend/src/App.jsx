import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Apercu from "./pages/Apercu.jsx";
import Contacts from "./pages/Contacts.jsx";
import ContactDetail from "./pages/ContactDetail.jsx";
import Tags from "./pages/Tags.jsx";
import Connect from "./pages/Connect.jsx";
import Relances from "./pages/Relances.jsx";
import Billing from "./pages/Billing.jsx";
import Catalog from "./pages/Catalog.jsx";
import Storefront from "./pages/Storefront.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoicePublic from "./pages/InvoicePublic.jsx";
import Landing from "./pages/Landing.jsx";
import Vendre from "./pages/Vendre.jsx";
import Reglages from "./pages/Reglages.jsx";

function PrivateArea() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  return <AppShell />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/apercu" replace />;
  return children;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/apercu" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/inscription" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/v/:storeSlug" element={<Storefront />} />
      <Route path="/f/:publicToken" element={<InvoicePublic />} />

      <Route element={<PrivateArea />}>
        <Route path="/apercu" element={<Apercu />} />
        <Route path="/relances" element={<Relances />} />

        <Route path="/conversations" element={<Contacts />} />
        <Route path="/conversations/tags" element={<Tags />} />
        <Route path="/conversations/:id" element={<ContactDetail />} />

        <Route path="/vendre" element={<Vendre />}>
          <Route index element={<Navigate to="catalogue" replace />} />
          <Route path="catalogue" element={<Catalog />} />
          <Route path="factures" element={<Invoices />} />
        </Route>

        <Route path="/reglages" element={<Reglages />}>
          <Route path="whatsapp" element={<Connect />} />
          <Route path="abonnement" element={<Billing />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
