import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import { FormField } from "../../components/ui/FormField";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/http";

export default function AdminCreateStaff() {
	const { adminRegister } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState("creator");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	async function onSubmit(e) {
		e.preventDefault();
		setLoading(true);
		setError("");
		setSuccess("");
		try {
			await adminRegister(name, email, password, role);
			setSuccess("Staff user created");
			setName("");
			setEmail("");
			setPassword("");
			setRole("creator");
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<PageHeader
				title="Create Staff"
				subtitle="Admin can create admin/creator/viewer accounts."
			/>
			{error ? <Alert type="error">{error}</Alert> : null}
			{success ? (
				<div className="mt-2">
					<Alert type="success">{success}</Alert>
				</div>
			) : null}

			<div className="max-w-xl">
				<Card title="New Staff Account">
					<form className="space-y-3" onSubmit={onSubmit}>
						<FormField label="Name">
							<Input value={name} onChange={(e) => setName(e.target.value)} required />
						</FormField>
						<FormField label="Email">
							<Input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</FormField>
						<FormField label="Password">
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</FormField>
						<FormField label="Role">
							<select
								className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
								value={role}
								onChange={(e) => setRole(e.target.value)}
							>
								<option value="creator">creator</option>
								<option value="viewer">viewer</option>
								<option value="admin">admin</option>
							</select>
						</FormField>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? "Creating..." : "Create"}
						</Button>
					</form>
				</Card>
			</div>
		</div>
	);
}
