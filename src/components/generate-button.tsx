import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
	onClick: () => void;
	isLoading: boolean;
	disabled: boolean;
	hasDocument: boolean;
	hasSchema: boolean;
}

export function GenerateButton({
	onClick,
	isLoading,
	disabled,
	hasDocument,
	hasSchema,
}: GenerateButtonProps) {
	return (
		<div className="space-y-3 motion-preset-fade-sm">
			<Button
				onClick={onClick}
				disabled={disabled || isLoading || !hasDocument || !hasSchema}
				size="lg"
				className="w-full relative"
			>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Parsing Document...
					</>
				) : (
					<>
						<Sparkles className="h-4 w-4 mr-2" />
						Parse Document
					</>
				)}
			</Button>

			{!hasDocument && (
				<p className="text-xs text-muted-foreground text-center">
					Upload a document to continue
				</p>
			)}
			{hasDocument && !hasSchema && (
				<p className="text-xs text-muted-foreground text-center">
					Define a schema to continue
				</p>
			)}
		</div>
	);
}
