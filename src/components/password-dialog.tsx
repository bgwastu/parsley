import { Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordDialogProps {
	open: boolean;
	onSubmit: (password: string) => void;
	onCancel: () => void;
	error?: string;
	isValidating?: boolean;
}

export function PasswordDialog({
	open,
	onSubmit,
	onCancel,
	error,
	isValidating = false,
}: PasswordDialogProps) {
	const passwordId = useId();
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = () => {
		if (!password.trim()) {
			return;
		}
		onSubmit(password);
	};

	// Reset password field when dialog opens
	useEffect(() => {
		if (open) {
			setPassword("");
			setShowPassword(false);
		}
	}, [open]);

	// Show error toast when error prop changes
	useEffect(() => {
		if (error) {
			toast.error(error);
		}
	}, [error]);

	return (
		<Dialog 
			open={open} 
			onOpenChange={() => {
				// Prevent closing the dialog - do nothing
			}}
		>
			<DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
				<DialogHeader>
					<DialogTitle>PDF Password Required</DialogTitle>
					<DialogDescription>
						This PDF is password protected. Please enter the password to
						continue.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor={passwordId}>Password</Label>
						<div className="relative">
							<Input
								id={passwordId}
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && !isValidating && handleSubmit()}
								placeholder="Enter PDF password"
								disabled={isValidating}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute top-0 right-0 h-full px-3"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={isValidating}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isValidating || !password.trim()}>
						{isValidating ? "Validating..." : "Submit"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
