import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { getSocket } from "../api/socket.js";
import { useAuth } from "../context/AuthContext.jsx";
import { IconArrowRight } from "../components/icons.jsx";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function formatFcfa(n) {
  return `${n.toLocaleString("fr-FR")} F`;
}

export default function Messagerie() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
  const [messages, setMessages] = useState(null);
  const [text, setText] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const loadConversations = useCallback(() => {
    api.get("/conversations").then((d) => setConversations(d.conversations));
  }, []);

  const loadMessages = useCallback(() => {
    if (!id) return;
    api.get(`/conversations/${id}/messages`).then((d) => setMessages(d.messages));
  }, [id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setMessages(null);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onMessage = ({ conversationId, message }) => {
      if (conversationId === id) setMessages((prev) => (prev ? [...prev, message] : prev));
      loadConversations();
    };
    socket.on("message:new", onMessage);
    return () => socket.off("message:new", onMessage);
  }, [id, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const conversation = conversations?.find((c) => c._id === id);
  const isVendor = conversation && conversation.vendor?._id === user?._id;

  const send = async (e) => {
    e.preventDefault();
    setError("");
    if (!text.trim() && !offerPrice) return;
    try {
      const payload = { text: text.trim() || `Offre : ${offerPrice} FCFA` };
      if (isVendor && offerPrice) payload.offerPrice = Number(offerPrice);
      const { message } = await api.post(`/conversations/${id}/messages`, payload);
      setMessages((prev) => [...(prev || []), message]);
      setText("");
      setOfferPrice("");
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  const acceptOffer = async (messageId) => {
    setError("");
    try {
      const { order } = await api.post("/orders", { offerMessageId: messageId });
      navigate(`/commandes/${order._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
      <div className="stack" style={{ flex: id ? "0 0 260px" : 1, minWidth: 0 }}>
        <h1 className="display-2">Messagerie</h1>
        {!conversations && <p className="text-muted">Chargement…</p>}
        {conversations?.length === 0 && (
          <div className="empty">
            <div className="h2">Aucune conversation</div>
            <p>Contacte un vendeur depuis le marché pour démarrer une discussion.</p>
          </div>
        )}
        {conversations?.length > 0 && (
          <ul className="card--tight" style={{ border: "1.5px solid var(--line)", borderRadius: 20, background: "var(--paper-raised)" }}>
            {conversations.map((c) => {
              const other = c.vendor?._id === user?._id ? c.buyer : c.vendor;
              return (
                <li key={c._id}>
                  <Link to={`/messagerie/${c._id}`} className="contact-row">
                    <div className="avatar">{initialsOf(other?.businessName)}</div>
                    <div className="contact-row__body">
                      <div className="contact-row__top">
                        <span className="contact-row__name">{other?.businessName}</span>
                      </div>
                      <div className="contact-row__preview">{c.product?.name}{c.lastMessagePreview ? ` — ${c.lastMessagePreview}` : ""}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {id && (
        <div className="card stack" style={{ flex: 1, minWidth: 0, minHeight: 480 }}>
          {conversation && (
            <div className="row row--between" style={{ borderBottom: "1.5px solid var(--line)", paddingBottom: 10 }}>
              <strong>{isVendor ? conversation.buyer?.businessName : conversation.vendor?.businessName}</strong>
              {conversation.product && <span className="pill">{conversation.product.name} · {formatFcfa(conversation.product.price)}</span>}
            </div>
          )}

          <div className="stack--sm" style={{ flex: 1, overflowY: "auto", maxHeight: 380 }}>
            {!messages && <p className="text-muted">Chargement…</p>}
            {messages?.map((m) => {
              const mine = m.sender === user?._id || m.sender?._id === user?._id;
              return (
                <div key={m._id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                  <div
                    style={{
                      background: mine ? "var(--accent)" : "var(--paper-raised)",
                      color: mine ? "var(--accent-ink)" : "inherit",
                      border: "1.5px solid var(--line-soft)",
                      borderRadius: 12,
                      padding: "8px 12px",
                      fontSize: 13.5,
                    }}
                  >
                    {m.text}
                  </div>
                  {m.offerPrice != null && !mine && (
                    <button className="btn btn--primary btn--sm" style={{ marginTop: 6 }} type="button" onClick={() => acceptOffer(m._id)}>
                      Accepter l'offre — {formatFcfa(m.offerPrice)}
                    </button>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {error && <p className="field-error">{error}</p>}

          <form className="row" style={{ gap: 8 }} onSubmit={send}>
            <input
              style={{ flex: 1 }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrire un message…"
            />
            {isVendor && (
              <input
                type="number"
                min="0"
                style={{ width: 120 }}
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Offre FCFA"
              />
            )}
            <button className="btn btn--primary btn--icon" type="submit" aria-label="Envoyer">
              <IconArrowRight width={18} height={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
