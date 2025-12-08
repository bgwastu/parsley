import { X } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dropzone,
	DropzoneContent,
	DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import type { PageRange } from "@/types/settings";

interface DocumentUploadProps {
	value: File | null;
	onChange: (file: File | null) => void;
	pageRange?: PageRange;
	onPageRangeChange?: (pageRange: PageRange) => void;
	onFileUploaded?: (file: File) => void;
}

export function DocumentUpload({
	value,
	onChange,
	pageRange,
	onPageRangeChange,
	onFileUploaded,
}: DocumentUploadProps) {
	const pageStartId = useId();
	const pageEndId = useId();

	const handleDrop = (acceptedFiles: File[]) => {
		if (acceptedFiles.length > 0) {
			const file = acceptedFiles[0];
			onChange(file);
			onFileUploaded?.(file);
		}
	};

	const handleClear = () => {
		onChange(null);
	};

	const isPDF = value?.type === "application/pdf";

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">Upload Document</h3>
				{value && (
					<Button
						variant="outline"
						size="sm"
						onClick={handleClear}
						className="h-8"
					>
						<X className="h-4 w-4 mr-1" />
						Clear
					</Button>
				)}
			</div>
			<Dropzone
				accept={{
					"application/pdf": [".pdf"],
					"image/*": [".png", ".jpg", ".jpeg", ".webp"],
				}}
				maxFiles={1}
				onDrop={handleDrop}
				src={value ? [value] : undefined}
			>
				<DropzoneEmptyState />
				<DropzoneContent />
			</Dropzone>

			{isPDF && pageRange && onPageRangeChange && (
				<div className="space-y-2 pb-4 border-b">
					<div className="flex items-center gap-2">
						<div className="flex-1 space-y-1">
							<Label htmlFor={pageStartId} className="text-xs">
								Start Page
							</Label>
							<Input
								id={pageStartId}
								type="number"
								min={1}
								value={pageRange.start}
								onChange={(e) =>
									onPageRangeChange({
										...pageRange,
										start: Number.parseInt(e.target.value, 10) || 1,
									})
								}
							/>
						</div>
						<div className="flex-1 space-y-1">
							<Label htmlFor={pageEndId} className="text-xs">
								End Page (empty = all)
							</Label>
							<Input
								id={pageEndId}
								type="number"
								min={1}
								value={pageRange.end ?? ""}
								onChange={(e) =>
									onPageRangeChange({
										...pageRange,
										end: e.target.value
											? Number.parseInt(e.target.value, 10)
											: null,
									})
								}
								placeholder="All pages"
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
