import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Contacts from "./pages/Contacts.jsx";
import ContactDetail from "./pages/ContactDetail.jsx";
import Tags from "./pages/Tags.jsx";
import Connect from "./pages/Connect.jsx";
import Relances from "./pages/Relances.jsx";
import Analytics from "./pages/Analytics.jsx";
import Billing from "./pages/Billing.jsx";
import Catalog from "./pages/Catalog.jsx";
import Storefront from "./pages/Storefront.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoicePublic from "./pages/InvoicePublic.jsx";

function PrivateArea() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  return <AppShell />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/inscription" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/v/:storeSlug" element={<Storefront />} />
      <Route path="/f/:publicToken" element={<InvoicePublic />} />

      <Route element={<PrivateArea />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contacts/tags" element={<Tags />} />
        <Route path="/contacts/:id" element={<ContactDetail />} />
        <Route path="/relances" element={<Relances />} />
        <Route path="/catalogue" element={<Catalog />} />
        <Route path="/factures" element={<Invoices />} />
        <Route path="/analytiques" element={<Analytics />} />
        <Route path="/connexion-whatsapp" element={<Connect />} />
        <Route path="/abonnement" element={<Billing />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
