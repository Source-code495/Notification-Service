import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/http";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import { FormField } from "../../components/ui/FormField";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await register(name, email, password);
      setMessage("Registered successfully. Please login.");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Register</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          This creates a regular <span className="font-medium">user</span> account.
        </p>

        {message ? <div className="mt-4"><Alert type="success">{message}</Alert></div> : null}
        {error ? <div className="mt-4"><Alert type="error">{error}</Alert></div> : null}

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <FormField label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </FormField>
          <FormField label="Password">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Already have an account? <Link className="text-slate-900 underline dark:text-slate-50" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
