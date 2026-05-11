import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API = "http://127.0.0.1:8000/api/users";

function Users() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchUsers = () => {
    setLoading(true);
    fetch(API)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (form) => {
    const res = await fetch(API, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create user");
    await fetchUsers();
  };

  const handleUpdate = async (id, form) => {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update user");
    await fetchUsers();
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      setError("You cannot delete your own account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete user");
      }
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Users</h1>
        <button
          onClick={() => {
            setEditUser(null);
            setModal("add");
          }}
          className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      {modal && (
        <UserFormModal
          mode={modal}
          user={editUser}
          onClose={() => setModal(null)}
          onSubmit={async (form) => {
            if (modal === "add") {
              await handleCreate(form);
            } else {
              await handleUpdate(editUser.id, form);
            }
            setModal(null);
          }}
        />
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="py-10 text-center text-gray-500">No users found</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-4 text-left">ID</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b transition hover:bg-gray-50">
                  <td className="p-4">{user.id}</td>
                  <td className="p-4 font-medium text-gray-700">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.email}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditUser(user);
                          setModal("edit");
                        }}
                        disabled={user.id === currentUser?.id}
                        className={`rounded-lg px-3 py-1 text-sm text-white transition ${
                          user.id === currentUser?.id
                            ? "cursor-not-allowed bg-gray-400"
                            : "cursor-pointer bg-yellow-400 hover:bg-yellow-500"
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={user.id === currentUser?.id}
                        className={`rounded-lg px-3 py-1 text-sm text-white transition ${
                          user.id === currentUser?.id
                            ? "cursor-not-allowed bg-gray-400"
                            : "cursor-pointer bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {user.id === currentUser?.id ? "You" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UserFormModal({ mode, user, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!form.name || !form.email) {
      setErr("Name and email are required");
      return;
    }
    if (mode === "add" && !form.password) {
      setErr("Password is required");
      return;
    }

    setSubmitting(true);
    try {
      const body = { ...form };
      if (mode === "edit" && !body.password) delete body.password;
      await onSubmit(body);
    } catch (err) {
      setErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          {mode === "add" ? "Add User" : "Edit User"}
        </h2>

        {err && (
          <p className="mb-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600">
            {err}
          </p>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {mode === "add" ? "Password" : "Password (leave blank to keep)"}
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : mode === "add" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Users;
