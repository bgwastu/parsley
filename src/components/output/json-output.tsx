import { Check, Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { downloadJson, formatJson } from "@/lib/json";

interface JsonOutputProps {
	data: object | unknown[];
	currentPage: number;
	onPageChange: (page: number) => void;
}

const ITEMS_PER_PAGE = 10;

export function JsonOutput({
	data,
	currentPage,
	onPageChange,
}: JsonOutputProps) {
	const [copied, setCopied] = useState(false);

	const isArray = Array.isArray(data);
	const totalPages = isArray
		? Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE))
		: 1;
	const paginatedData = useMemo(() => {
		if (!isArray) return data;
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		return data.slice(start, end);
	}, [data, currentPage, isArray]);

	const handleCopy = async () => {
		const jsonString = formatJson(data);
		await navigator.clipboard.writeText(jsonString);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		downloadJson(data, "output.json");
	};

	return (
		<div className="space-y-4 motion-preset-slide-up-sm">
			<div className="flex items-center justify-between">
				<h3 className="font-medium text-sm">JSON Output</h3>
				<div className="flex gap-2">
					<Button variant="outline" size="sm" onClick={handleCopy}>
						{copied ? (
							<>
								<Check className="h-4 w-4 mr-1" />
								Copied
							</>
						) : (
							<>
								<Copy className="h-4 w-4 mr-1" />
								Copy all
							</>
						)}
					</Button>
					<Button variant="outline" size="sm" onClick={handleDownload}>
						<Download className="h-4 w-4 mr-1" />
						Download
					</Button>
				</div>
			</div>

			<div className="border rounded-lg bg-muted/50">
				<pre className="p-4 overflow-x-auto text-sm">
					{formatJson(paginatedData)}
				</pre>
			</div>

			{isArray && data.length > ITEMS_PER_PAGE && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
						{Math.min(currentPage * ITEMS_PER_PAGE, data.length)} of{" "}
						{data.length} items
					</div>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage > 1) {
											onPageChange(currentPage - 1);
										}
									}}
									className={
										currentPage === 1 ? "pointer-events-none opacity-50" : ""
									}
								/>
							</PaginationItem>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map(
								(page) => {
									// Show first page, last page, current page, and pages around current
									if (
										page === 1 ||
										page === totalPages ||
										(page >= currentPage - 1 && page <= currentPage + 1)
									) {
										return (
											<PaginationItem key={page}>
												<PaginationLink
													href="#"
													onClick={(e) => {
														e.preventDefault();
														onPageChange(page);
													}}
													isActive={currentPage === page}
												>
													{page}
												</PaginationLink>
											</PaginationItem>
										);
									}
									if (page === currentPage - 2 || page === currentPage + 2) {
										return (
											<PaginationItem key={page}>
												<span className="px-2">...</span>
											</PaginationItem>
										);
									}
									return null;
								},
							)}
							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={(e) => {
										e.preventDefault();
										if (currentPage < totalPages) {
											onPageChange(currentPage + 1);
										}
									}}
									className={
										currentPage === totalPages
											? "pointer-events-none opacity-50"
											: ""
									}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</div>
	);
}
