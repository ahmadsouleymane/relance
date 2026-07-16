import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Apercu from "./pages/Apercu.jsx";
import Conversations from "./pages/Conversations.jsx";
import ContactDetail from "./pages/ContactDetail.jsx";
import Tags from "./pages/Tags.jsx";
import Connect from "./pages/Connect.jsx";
import Billing from "./pages/Billing.jsx";
import Catalog from "./pages/Catalog.jsx";
import Storefront from "./pages/Storefront.jsx";
import Invoices from "./pages/Invoices.jsx";
import InvoicePublic from "./pages/InvoicePublic.jsx";
import Landing from "./pages/Landing.jsx";
import Vendre from "./pages/Vendre.jsx";
import Reglages from "./pages/Reglages.jsx";
import Verification from "./pages/Verification.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import Messagerie from "./pages/Messagerie.jsx";
import Commandes from "./pages/Commandes.jsx";
import CommandeDetail from "./pages/CommandeDetail.jsx";
import Admin from "./pages/Admin.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import AdminVerifications from "./pages/admin/AdminVerifications.jsx";
import AdminDisputes from "./pages/admin/AdminDisputes.jsx";
import AdminPayouts from "./pages/admin/AdminPayouts.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";

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

        <Route path="/conversations" element={<Conversations />} />
        <Route path="/conversations/tags" element={<Tags />} />
        <Route path="/conversations/:id" element={<ContactDetail />} />

        <Route path="/vendre" element={<Vendre />}>
          <Route index element={<Navigate to="catalogue" replace />} />
          <Route path="catalogue" element={<Catalog />} />
          <Route path="factures" element={<Invoices />} />
        </Route>

        <Route path="/verification" element={<Verification />} />
        <Route path="/marche" element={<Marketplace />} />
        <Route path="/messagerie" element={<Messagerie />} />
        <Route path="/messagerie/:id" element={<Messagerie />} />
        <Route path="/commandes" element={<Commandes />} />
        <Route path="/commandes/:id" element={<CommandeDetail />} />

        <Route path="/admin" element={<Admin />}>
          <Route index element={<AdminOverview />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="litiges" element={<AdminDisputes />} />
          <Route path="paiements" element={<AdminPayouts />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
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
