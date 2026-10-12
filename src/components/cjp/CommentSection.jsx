// src/components/cjp/CommentSection.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { FaComment, FaReply, FaTrash, FaSpinner } from "react-icons/fa";
import { ROLE_LABELS } from "@/lib/roles";

export default function CommentSection({
  articleId,
  initialComments,
  canComment,
  currentUserId,
}) {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /* ── Post a top-level comment ─────────────────────────────── */
  const postTopLevel = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cjp/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── Post a reply ─────────────────────────────────────────── */
  const postReply = async (parentId) => {
    if (!replyText.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/cjp/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: replyText.trim(), parent: parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setComments((prev) => [...prev, data.comment]);
      setReplyTo(null);
      setReplyText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── Delete a comment ─────────────────────────────────────── */
  const remove = async (id) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cjp/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Échec");
      }
      setComments((prev) =>
        prev.filter((c) => c._id !== id && c.parent !== id)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ── Group by parent ──────────────────────────────────────── */
  const roots = comments.filter((c) => !c.parent);
  const repliesOf = (parentId) => comments.filter((c) => c.parent === parentId);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FaComment className="text-emerald-600" />
        <h2 className="font-serif text-lg font-bold text-gray-900">
          Discussion ({comments.length})
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* New comment form */}
      {canComment ? (
        <form onSubmit={postTopLevel} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Partagez votre analyse, posez une question…"
            rows={3}
            maxLength={5000}
            className="w-full resize-y rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={busy || !newComment.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy && <FaSpinner className="animate-spin" />}
              Publier
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          <Link href="/auth/login" className="font-medium text-emerald-700 hover:underline">
            Connectez-vous
          </Link>{" "}
          pour participer à la discussion.
        </div>
      )}

      {/* Comments list */}
      {roots.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Aucun commentaire pour le moment. Soyez le premier à réagir.
        </p>
      ) : (
        <ul className="space-y-5">
          {roots.map((c) => (
            <li key={c._id}>
              <CommentItem
                comment={c}
                currentUserId={currentUserId}
                onDelete={remove}
                onReply={() => setReplyTo(replyTo === c._id ? null : c._id)}
                canComment={canComment}
              />

              {/* Replies */}
              {repliesOf(c._id).length > 0 && (
                <ul className="ml-6 mt-4 space-y-4 border-l-2 border-gray-100 pl-4">
                  {repliesOf(c._id).map((r) => (
                    <li key={r._id}>
                      <CommentItem
                        comment={r}
                        currentUserId={currentUserId}
                        onDelete={remove}
                        canComment={canComment}
                        isReply
                      />
                    </li>
                  ))}
                </ul>
              )}

              {/* Reply form */}
              {replyTo === c._id && canComment && (
                <div className="ml-6 mt-3 border-l-2 border-emerald-200 pl-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Votre réponse…"
                    rows={2}
                    maxLength={5000}
                    className="w-full resize-y rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyText("");
                      }}
                      className="rounded px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => postReply(c._id)}
                      disabled={busy || !replyText.trim()}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Répondre
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({ comment, currentUserId, onDelete, onReply, canComment, isReply = false }) {
  const isOwner = currentUserId && comment.author._id === currentUserId;

  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700">
        {comment.author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.author.avatar} alt={comment.author.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
            {comment.author.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {comment.author.name}
          </span>
          {comment.author.role && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
              {ROLE_LABELS[comment.author.role] || comment.author.role}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {comment.content}
        </p>

        <div className="mt-2 flex items-center gap-3 text-xs">
          {canComment && !isReply && (
            <button
              type="button"
              onClick={onReply}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-emerald-700"
            >
              <FaReply /> Répondre
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(comment._id)}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600"
            >
              <FaTrash /> Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
