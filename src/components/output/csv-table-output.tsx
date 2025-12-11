import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Check, Copy, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { jsonToCsv } from "@/lib/csv";

interface CsvTableOutputProps {
	data: Record<string, unknown>[];
	currentPage: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: number) => void;
}

export function CsvTableOutput({
	data,
	currentPage,
	pageSize,
	onPageChange,
	onPageSizeChange,
}: CsvTableOutputProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [copied, setCopied] = useState(false);

	const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
		if (data.length === 0) return [];
		const keys = Object.keys(data[0]);
		return keys.map((key) => ({
			accessorKey: key,
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="h-8 px-2"
				>
					{key}
					<ArrowUpDown className="ml-2 h-3 w-3" />
				</Button>
			),
			cell: (info) => {
				const value = info.getValue();
				return value !== undefined && value !== null ? String(value) : "";
			},
		}));
	}, [data]);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		onGlobalFilterChange: setGlobalFilter,
		state: {
			sorting,
			globalFilter,
			pagination: {
				pageIndex: currentPage - 1,
				pageSize,
			},
		},
	});

	useEffect(() => {
		table.setPageIndex(currentPage - 1);
		table.setPageSize(pageSize);
	}, [currentPage, pageSize, table]);

	const handleCopy = async () => {
		const csv = jsonToCsv(data);
		await navigator.clipboard.writeText(csv);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		const csv = jsonToCsv(data);
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "output.csv";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	if (data.length === 0) {
		return (
			<div className="text-center text-muted-foreground py-8">
				No data to display
			</div>
		);
	}

	const paginatedRows = table.getRowModel().rows;
	const totalPages = table.getPageCount();

	return (
		<div className="space-y-4 motion-preset-slide-up-sm w-full">
			<div className="flex items-center justify-between">
				<Input
					placeholder="Search all columns..."
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-sm"
				/>
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
						Export CSV
					</Button>
				</div>
			</div>

			<div className="rounded-md border w-full overflow-auto max-h-[600px]">
				<table className="caption-bottom text-sm">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="min-w-[100px] sticky top-0 bg-background z-10">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{paginatedRows.length > 0 ? (
							paginatedRows.map((row) => (
								<TableRow
									key={row.id}
									data-state=""
									className="motion-preset-fade-sm"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="min-w-[100px]">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</table>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Select
						value={pageSize.toString()}
						onValueChange={(value) => {
							onPageSizeChange(Number(value));
							onPageChange(1);
						}}
					>
						<SelectTrigger className="w-[70px] h-8">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="10">10</SelectItem>
							<SelectItem value="25">25</SelectItem>
							<SelectItem value="50">50</SelectItem>
							<SelectItem value="100">100</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{totalPages > 1 && (
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
				)}
			</div>
		</div>
	);
}
